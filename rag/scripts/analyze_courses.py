#!/usr/bin/env python3
"""Analyze fetched course data to understand its structure and distribution."""

import argparse
import json
from collections import Counter
from pathlib import Path

from rich.console import Console
from rich.table import Table
from rich.panel import Panel

console = Console()


def load_courses(filepath: Path) -> dict:
    """Load courses from JSON file."""
    with open(filepath) as f:
        return json.load(f)


def analyze(data: dict) -> None:
    """Analyze course data and print statistics."""
    courses = data.get("courses", [])
    total = len(courses)

    console.print(Panel(f"[bold]Course Data Analysis[/bold]\n\nTotal courses: {total}", title="Overview"))

    # Department distribution
    depts = Counter(c.get("department", "Unknown") for c in courses)
    dept_table = Table(title="Top 20 Departments")
    dept_table.add_column("Department", style="cyan")
    dept_table.add_column("Count", justify="right")
    dept_table.add_column("%", justify="right")
    for dept, count in depts.most_common(20):
        dept_table.add_row(dept, str(count), f"{count/total*100:.1f}%")
    console.print(dept_table)
    console.print(f"Total unique departments: {len(depts)}\n")

    # Course level distribution (100, 200, 300, etc.)
    def get_level(course_code: str) -> str:
        parts = course_code.split()
        if len(parts) >= 2:
            num = ''.join(filter(str.isdigit, parts[1]))
            if num:
                level = (int(num) // 100) * 100
                return f"{level}-level"
        return "Unknown"

    levels = Counter(get_level(c.get("course_code", "")) for c in courses)
    level_table = Table(title="Course Level Distribution")
    level_table.add_column("Level", style="cyan")
    level_table.add_column("Count", justify="right")
    level_table.add_column("%", justify="right")
    for level in sorted(levels.keys(), key=lambda x: int(x.split("-")[0]) if x[0].isdigit() else 9999):
        count = levels[level]
        level_table.add_row(level, str(count), f"{count/total*100:.1f}%")
    console.print(level_table)

    # Undergraduate vs Graduate
    undergrad = sum(1 for c in courses if get_level(c.get("course_code", "")).startswith(("100", "200", "300", "400", "500")))
    grad = sum(1 for c in courses if get_level(c.get("course_code", "")).startswith(("600", "700", "800", "900")))
    console.print(f"\n[bold]Undergraduate vs Graduate:[/bold]")
    console.print(f"  Undergraduate (100-500): {undergrad} ({undergrad/total*100:.1f}%)")
    console.print(f"  Graduate (600-900): {grad} ({grad/total*100:.1f}%)")

    # Campus distribution
    campuses = Counter(c.get("campus", "Unknown") for c in courses)
    campus_table = Table(title="\nCampus Distribution")
    campus_table.add_column("Campus", style="cyan")
    campus_table.add_column("Count", justify="right")
    campus_table.add_column("%", justify="right")
    for campus, count in campuses.most_common():
        campus_table.add_row(campus, str(count), f"{count/total*100:.1f}%")
    console.print(campus_table)

    # WQB Designation distribution
    def parse_designation(desig: str) -> list[str]:
        if not desig:
            return ["None"]
        codes = []
        if "Quantitative" in desig:
            codes.append("Q")
        if "Writing" in desig:
            codes.append("W")
        if "Breadth-Science" in desig or "Breadth-Sci" in desig:
            codes.append("B-Sci")
        if "Breadth-Social" in desig:
            codes.append("B-Soc")
        if "Breadth-Humanities" in desig or "Breadth-Hum" in desig:
            codes.append("B-Hum")
        return codes if codes else ["None"]

    wqb_counter = Counter()
    for c in courses:
        for code in parse_designation(c.get("designation", "")):
            wqb_counter[code] += 1

    wqb_table = Table(title="\nWQB Designation Distribution")
    wqb_table.add_column("Designation", style="cyan")
    wqb_table.add_column("Count", justify="right")
    wqb_table.add_column("%", justify="right")
    for code, count in wqb_counter.most_common():
        wqb_table.add_row(code, str(count), f"{count/total*100:.1f}%")
    console.print(wqb_table)

    # Courses with WQB vs without
    with_wqb = sum(1 for c in courses if c.get("designation") and "Breadth" in c.get("designation", "") or "Quantitative" in c.get("designation", "") or "Writing" in c.get("designation", ""))
    console.print(f"\nCourses with WQB designation: {with_wqb} ({with_wqb/total*100:.1f}%)")

    # Prerequisites analysis
    with_prereq = sum(1 for c in courses if c.get("prerequisites", "").strip())
    console.print(f"\n[bold]Prerequisites:[/bold]")
    console.print(f"  With prerequisites: {with_prereq} ({with_prereq/total*100:.1f}%)")
    console.print(f"  No prerequisites: {total - with_prereq} ({(total-with_prereq)/total*100:.1f}%)")

    # Description analysis
    with_desc = sum(1 for c in courses if c.get("description", "").strip())
    avg_desc_len = sum(len(c.get("description", "")) for c in courses) / total if total else 0
    console.print(f"\n[bold]Descriptions:[/bold]")
    console.print(f"  With description: {with_desc} ({with_desc/total*100:.1f}%)")
    console.print(f"  Average description length: {avg_desc_len:.0f} characters")

    # Delivery method
    delivery = Counter(c.get("delivery_method", "Unknown") for c in courses)
    delivery_table = Table(title="\nDelivery Method")
    delivery_table.add_column("Method", style="cyan")
    delivery_table.add_column("Count", justify="right")
    delivery_table.add_column("%", justify="right")
    for method, count in delivery.most_common():
        delivery_table.add_row(method or "Unknown", str(count), f"{count/total*100:.1f}%")
    console.print(delivery_table)

    # Enrichment stats
    enriched = sum(1 for c in courses if c.get("has_outline"))
    console.print(f"\n[bold]Data Enrichment:[/bold]")
    console.print(f"  With SFU Outline data: {enriched} ({enriched/total*100:.1f}%)")
    console.print(f"  Without outline: {total - enriched} ({(total-enriched)/total*100:.1f}%)")

    # Potential electives (undergraduate, with description)
    potential = sum(
        1 for c in courses
        if get_level(c.get("course_code", "")).startswith(("100", "200", "300", "400"))
        and c.get("description", "").strip()
    )
    console.print(f"\n[bold]Potential Electives:[/bold]")
    console.print(f"  Undergraduate (100-400) with description: {potential} ({potential/total*100:.1f}%)")

    # Exclusion pattern analysis
    import re
    exclusion_patterns = [
        (r"co-?op", "Co-op"),
        (r"practicum", "Practicum"),
        (r"\bthesis\b", "Thesis"),
        (r"directed (study|studies|reading)", "Directed Studies"),
        (r"capstone", "Capstone"),
        (r"special topics", "Special Topics"),
        (r"honours (essay|project)", "Honours Project"),
        (r"(graduate |grad )?project\s*(i|ii|iii|iv|v|1|2|3|4|5)?$", "Project Course"),
    ]

    exclusion_count = 0
    console.print(f"\n[bold]Courses Matching Exclusion Patterns:[/bold]")
    for pattern, name in exclusion_patterns:
        matches = sum(1 for c in courses if re.search(pattern, c.get("title", ""), re.IGNORECASE))
        if matches:
            console.print(f"  {name}: {matches}")
            exclusion_count += matches

    # Final estimate
    console.print(f"\n" + "=" * 60)
    console.print(f"[bold green]ESTIMATED ELECTIVE CANDIDATES:[/bold green]")

    # Calculate based on rules
    elective_candidates = []
    for c in courses:
        level = get_level(c.get("course_code", ""))
        # Exclude graduate
        if level.startswith(("600", "700", "800", "900")):
            continue
        # Exclude no description
        if not c.get("description", "").strip():
            continue
        # Exclude patterns
        title = c.get("title", "")
        excluded = False
        for pattern, _ in exclusion_patterns:
            if re.search(pattern, title, re.IGNORECASE):
                excluded = True
                break
        if excluded:
            continue
        elective_candidates.append(c)

    console.print(f"  Starting courses: {total}")
    console.print(f"  After removing graduate (600+): {sum(1 for c in courses if not get_level(c.get('course_code', '')).startswith(('600', '700', '800', '900')))}")
    console.print(f"  After removing no description: {sum(1 for c in courses if c.get('description', '').strip() and not get_level(c.get('course_code', '')).startswith(('600', '700', '800', '900')))}")
    console.print(f"  After exclusion patterns: [bold]{len(elective_candidates)}[/bold] ({len(elective_candidates)/total*100:.1f}%)")

    # Of these, how many have WQB?
    with_wqb_final = sum(1 for c in elective_candidates if c.get("designation") and ("Breadth" in c.get("designation", "") or "Quantitative" in c.get("designation", "") or "Writing" in c.get("designation", "")))
    no_prereq_final = sum(1 for c in elective_candidates if not c.get("prerequisites", "").strip())
    console.print(f"\n  Of these elective candidates:")
    console.print(f"    With WQB designation: {with_wqb_final} ({with_wqb_final/len(elective_candidates)*100:.1f}%)" if elective_candidates else "")
    console.print(f"    No prerequisites: {no_prereq_final} ({no_prereq_final/len(elective_candidates)*100:.1f}%)" if elective_candidates else "")


def main():
    parser = argparse.ArgumentParser(description="Analyze fetched course data")
    parser.add_argument(
        "file",
        type=Path,
        nargs="?",
        default=Path(__file__).parent.parent / "data" / "raw" / "courses_1264.json",
        help="Path to courses JSON file",
    )
    args = parser.parse_args()

    if not args.file.exists():
        console.print(f"[red]Error: File not found: {args.file}[/red]")
        console.print("Run fetch_courses.py first to fetch data.")
        return

    data = load_courses(args.file)
    analyze(data)


if __name__ == "__main__":
    main()
