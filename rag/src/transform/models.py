"""Models for transformed course documents ready for embedding."""

from datetime import datetime
from pydantic import BaseModel, Field


class CourseMetadata(BaseModel):
    """Filterable metadata for ChromaDB."""

    department: str = Field(..., description="e.g., 'CMPT'")
    level: int = Field(..., description="100, 200, 300, etc.")
    units: int = Field(default=0)
    campuses: list[str] = Field(default_factory=list)
    wqb: list[str] = Field(default_factory=list, description="WQB codes as strings")
    has_wqb: bool = False
    has_prerequisites: bool = False
    prerequisite_level: str = "none"
    prerequisites_raw: str = Field(default="", description="Full prerequisite text")
    delivery_methods: list[str] = Field(default_factory=list)
    instructors: list[str] = Field(default_factory=list)
    sections: list[str] = Field(default_factory=list, description="e.g., ['D100', 'D200']")
    elective_score: int = 0
    total_capacity: int = 0


class TransformedCourse(BaseModel):
    """A course transformed and ready for embedding."""

    id: str = Field(..., description="Unique ID, e.g., 'cmpt-120-2026su'")
    course_code: str = Field(..., description="e.g., 'CMPT 120'")
    title: str
    document: str = Field(..., description="Full text for embedding")
    keywords: list[str] = Field(default_factory=list, description="LLM-generated interest keywords")
    metadata: CourseMetadata


class TransformStats(BaseModel):
    """Statistics from the transformation pipeline."""

    total_courses: int = 0
    successful: int = 0
    failed_keywords: int = 0
    avg_document_length: float = 0.0
    avg_keywords_per_course: float = 0.0
    total_tokens_used: int = 0
    llm_calls: int = 0


class TransformOutput(BaseModel):
    """Output schema for transformed courses JSON file."""

    semester: str
    semester_name: str = Field(default="", description="Human-readable, e.g., 'Summer 2026'")
    transformed_at: datetime = Field(default_factory=datetime.now)
    total_courses: int = 0
    stats: TransformStats = Field(default_factory=TransformStats)
    courses: list[TransformedCourse] = Field(default_factory=list)
