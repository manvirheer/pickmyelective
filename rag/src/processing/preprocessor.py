"""Course preprocessing and filtering pipeline."""

import re
import json
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from .models import (
    ProcessedCourse,
    ProcessingOutput,
    ProcessingStats,
    DepartmentInfo,
    WQBCode,
    PrerequisiteLevel,
    ExclusionReason,
)

console = Console()


# =============================================================================
# WQB Parsing
# =============================================================================

WQB_PATTERNS = {
    "Quantitative": WQBCode.Q,
    "Writing": WQBCode.W,
    "Breadth-Science": WQBCode.B_SCI,
    "Breadth-Sci": WQBCode.B_SCI,
    "B-Sci": WQBCode.B_SCI,
    "Breadth-Social": WQBCode.B_SOC,
    "B-Soc": WQBCode.B_SOC,
    "Breadth-Humanities": WQBCode.B_HUM,
    "Breadth-Hum": WQBCode.B_HUM,
    "B-Hum": WQBCode.B_HUM,
}


def parse_wqb(designation: str) -> list[WQBCode]:
    """Parse WQB designation string into list of codes."""
    if not designation:
        return []

    codes = []
    for pattern, code in WQB_PATTERNS.items():
        if pattern in designation and code not in codes:
            codes.append(code)

    return codes


# =============================================================================
# Prerequisite Analysis
# =============================================================================

HARD_PREREQ_PATTERNS = [
    r"prerequisite:",
    r"credit for",
    r"completion of",
    r"with a minimum grade",
    r"corequisite:",
    r"must have completed",
    r"requires",
]

SOFT_PREREQ_PATTERNS = [
    r"recommended",
    r"suggested",
    r"helpful",
    r"familiarity with",
]


def analyze_prerequisites(prereq_text: str) -> tuple[PrerequisiteLevel, bool]:
    """
    Analyze prerequisite text to determine difficulty level.

    Returns:
        (level, has_prerequisites)
    """
    if not prereq_text or not prereq_text.strip():
        return PrerequisiteLevel.NONE, False

    text_lower = prereq_text.lower()

    # Check for soft/recommended only
    has_soft = any(re.search(p, text_lower) for p in SOFT_PREREQ_PATTERNS)
    has_hard = any(re.search(p, text_lower) for p in HARD_PREREQ_PATTERNS)

    # Also check for course codes (e.g., "CMPT 120" or "60 units")
    has_course_ref = bool(re.search(r"[A-Z]{2,4}\s*\d{3}", prereq_text))
    has_unit_ref = bool(re.search(r"\d+\s*(units?|credits?)", text_lower))

    if has_hard or has_course_ref or has_unit_ref:
        return PrerequisiteLevel.REQUIRED, True
    elif has_soft:
        return PrerequisiteLevel.RECOMMENDED, False
    else:
        # Has text but unclear - assume soft
        return PrerequisiteLevel.RECOMMENDED, False


# =============================================================================
# Text Cleaning
# =============================================================================

def clean_text(text: str) -> str:
    """Clean HTML tags and normalize whitespace."""
    if not text:
        return ""

    # Remove HTML tags
    clean = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities
    clean = clean.replace("&amp;", "&")
    clean = clean.replace("&lt;", "<")
    clean = clean.replace("&gt;", ">")
    clean = clean.replace("&quot;", '"')
    clean = clean.replace("&#39;", "'")
    clean = clean.replace("&nbsp;", " ")
    clean = clean.replace("&#x27;", "'")

    # Normalize whitespace
    clean = " ".join(clean.split())

    return clean.strip()


# =============================================================================
# Course Level Extraction
# =============================================================================

