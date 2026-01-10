"""Pytest fixtures for RAG server tests."""

import os
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from src.api.main import app
from src.api.dependencies import set_query_engine, clear_query_engine
from src.query.models import QueryFilters


# Sample course metadata for testing
SAMPLE_COURSES = [
    {
        "id": "cmpt-120-2026su",
        "document": "CMPT 120 - Introduction to Computing\nDepartment: CMPT\n\nIntroduction to programming.",
        "metadata": {
            "course_code": "CMPT 120",
            "title": "Introduction to Computing",
            "department": "CMPT",
            "level": 100,
            "units": 3,
            "campuses": "Burnaby,Surrey",
            "wqb": "",
            "has_prerequisites": False,
            "has_wqb": False,
            "delivery_methods": "In Person",
            "elective_score": 15,
            "prerequisite_level": "none",
            "prerequisites_raw": "",
            "instructors": "Dr. Smith",
        },
        "distance": 0.3,
    },
    {
        "id": "psyc-100-2026su",
        "document": "PSYC 100 - Introduction to Psychology\nDepartment: PSYC\n\nIntroduction to psychology.",
        "metadata": {
            "course_code": "PSYC 100",
            "title": "Introduction to Psychology",
            "department": "PSYC",
            "level": 100,
            "units": 3,
            "campuses": "Burnaby",
            "wqb": "B-Soc",
            "has_prerequisites": False,
            "has_wqb": True,
            "delivery_methods": "In Person",
            "elective_score": 20,
            "prerequisite_level": "none",
            "prerequisites_raw": "",
            "instructors": "Dr. Jones",
        },
        "distance": 0.35,
    },
    {
        "id": "macm-101-2026su",
        "document": "MACM 101 - Discrete Mathematics\nDepartment: MACM\n\nIntroduction to discrete math.",
        "metadata": {
            "course_code": "MACM 101",
            "title": "Discrete Mathematics",
            "department": "MACM",
            "level": 100,
            "units": 3,
            "campuses": "Burnaby",
            "wqb": "Q",
            "has_prerequisites": True,
            "has_wqb": True,
            "delivery_methods": "In Person",
            "elective_score": 12,
            "prerequisite_level": "required",
            "prerequisites_raw": "MATH 100",
            "instructors": "Dr. Brown",
        },
        "distance": 0.4,
    },
    {
        "id": "phil-100w-2026su",
        "document": "PHIL 100W - Introduction to Philosophy\nDepartment: PHIL\n\nIntroduction to philosophical thinking.",
        "metadata": {
            "course_code": "PHIL 100W",
            "title": "Introduction to Philosophy",
            "department": "PHIL",
            "level": 100,
            "units": 3,
            "campuses": "Burnaby,Vancouver",
            "wqb": "W,B-Hum",
            "has_prerequisites": False,
            "has_wqb": True,
            "delivery_methods": "In Person,Online",
            "elective_score": 25,
            "prerequisite_level": "none",
            "prerequisites_raw": "",
            "instructors": "Dr. Wilson",
        },
        "distance": 0.45,
    },
]


class MockChromaCollection:
    """Mock ChromaDB collection for testing."""

    def __init__(self, courses: list[dict] | None = None):
        self.courses = courses or SAMPLE_COURSES

    def query(
        self,
        query_embeddings: list[list[float]],
        where: dict | None = None,
        n_results: int = 10,
        include: list[str] | None = None,
    ) -> dict:
        """Mock query method that filters based on where clause."""
        filtered = self.courses.copy()

        # Apply where filters (simplified)
        if where:
            filtered = self._apply_where_filter(filtered, where)

        # Limit results
        filtered = filtered[:n_results]

        return {
            "ids": [[c["id"] for c in filtered]],
            "documents": [[c["document"] for c in filtered]],
            "metadatas": [[c["metadata"] for c in filtered]],
            "distances": [[c["distance"] for c in filtered]],
        }

    def _apply_where_filter(self, courses: list[dict], where: dict) -> list[dict]:
        """Apply ChromaDB-style where filter."""
        result = []
        for course in courses:
            meta = course["metadata"]

            # Handle $and conditions
            if "$and" in where:
                if all(self._check_condition(meta, cond) for cond in where["$and"]):
                    result.append(course)
            else:
                if self._check_condition(meta, where):
                    result.append(course)

        return result

    def _check_condition(self, meta: dict, condition: dict) -> bool:
        """Check a single condition against metadata."""
        for field, constraint in condition.items():
            if field.startswith("$"):
                continue
            value = meta.get(field)
            if isinstance(constraint, dict):
                for op, expected in constraint.items():
                    if op == "$lte" and value > expected:
                        return False
                    if op == "$eq" and value != expected:
                        return False
            elif value != constraint:
                return False
        return True


