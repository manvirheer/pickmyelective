"""Course transformation pipeline for embedding-ready documents."""

import asyncio
import time
from pathlib import Path

from openai import AsyncOpenAI
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

from src.processing.models import ProcessedCourse, ProcessingOutput
from .models import (
    TransformedCourse,
    TransformOutput,
    TransformStats,
    CourseMetadata,
)

console = Console()

# Semester code to human-readable name
SEMESTER_NAMES = {
    "1261": "Spring 2026",
    "1264": "Summer 2026",
    "1267": "Fall 2026",
}

KEYWORD_PROMPT = """Generate 5-8 keywords for this university course. Focus ONLY on:
- Topics and concepts covered (e.g., "machine learning", "thermodynamics")
- Skills developed (e.g., "data analysis", "critical thinking")
- Subject areas (e.g., "organic chemistry", "medieval history")

Do NOT include:
- Student types (e.g., "engineering students", "pre-med students")
- Career labels (e.g., "aspiring doctors", "future programmers")

Return ONLY comma-separated keywords, nothing else.

Course: {course_code} - {title}
Description: {description}"""


class CourseTransformer:
    """Transforms processed courses into embedding-ready documents."""

    def __init__(self, openai_api_key: str | None = None, skip_llm: bool = False):
        """Initialize transformer with optional OpenAI API key."""
        self.client = None
        self.skip_llm = skip_llm
        if not skip_llm:
            self.client = AsyncOpenAI(api_key=openai_api_key) if openai_api_key else AsyncOpenAI()
        self.stats = TransformStats()

    def generate_document_id(self, course: ProcessedCourse, semester: str) -> str:
        """Generate unique document ID for a course."""
        # Format: cmpt-120-2026su
        code_parts = course.course_code.lower().replace(" ", "-")
        # Map semester code to suffix: 1261->sp, 1264->su, 1267->fa
        semester_suffixes = {"1261": "sp", "1264": "su", "1267": "fa"}
        suffix = semester_suffixes.get(semester, semester[-1])
        year = "2026"  # Extract from semester code if needed
        return f"{code_parts}-{year}{suffix}"

    def format_document_text(self, course: ProcessedCourse, keywords: list[str]) -> str:
        """Format course into structured text for embedding."""
        # Header line
        lines = [f"{course.course_code} - {course.title}"]

        # Metadata line
        meta_parts = [
            f"Department: {course.department}",
            f"Level: {course.level}",
            f"Units: {course.units}",
        ]
        lines.append(" | ".join(meta_parts))

        # Availability line
        avail_parts = []
        if course.campuses:
            avail_parts.append(f"Campus: {', '.join(course.campuses)}")
        if course.delivery_methods:
            avail_parts.append(f"Delivery: {', '.join(course.delivery_methods)}")
        if avail_parts:
            lines.append(" | ".join(avail_parts))

        # WQB and prerequisites line
        wqb_str = ", ".join(w.value for w in course.wqb) if course.wqb else "None"
        if not course.has_prerequisites:
            prereq_str = "None"
        elif course.prerequisites_raw:
            # Truncate long prerequisites for document, full text in metadata
            prereq_str = course.prerequisites_raw[:200]
            if len(course.prerequisites_raw) > 200:
                prereq_str += "..."
        else:
            prereq_str = "Required"
        lines.append(f"WQB: {wqb_str} | Prerequisites: {prereq_str}")

        # Empty line before description
        lines.append("")

        # Description
        lines.append(course.description)

        # Keywords section
        if keywords:
            lines.append("")
            lines.append(f"Good for students interested in: {', '.join(keywords)}")

        return "\n".join(lines)

    def extract_metadata(self, course: ProcessedCourse) -> CourseMetadata:
        """Extract filterable metadata from a processed course."""
        return CourseMetadata(
            department=course.department,
            level=course.level,
            units=course.units,
            campuses=course.campuses,
            wqb=[w.value for w in course.wqb],
            has_wqb=course.has_wqb,
            has_prerequisites=course.has_prerequisites,
            prerequisite_level=course.prerequisite_level.value,
            prerequisites_raw=course.prerequisites_raw,
            delivery_methods=course.delivery_methods,
            instructors=course.instructors,
            sections=course.sections,
            elective_score=course.elective_score,
            total_capacity=course.total_capacity,
        )

    async def generate_keywords(
        self,
        course: ProcessedCourse,
        retries: int = 3,
        delay: float = 0.1,
    ) -> list[str]:
        """Generate semantic keywords for a course using LLM."""
        prompt = KEYWORD_PROMPT.format(
            course_code=course.course_code,
            title=course.title,
            description=course.description[:1000],  # Limit description length
        )

        for attempt in range(retries):
            try:
                response = await self.client.chat.completions.create(
                    model="gpt-4.1-mini",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=100,
                    temperature=0.7,
                )

                self.stats.llm_calls += 1
                if response.usage:
                    self.stats.total_tokens_used += response.usage.total_tokens

                # Parse comma-separated keywords
                content = response.choices[0].message.content or ""
                keywords = [k.strip().lower() for k in content.split(",") if k.strip()]

                # Add delay to avoid rate limiting
                await asyncio.sleep(delay)

                return keywords[:8]  # Cap at 8 keywords

            except Exception as e:
                if attempt < retries - 1:
                    wait_time = (2 ** attempt) * 0.5  # Exponential backoff
                    console.print(f"[yellow]Retry {attempt + 1} for {course.course_code}: {e}[/yellow]")
                    await asyncio.sleep(wait_time)
                else:
                    console.print(f"[red]Failed to generate keywords for {course.course_code}: {e}[/red]")
                    self.stats.failed_keywords += 1
                    return []

        return []

    async def transform_course(
        self,
        course: ProcessedCourse,
        semester: str,
        generate_keywords: bool = True,
    ) -> TransformedCourse:
        """Transform a single course into embedding-ready format."""
        # Generate keywords if enabled
        keywords = []
        if generate_keywords:
            keywords = await self.generate_keywords(course)

        # Generate document ID
        doc_id = self.generate_document_id(course, semester)

        # Format document text
        document = self.format_document_text(course, keywords)

        # Extract metadata
        metadata = self.extract_metadata(course)

        return TransformedCourse(
            id=doc_id,
            course_code=course.course_code,
            title=course.title,
            document=document,
            keywords=keywords,
            metadata=metadata,
        )

    async def transform_all(
        self,
        courses: list[ProcessedCourse],
        semester: str,
        generate_keywords: bool = True,
        checkpoint_path: Path | None = None,
        checkpoint_interval: int = 50,
    ) -> list[TransformedCourse]:
        """Transform all courses with progress tracking and checkpointing."""
        transformed: list[TransformedCourse] = []
        total = len(courses)

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(
                f"[cyan]Transforming {total} courses...",
                total=total,
            )

            for i, course in enumerate(courses):
                result = await self.transform_course(
                    course,
                    semester,
                    generate_keywords=generate_keywords,
                )
                transformed.append(result)
                progress.update(task, advance=1)

                # Checkpoint save
                if checkpoint_path and (i + 1) % checkpoint_interval == 0:
                    self._save_checkpoint(transformed, checkpoint_path, semester)

        # Update stats
        self.stats.total_courses = total
        self.stats.successful = len(transformed)

        if transformed:
            doc_lengths = [len(c.document) for c in transformed]
            keyword_counts = [len(c.keywords) for c in transformed]
            self.stats.avg_document_length = sum(doc_lengths) / len(doc_lengths)
            self.stats.avg_keywords_per_course = sum(keyword_counts) / len(keyword_counts)

        return transformed

    def _save_checkpoint(
        self,
        courses: list[TransformedCourse],
        path: Path,
        semester: str,
    ) -> None:
        """Save checkpoint of transformed courses."""
        checkpoint = TransformOutput(
            semester=semester,
            semester_name=SEMESTER_NAMES.get(semester, f"Semester {semester}"),
            total_courses=len(courses),
            stats=self.stats,
            courses=courses,
        )
        checkpoint_file = path.with_suffix(".checkpoint.json")
        checkpoint_file.write_text(checkpoint.model_dump_json(indent=2))

    def create_output(
        self,
        courses: list[TransformedCourse],
        semester: str,
    ) -> TransformOutput:
        """Create the final output object."""
        return TransformOutput(
            semester=semester,
            semester_name=SEMESTER_NAMES.get(semester, f"Semester {semester}"),
            total_courses=len(courses),
            stats=self.stats,
            courses=courses,
        )


def load_processed_courses(path: Path) -> tuple[list[ProcessedCourse], str]:
    """Load processed courses from JSON file."""
    import json

    with open(path) as f:
        data = json.load(f)

    output = ProcessingOutput(**data)
    return output.courses, output.semester
