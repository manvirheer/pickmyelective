"""Main course fetcher that orchestrates CourSys and SFU Outlines APIs."""

import asyncio
import json
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

from .models import RawCourse, Schedule, CourseOutput
from .coursys import fetch_coursys_courses, CoursysEntry
from .sfu_outlines import fetch_course_outline, get_term_from_semester, OutlineData

console = Console()

# Rate limiting: max concurrent requests to SFU Outlines
MAX_CONCURRENT_OUTLINE_REQUESTS = 10
# Delay between batches to be respectful to the API
BATCH_DELAY_SECONDS = 0.5


class CourseFetcher:
    """Fetches and merges course data from CourSys and SFU Outlines APIs."""

    def __init__(
        self,
        semester: str = "1264",
        output_dir: Path | None = None,
        limit: int | None = None,
    ):
        """
        Initialize the fetcher.

        Args:
            semester: Semester code (e.g., "1264" for Summer 2026)
            output_dir: Directory to save output JSON
            limit: Max number of courses to fetch (for testing)
        """
        self.semester = semester
        self.year, self.term = get_term_from_semester(semester)
        self.output_dir = output_dir or Path(__file__).parent.parent.parent / "data" / "raw"
        self.limit = limit

        # Stats
        self.total_courses = 0
        self.enriched_count = 0
        self.error_count = 0

    async def fetch_all(self) -> CourseOutput:
        """
        Fetch all courses and save to JSON.

        Returns:
            CourseOutput with all fetched courses
        """
        console.print(f"\n[bold blue]Fetching courses for {self.term.title()} {self.year}[/bold blue]")
        console.print(f"Semester code: {self.semester}\n")

        # Step 1: Fetch course list from CourSys
        console.print("[yellow]Step 1:[/yellow] Fetching course list from CourSys...")
        if self.limit:
            console.print(f"  (Limited to {self.limit} courses for testing)")
            coursys_entries = await fetch_coursys_courses(
                self.semester,
                page_size=self.limit,
                max_pages=1,
            )
        else:
            console.print("  (This may take a moment - paginating through results...)")
            coursys_entries = await fetch_coursys_courses(self.semester)
        self.total_courses = len(coursys_entries)
        console.print(f"  Found [green]{self.total_courses}[/green] course sections\n")

        if not coursys_entries:
            console.print("[red]No courses found![/red]")
            return CourseOutput(semester=self.semester, total_courses=0)

        # Step 2: Enrich with SFU Outlines data
        console.print("[yellow]Step 2:[/yellow] Enriching with SFU Outlines data...")
        courses = await self._enrich_courses(coursys_entries)

        # Step 3: Build output
        output = CourseOutput(
            semester=self.semester,
            fetched_at=datetime.now(),
            total_courses=self.total_courses,
            enriched_count=self.enriched_count,
            error_count=self.error_count,
            courses=courses,
        )

        # Step 4: Save to file
        self._save_output(output)

        # Print summary
        console.print("\n[bold green]Fetch complete![/bold green]")
        console.print(f"  Total courses: {self.total_courses}")
        console.print(f"  Enriched with outlines: {self.enriched_count}")
        console.print(f"  Errors/not found: {self.error_count}")

        return output

    async def _enrich_courses(self, entries: list[CoursysEntry]) -> list[RawCourse]:
        """Enrich CourSys entries with SFU Outlines data."""
        courses: list[RawCourse] = []
        semaphore = asyncio.Semaphore(MAX_CONCURRENT_OUTLINE_REQUESTS)

        async def fetch_one(entry: CoursysEntry) -> RawCourse:
            async with semaphore:
                outline = await fetch_course_outline(
                    year=self.year,
                    term=self.term,
                    dept=entry.department,
                    number=entry.course_number,
                    section=entry.section,
                )
                return self._merge_data(entry, outline)

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("Fetching outlines...", total=len(entries))

            # Process in batches
            batch_size = MAX_CONCURRENT_OUTLINE_REQUESTS
            for i in range(0, len(entries), batch_size):
                batch = entries[i : i + batch_size]
                tasks = [fetch_one(entry) for entry in batch]
                batch_results = await asyncio.gather(*tasks)
                courses.extend(batch_results)
                progress.update(task, advance=len(batch))

                # Small delay between batches
                if i + batch_size < len(entries):
                    await asyncio.sleep(BATCH_DELAY_SECONDS)

        return courses

    def _merge_data(self, entry: CoursysEntry, outline: OutlineData | None) -> RawCourse:
        """Merge CourSys entry with SFU Outlines data."""
        schedule: list[Schedule] = []

        if outline:
            self.enriched_count += 1
            for sched in outline.schedule:
                time_str = ""
                if sched.start_time and sched.end_time:
                    time_str = f"{sched.start_time}-{sched.end_time}"

                schedule.append(
                    Schedule(
                        days=sched.days,
                        time=time_str,
                        campus=sched.campus,
                        location="",  # Not available in outline schedule
                    )
                )

            return RawCourse(
                course_code=entry.course_code,
                section=entry.section,
                department=entry.department,
                title=entry.title,
                units=int(outline.units) if outline.units.isdigit() else 0,
                campus=entry.campus,
                enrollment=entry.enrollment,
                description=outline.description,
                prerequisites=outline.prerequisites,
                corequisites=outline.corequisites,
                designation=outline.designation,
                delivery_method=outline.delivery_method,
                instructor=outline.instructor_name or entry.instructor,
                schedule=schedule,
                has_outline=True,
            )
        else:
            self.error_count += 1
            return RawCourse(
                course_code=entry.course_code,
                section=entry.section,
                department=entry.department,
                title=entry.title,
                units=0,
                campus=entry.campus,
                enrollment=entry.enrollment,
                instructor=entry.instructor,
                has_outline=False,
            )

    def _save_output(self, output: CourseOutput) -> None:
        """Save output to JSON file."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        output_file = self.output_dir / f"courses_{self.semester}.json"

        with open(output_file, "w") as f:
            json.dump(output.model_dump(mode="json"), f, indent=2, default=str)

        console.print(f"\n[bold]Saved to:[/bold] {output_file}")