class MockQueryEngine:
    """Mock QueryEngine for testing without real OpenAI/Gemini/ChromaDB calls."""

    def __init__(self, courses: list[dict] | None = None):
        self.collection = MockChromaCollection(courses)
        self.llm_model = "gemini-2.0-flash"
        self.embedding_model = "text-embedding-3-large"

    async def interpret_query(self, query: str):
        """Mock query interpretation."""
        from src.query.models import QueryInterpretation

        return QueryInterpretation(
            topics=["test", "topics"],
            interpretation=f"Looking for courses related to: {query}",
        )

    async def embed_query(self, text: str) -> list[float]:
        """Return mock embedding."""
        return [0.1] * 3072

    def build_filters(self, filters: QueryFilters) -> dict | None:
        """Build ChromaDB where clause."""
        conditions = []

        if filters.max_level is not None:
            conditions.append({"level": {"$lte": filters.max_level}})

        if filters.no_prerequisites:
            conditions.append({"has_prerequisites": {"$eq": False}})

        if not conditions:
            return None
        elif len(conditions) == 1:
            return conditions[0]
        else:
            return {"$and": conditions}

    def _post_filter_courses(
        self, courses: list[dict], filters: QueryFilters
    ) -> list[dict]:
        """Apply post-filters for list fields."""
        filtered = []

        for course in courses:
            metadata = course.get("metadata", {})

            # Campus filter
            if filters.campus:
                campuses_str = metadata.get("campuses", "")
                course_campuses = [c.strip() for c in campuses_str.split(",") if c.strip()]
                if not any(c in course_campuses for c in filters.campus):
                    continue

            # WQB filter
            if filters.wqb:
                wqb_str = metadata.get("wqb", "")
                course_wqb = [w.strip() for w in wqb_str.split(",") if w.strip()]
                if not any(w in course_wqb for w in filters.wqb):
                    continue

            # Department exclusion filter
            if filters.exclude_departments:
                dept = metadata.get("department", "")
                if dept in filters.exclude_departments:
                    continue

            filtered.append(course)

        return filtered

    def search_courses(
        self,
        query_embedding: list[float],
        filters: QueryFilters,
        n_results: int = 10,
    ) -> list[dict]:
        """Search mock courses."""
        where_filter = self.build_filters(filters)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            where=where_filter,
            n_results=n_results * 5,
            include=["documents", "metadatas", "distances"],
        )

        courses = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0
                relevance_score = max(0, min(1, 1 - distance))

                courses.append(
                    {
                        "id": doc_id,
                        "document": results["documents"][0][i] if results["documents"] else "",
                        "metadata": metadata,
                        "relevance_score": relevance_score,
                    }
                )

        courses = self._post_filter_courses(courses, filters)
        return courses[:n_results]

    async def generate_match_reason(
        self, query: str, course_code: str, title: str, description: str
    ) -> str:
        """Return mock match reason."""
        return f"This course matches your interest in {query}."

    async def recommend(
        self,
        query: str,
        filters: QueryFilters,
        top_k: int = 5,
        min_relevance: float = 0.30,
    ):
        """Mock recommend method."""
        from src.query.models import RecommendResponse, CourseResult

        interpretation = await self.interpret_query(query)
        query_embedding = await self.embed_query(" ".join(interpretation.topics))

        candidates = self.search_courses(
            query_embedding=query_embedding,
            filters=filters,
            n_results=top_k * 2,
        )

        candidates = [c for c in candidates if c["relevance_score"] >= min_relevance]

        courses = []
        for candidate in candidates[:top_k]:
            metadata = candidate["metadata"]

            campuses = metadata.get("campuses", "").split(",") if metadata.get("campuses") else []
            wqb = metadata.get("wqb", "").split(",") if metadata.get("wqb") else []
            delivery_methods = metadata.get("delivery_methods", "").split(",") if metadata.get("delivery_methods") else []

            document = candidate.get("document", "")
            description = ""
            if "\n\n" in document:
                parts = document.split("\n\n")
                if len(parts) >= 2:
                    description = parts[1]

            match_reason = await self.generate_match_reason(
                query=query,
                course_code=metadata.get("course_code", ""),
                title=metadata.get("title", ""),
                description=description,
            )

            instructors = metadata.get("instructors", "").split(",") if metadata.get("instructors") else []
            instructor = instructors[0].strip() if instructors else ""

            course = CourseResult(
                course_code=metadata.get("course_code", ""),
                title=metadata.get("title", ""),
                description=description,
                campus=campuses,
                wqb=wqb,
                units=metadata.get("units", 0),
                prerequisites=metadata.get("prerequisites_raw", ""),
                has_prerequisites=metadata.get("has_prerequisites", False),
                instructor=instructor,
                delivery_methods=delivery_methods,
                relevance_score=round(candidate["relevance_score"], 3),
                match_reason=match_reason,
            )
            courses.append(course)

        return RecommendResponse(
            success=True,
            query_interpretation=interpretation.interpretation,
            courses=courses,
        )


@pytest.fixture
def mock_query_engine():
    """Provide a mock QueryEngine instance."""
    return MockQueryEngine()


@pytest.fixture
def client(mock_query_engine):
    """Provide a FastAPI TestClient with mocked dependencies."""
    set_query_engine(mock_query_engine)
    yield TestClient(app)
    clear_query_engine()


@pytest.fixture
def sample_courses():
    """Provide sample course data for tests."""
    return SAMPLE_COURSES.copy()
