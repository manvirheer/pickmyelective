"""Pydantic models for course data."""

from datetime import datetime
from pydantic import BaseModel, Field


class Schedule(BaseModel):
    """Class schedule information."""

    days: str = ""
    time: str = ""
    location: str = ""
    campus: str = ""


class RawCourse(BaseModel):
    """Combined course data from CourSys and SFU Outlines APIs."""

    # Core identifiers
    course_code: str = Field(..., description="e.g., 'CMPT 120'")
    section: str = Field(..., description="e.g., 'D100'")
    department: str = Field(..., description="e.g., 'CMPT'")

    # Basic info
    title: str = ""
    units: int = 0
    campus: str = ""
    enrollment: str = ""  # e.g., "150/200"

    # From SFU Outlines (enrichment)
    description: str = ""
    prerequisites: str = ""
    corequisites: str = ""
    designation: str = ""  # WQB designation string
    delivery_method: str = ""
    instructor: str = ""
    schedule: list[Schedule] = Field(default_factory=list)

    # Metadata
    has_outline: bool = False  # Whether SFU Outlines data was found

    @property
    def course_number(self) -> str:
        """Extract course number from course_code (e.g., '120' from 'CMPT 120')."""
        parts = self.course_code.split()
        return parts[1] if len(parts) > 1 else ""


class CourseOutput(BaseModel):
    """Output schema for the fetched courses JSON file."""

    semester: str = Field(..., description="Semester code, e.g., '1264'")
    fetched_at: datetime = Field(default_factory=datetime.now)
    total_courses: int = 0
    enriched_count: int = 0  # Courses with SFU Outlines data
    error_count: int = 0
    courses: list[RawCourse] = Field(default_factory=list)
