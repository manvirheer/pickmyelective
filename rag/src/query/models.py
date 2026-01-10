"""Models for the course query/recommendation API."""

from pydantic import BaseModel, Field


class QueryFilters(BaseModel):
    """Filters for course search."""

    campus: list[str] | None = Field(
        default=None,
        description="Filter by campus: Burnaby, Surrey, Vancouver, Online",
    )
    wqb: list[str] | None = Field(
        default=None,
        description="Filter by WQB: W, Q, B-Sci, B-Soc, B-Hum",
    )
    max_level: int | None = Field(
        default=None,
        description="Maximum course level (100, 200, 300)",
    )
    no_prerequisites: bool | None = Field(
        default=None,
        description="Only courses with no prerequisites",
    )
    exclude_departments: list[str] | None = Field(
        default=None,
        description="Departments to exclude, e.g., ['CMPT', 'MACM']",
    )


class RecommendRequest(BaseModel):
    """Request body for /api/recommend endpoint."""

    query: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Natural language query describing interests",
    )
    filters: QueryFilters = Field(
        default_factory=QueryFilters,
        description="Optional filters to narrow results",
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
        description="Number of courses to return",
    )
    min_relevance: float = Field(
        default=0.30,
        ge=0.0,
        le=1.0,
        description="Minimum relevance score threshold (0.0-1.0)",
    )


class CourseResult(BaseModel):
    """A single course in the recommendation response."""

    course_code: str
    title: str
    description: str
    campus: list[str]
    wqb: list[str]
    units: int
    prerequisites: str
    has_prerequisites: bool
    instructor: str
    delivery_methods: list[str]
    relevance_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Semantic similarity score",
    )
    match_reason: str = Field(
        ...,
        description="LLM-generated explanation of why this course matches",
    )


class RecommendResponse(BaseModel):
    """Response body for /api/recommend endpoint."""

    success: bool = True
    query_interpretation: str = Field(
        ...,
        description="LLM interpretation of what the user is looking for",
    )
    courses: list[CourseResult] = Field(
        default_factory=list,
        description="Ranked course recommendations",
    )


class ErrorResponse(BaseModel):
    """Error response body."""

    success: bool = False
    error: str


class QueryInterpretation(BaseModel):
    """Internal model for LLM query interpretation output."""

    topics: list[str] = Field(
        default_factory=list,
        description="Extracted topics from user query",
    )
    interpretation: str = Field(
        default="",
        description="Human-readable interpretation",
    )
