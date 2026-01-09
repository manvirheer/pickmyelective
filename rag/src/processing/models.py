"""Models for processed/filtered course data."""

from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class WQBCode(str, Enum):
    """WQB designation codes."""
    Q = "Q"           # Quantitative
    W = "W"           # Writing
    B_SCI = "B-Sci"   # Breadth-Science
    B_SOC = "B-Soc"   # Breadth-Social Sciences
    B_HUM = "B-Hum"   # Breadth-Humanities


class PrerequisiteLevel(str, Enum):
    """Prerequisite difficulty classification."""
    NONE = "none"           # No prerequisites
    RECOMMENDED = "recommended"  # Soft/recommended only
    REQUIRED = "required"   # Hard prerequisites


class ExclusionReason(str, Enum):
    """Reason a course was excluded."""
    GRADUATE = "graduate"
    UPPER_DIVISION = "upper_division"
    NO_DESCRIPTION = "no_description"
    COOP = "coop"
    PRACTICUM = "practicum"
    THESIS = "thesis"
    DIRECTED_STUDIES = "directed_studies"
    CAPSTONE = "capstone"
    SPECIAL_TOPICS = "special_topics"
    PROJECT = "project"
    HONOURS = "honours"


class ProcessedCourse(BaseModel):
    """A deduplicated, processed course ready for filtering."""

    # Identity
    course_code: str = Field(..., description="e.g., 'CMPT 120'")
    department: str = Field(..., description="e.g., 'CMPT'")
    course_number: str = Field(..., description="e.g., '120'")
    level: int = Field(..., description="100, 200, 300, etc.")

    # Content
    title: str
    description: str
    units: int = 0

    # Parsed metadata
    wqb: list[WQBCode] = Field(default_factory=list)
    has_wqb: bool = False

    # Prerequisites
    prerequisites_raw: str = ""
    prerequisite_level: PrerequisiteLevel = PrerequisiteLevel.NONE
    has_prerequisites: bool = False

    # Availability (merged from all sections)
    campuses: list[str] = Field(default_factory=list)
    delivery_methods: list[str] = Field(default_factory=list)
    instructors: list[str] = Field(default_factory=list)
    sections: list[str] = Field(default_factory=list)
    total_capacity: int = 0

    # Scoring
    elective_score: int = 0

    # Filtering
    is_excluded: bool = False
    exclusion_reason: ExclusionReason | None = None


class ProcessingStats(BaseModel):
    """Statistics from the preprocessing pipeline."""

    # Input
    total_sections: int = 0

    # Deduplication
    unique_courses: int = 0
    multi_section_courses: int = 0

    # Filtering
    excluded_graduate: int = 0
    excluded_upper_division: int = 0
    excluded_no_description: int = 0
    excluded_coop: int = 0
    excluded_practicum: int = 0
    excluded_thesis: int = 0
    excluded_directed_studies: int = 0
    excluded_other: int = 0
    total_excluded: int = 0

    # Output
    elective_candidates: int = 0

    # WQB breakdown
    with_wqb: int = 0
    wqb_q: int = 0
    wqb_w: int = 0
    wqb_b_sci: int = 0
    wqb_b_soc: int = 0
    wqb_b_hum: int = 0

    # Prerequisites breakdown
    no_prerequisites: int = 0
    recommended_only: int = 0
    has_prerequisites: int = 0


class DepartmentInfo(BaseModel):
    """Department metadata for filtering UI."""

    code: str = Field(..., description="e.g., 'CMPT'")
    count: int = Field(..., description="Number of elective courses")


class ProcessingOutput(BaseModel):
    """Output schema for processed courses JSON file."""

    semester: str
    processed_at: datetime = Field(default_factory=datetime.now)
    stats: ProcessingStats = Field(default_factory=ProcessingStats)
    departments: list[DepartmentInfo] = Field(default_factory=list, description="All departments with electives")
    courses: list[ProcessedCourse] = Field(default_factory=list)
    excluded: list[ProcessedCourse] = Field(default_factory=list)