def extract_level(course_number: str) -> int:
    """Extract course level from number (100, 200, 300, etc.)."""
    num = "".join(filter(str.isdigit, course_number))
    if num:
        return (int(num) // 100) * 100
    return 0


# =============================================================================
# Exclusion Filters
# =============================================================================

EXCLUSION_PATTERNS = [
    (r"co-?op\b", ExclusionReason.COOP),
    (r"\bpracticum\b", ExclusionReason.PRACTICUM),
    (r"\bthesis\b", ExclusionReason.THESIS),
    (r"directed (study|studies|reading)", ExclusionReason.DIRECTED_STUDIES),
    (r"\bcapstone\b", ExclusionReason.CAPSTONE),
    (r"special topics", ExclusionReason.SPECIAL_TOPICS),
    (r"honours (essay|project|thesis)", ExclusionReason.HONOURS),
    (r"(graduate |grad )?project\s*(i|ii|iii|iv|v|1|2|3|4|5)?$", ExclusionReason.PROJECT),
]


def check_exclusion(course: ProcessedCourse) -> ExclusionReason | None:
    """Check if course should be excluded and return reason."""
    # Graduate level (600+)
    if course.level >= 600:
        return ExclusionReason.GRADUATE

    # 400-level (too advanced for general electives)
    if course.level >= 400:
        return ExclusionReason.UPPER_DIVISION

    # No description
    if not course.description.strip():
        return ExclusionReason.NO_DESCRIPTION

    # Title patterns
    title = course.title
    for pattern, reason in EXCLUSION_PATTERNS:
        if re.search(pattern, title, re.IGNORECASE):
            return reason

    return None


# =============================================================================
# Elective Scoring
# =============================================================================

def calculate_elective_score(course: ProcessedCourse) -> int:
    """
    Calculate elective-friendliness score.

    Higher score = better elective candidate.
    """
    score = 0

    # No prerequisites = accessible to anyone (+5)
    if not course.has_prerequisites:
        score += 5

    # WQB designation = fulfills graduation requirements (+5 per)
    score += 5 * len(course.wqb)

    # Lower level = more introductory/accessible
    if course.level == 100:
        score += 5
    elif course.level == 200:
        score += 3
    # 300-level: no bonus

    # Large capacity = easier to get a seat
    if course.total_capacity >= 200:
        score += 3
    elif course.total_capacity >= 100:
        score += 2
    elif course.total_capacity >= 50:
        score += 1

    # Has instructor listed = more likely to run
    if course.instructors:
        score += 1

    # Multiple delivery options = flexibility
    if len(course.delivery_methods) > 1:
        score += 1

    # Multiple campuses = flexibility
    if len(course.campuses) > 1:
        score += 1

    return score


# =============================================================================
# Enrollment Parsing
# =============================================================================

def parse_enrollment(enrollment: str) -> int:
    """Parse enrollment string to get capacity (e.g., '50/200' -> 200)."""
    if not enrollment:
        return 0
    match = re.search(r"/(\d+)", enrollment)
    if match:
        return int(match.group(1))
    return 0


# =============================================================================
# Main Preprocessor
# =============================================================================

class CoursePreprocessor:
    """Preprocesses and filters course data."""

    def __init__(self, input_path: Path, output_dir: Path | None = None):
        self.input_path = input_path
        self.output_dir = output_dir or input_path.parent.parent / "processed"
        self.stats = ProcessingStats()

    def process(self) -> ProcessingOutput:
        """Run the full preprocessing pipeline."""
        console.print("\n[bold blue]Course Preprocessing Pipeline[/bold blue]\n")

        # Load raw data
        console.print("[yellow]Step 1:[/yellow] Loading raw course data...")
        raw_data = self._load_raw_data()
        raw_courses = raw_data.get("courses", [])
        self.stats.total_sections = len(raw_courses)
        console.print(f"  Loaded {self.stats.total_sections} sections\n")

        # Deduplicate
        console.print("[yellow]Step 2:[/yellow] Deduplicating sections into unique courses...")
        courses = self._deduplicate(raw_courses)
        self.stats.unique_courses = len(courses)
        console.print(f"  {self.stats.unique_courses} unique courses\n")

        # Process each course
        console.print("[yellow]Step 3:[/yellow] Processing courses...")
        processed = []
        for course in courses:
            processed.append(self._process_course(course))

        # Apply filters
        console.print("[yellow]Step 4:[/yellow] Applying exclusion filters...")
        electives = []
        excluded = []
        for course in processed:
            reason = check_exclusion(course)
            if reason:
                course.is_excluded = True
                course.exclusion_reason = reason
                excluded.append(course)
                self._count_exclusion(reason)
            else:
                course.elective_score = calculate_elective_score(course)
                electives.append(course)

        self.stats.total_excluded = len(excluded)
        self.stats.elective_candidates = len(electives)

        # Calculate final stats
        self._calculate_stats(electives)

        # Sort electives by score
        electives.sort(key=lambda c: c.elective_score, reverse=True)

        # Build department list for filtering UI
        dept_counts: dict[str, int] = defaultdict(int)
        for course in electives:
            dept_counts[course.department] += 1
        departments = [
            DepartmentInfo(code=code, count=count)
            for code, count in sorted(dept_counts.items())
        ]

        # Build output
        output = ProcessingOutput(
            semester=raw_data.get("semester", ""),
            processed_at=datetime.now(),
            stats=self.stats,
            departments=departments,
            courses=electives,
            excluded=excluded,
        )

        # Save
        self._save_output(output)
        self._print_summary()

        return output

    def _load_raw_data(self) -> dict:
        """Load raw course data from JSON."""
        with open(self.input_path) as f:
            return json.load(f)

    def _deduplicate(self, raw_courses: list[dict]) -> list[dict]:
        """Merge sections into unique courses."""
        course_map: dict[str, list[dict]] = defaultdict(list)

        for course in raw_courses:
            code = course.get("course_code", "")
            if code:
                course_map[code].append(course)

        # Count multi-section courses
        self.stats.multi_section_courses = sum(
            1 for sections in course_map.values() if len(sections) > 1
        )

        # Merge sections
        merged = []
        for code, sections in course_map.items():
            merged.append(self._merge_sections(code, sections))

        return merged

    def _merge_sections(self, code: str, sections: list[dict]) -> dict:
        """Merge multiple sections into a single course record."""
        # Pick the section with the longest description
        best = max(sections, key=lambda s: len(s.get("description", "")))

        # Collect unique values from all sections
        campuses = list(set(s.get("campus", "") for s in sections if s.get("campus")))
        delivery_methods = list(set(s.get("delivery_method", "") for s in sections if s.get("delivery_method")))
        instructors = list(set(s.get("instructor", "") for s in sections if s.get("instructor")))
        section_codes = [s.get("section", "") for s in sections if s.get("section")]

        # Sum capacity
        total_capacity = sum(parse_enrollment(s.get("enrollment", "")) for s in sections)

        return {
            "course_code": code,
            "department": best.get("department", ""),
            "title": best.get("title", ""),
            "description": best.get("description", ""),
            "units": best.get("units", 0),
            "designation": best.get("designation", ""),
            "prerequisites": best.get("prerequisites", ""),
            "campuses": campuses,
            "delivery_methods": delivery_methods,
            "instructors": instructors,
            "sections": section_codes,
            "total_capacity": total_capacity,
        }

    def _process_course(self, course: dict) -> ProcessedCourse:
        """Process a single merged course."""
        code = course.get("course_code", "")
        parts = code.split()
        dept = parts[0] if parts else ""
        num = parts[1] if len(parts) > 1 else ""

        # Parse WQB
        wqb = parse_wqb(course.get("designation", ""))

        # Analyze prerequisites
        prereq_level, has_prereq = analyze_prerequisites(course.get("prerequisites", ""))

        return ProcessedCourse(
            course_code=code,
            department=dept,
            course_number=num,
            level=extract_level(num),
            title=clean_text(course.get("title", "")),
            description=clean_text(course.get("description", "")),
            units=course.get("units", 0),
            wqb=wqb,
            has_wqb=len(wqb) > 0,
            prerequisites_raw=course.get("prerequisites", ""),
            prerequisite_level=prereq_level,
            has_prerequisites=has_prereq,
            campuses=course.get("campuses", []),
            delivery_methods=course.get("delivery_methods", []),
            instructors=course.get("instructors", []),
            sections=course.get("sections", []),
            total_capacity=course.get("total_capacity", 0),
        )

    def _count_exclusion(self, reason: ExclusionReason) -> None:
        """Increment exclusion counter."""
        if reason == ExclusionReason.GRADUATE:
            self.stats.excluded_graduate += 1
        elif reason == ExclusionReason.UPPER_DIVISION:
            self.stats.excluded_upper_division += 1
        elif reason == ExclusionReason.NO_DESCRIPTION:
            self.stats.excluded_no_description += 1
        elif reason == ExclusionReason.COOP:
            self.stats.excluded_coop += 1
        elif reason == ExclusionReason.PRACTICUM:
            self.stats.excluded_practicum += 1
        elif reason == ExclusionReason.THESIS:
            self.stats.excluded_thesis += 1
        elif reason == ExclusionReason.DIRECTED_STUDIES:
            self.stats.excluded_directed_studies += 1
        else:
            self.stats.excluded_other += 1

    def _calculate_stats(self, electives: list[ProcessedCourse]) -> None:
        """Calculate final statistics."""
        for course in electives:
            # WQB stats
            if course.has_wqb:
                self.stats.with_wqb += 1
            for code in course.wqb:
                if code == WQBCode.Q:
                    self.stats.wqb_q += 1
                elif code == WQBCode.W:
                    self.stats.wqb_w += 1
                elif code == WQBCode.B_SCI:
                    self.stats.wqb_b_sci += 1
                elif code == WQBCode.B_SOC:
                    self.stats.wqb_b_soc += 1
                elif code == WQBCode.B_HUM:
                    self.stats.wqb_b_hum += 1

            # Prerequisite stats
            if course.prerequisite_level == PrerequisiteLevel.NONE:
                self.stats.no_prerequisites += 1
            elif course.prerequisite_level == PrerequisiteLevel.RECOMMENDED:
                self.stats.recommended_only += 1
            else:
                self.stats.has_prerequisites += 1

    def _save_output(self, output: ProcessingOutput) -> None:
        """Save processed data to JSON."""
        self.output_dir.mkdir(parents=True, exist_ok=True)
        output_file = self.output_dir / f"electives_{output.semester}.json"

        with open(output_file, "w") as f:
            json.dump(output.model_dump(mode="json"), f, indent=2, default=str)

        console.print(f"\n[bold]Saved to:[/bold] {output_file}")

    def _print_summary(self) -> None:
        """Print processing summary."""
        s = self.stats
        console.print("\n" + "=" * 60)
        console.print("[bold green]PROCESSING COMPLETE[/bold green]\n")

        console.print("[bold]Pipeline Summary:[/bold]")
        console.print(f"  Input sections:       {s.total_sections}")
        console.print(f"  Unique courses:       {s.unique_courses}")
        console.print(f"  Multi-section:        {s.multi_section_courses}")
        console.print(f"  Excluded:             {s.total_excluded}")
        console.print(f"  [green]Elective candidates:  {s.elective_candidates}[/green]")

        console.print(f"\n[bold]Exclusions:[/bold]")
        console.print(f"  Graduate (600+):      {s.excluded_graduate}")
        console.print(f"  Upper div (400+):     {s.excluded_upper_division}")
        console.print(f"  No description:       {s.excluded_no_description}")
        console.print(f"  Co-op:                {s.excluded_coop}")
        console.print(f"  Practicum:            {s.excluded_practicum}")
        console.print(f"  Thesis:               {s.excluded_thesis}")
        console.print(f"  Directed Studies:     {s.excluded_directed_studies}")
        console.print(f"  Other:                {s.excluded_other}")

        console.print(f"\n[bold]Elective Stats:[/bold]")
        console.print(f"  With WQB:             {s.with_wqb} ({s.with_wqb/s.elective_candidates*100:.1f}%)" if s.elective_candidates else "")
        console.print(f"    Q:                  {s.wqb_q}")
        console.print(f"    W:                  {s.wqb_w}")
        console.print(f"    B-Sci:              {s.wqb_b_sci}")
        console.print(f"    B-Soc:              {s.wqb_b_soc}")
        console.print(f"    B-Hum:              {s.wqb_b_hum}")
        console.print(f"  No prerequisites:     {s.no_prerequisites} ({s.no_prerequisites/s.elective_candidates*100:.1f}%)" if s.elective_candidates else "")
        console.print(f"  Recommended only:     {s.recommended_only}")
        console.print(f"  Has prerequisites:    {s.has_prerequisites}")
