"""Tests for filter logic in the query engine."""

import pytest

from src.query.models import QueryFilters


class TestQueryFiltersModel:
    """Tests for the QueryFilters Pydantic model."""

    def test_default_filters(self):
        """All filters should be None by default."""
        filters = QueryFilters()
        assert filters.campus is None
        assert filters.wqb is None
        assert filters.max_level is None
        assert filters.no_prerequisites is None
        assert filters.exclude_departments is None

    def test_campus_filter(self):
        """Campus filter should accept list of strings."""
        filters = QueryFilters(campus=["Burnaby", "Surrey"])
        assert filters.campus == ["Burnaby", "Surrey"]

    def test_wqb_filter(self):
        """WQB filter should accept list of designation codes."""
        filters = QueryFilters(wqb=["W", "Q", "B-Sci"])
        assert filters.wqb == ["W", "Q", "B-Sci"]

    def test_max_level_filter(self):
        """Max level filter should accept integer."""
        filters = QueryFilters(max_level=200)
        assert filters.max_level == 200

    def test_no_prerequisites_filter(self):
        """No prerequisites filter should accept boolean."""
        filters = QueryFilters(no_prerequisites=True)
        assert filters.no_prerequisites is True

    def test_exclude_departments_filter(self):
        """Exclude departments filter should accept list of strings."""
        filters = QueryFilters(exclude_departments=["CMPT", "MACM"])
        assert filters.exclude_departments == ["CMPT", "MACM"]

    def test_combined_filters(self):
        """Multiple filters can be combined."""
        filters = QueryFilters(
            campus=["Burnaby"],
            wqb=["B-Soc"],
            max_level=200,
            no_prerequisites=True,
            exclude_departments=["CMPT"],
        )
        assert filters.campus == ["Burnaby"]
        assert filters.wqb == ["B-Soc"]
        assert filters.max_level == 200
        assert filters.no_prerequisites is True
        assert filters.exclude_departments == ["CMPT"]


class TestPostFilterLogic:
    """Tests for the _post_filter_courses method."""

    def test_exclude_single_department(self, mock_query_engine, sample_courses):
        """Should exclude courses from a single department."""
        filters = QueryFilters(exclude_departments=["CMPT"])

        # Convert sample_courses to the format expected by _post_filter_courses
        courses = [{"metadata": c["metadata"]} for c in sample_courses]
        result = mock_query_engine._post_filter_courses(courses, filters)

        # Should not contain CMPT courses
        departments = [c["metadata"]["department"] for c in result]
        assert "CMPT" not in departments

    def test_exclude_multiple_departments(self, mock_query_engine, sample_courses):
        """Should exclude courses from multiple departments."""
        filters = QueryFilters(exclude_departments=["CMPT", "MACM"])

        courses = [{"metadata": c["metadata"]} for c in sample_courses]
        result = mock_query_engine._post_filter_courses(courses, filters)

        departments = [c["metadata"]["department"] for c in result]
        assert "CMPT" not in departments
        assert "MACM" not in departments

    def test_campus_filter(self, mock_query_engine, sample_courses):
        """Should filter by campus."""
        filters = QueryFilters(campus=["Vancouver"])

        courses = [{"metadata": c["metadata"]} for c in sample_courses]
        result = mock_query_engine._post_filter_courses(courses, filters)

        # Only PHIL 100W has Vancouver
        for course in result:
            campuses = course["metadata"]["campuses"].split(",")
            assert "Vancouver" in campuses

    def test_wqb_filter(self, mock_query_engine, sample_courses):
        """Should filter by WQB designations."""
        filters = QueryFilters(wqb=["W"])

        courses = [{"metadata": c["metadata"]} for c in sample_courses]
        result = mock_query_engine._post_filter_courses(courses, filters)

        # Only PHIL 100W has W
        for course in result:
            wqb = course["metadata"]["wqb"].split(",")
            assert "W" in wqb

    def test_combined_post_filters(self, mock_query_engine, sample_courses):
        """Should apply multiple post-filters together."""
        filters = QueryFilters(
            campus=["Burnaby"],
            exclude_departments=["CMPT"],
        )

        courses = [{"metadata": c["metadata"]} for c in sample_courses]
        result = mock_query_engine._post_filter_courses(courses, filters)

        for course in result:
            assert course["metadata"]["department"] != "CMPT"
            campuses = course["metadata"]["campuses"].split(",")
            assert "Burnaby" in campuses

    def test_no_filters_returns_all(self, mock_query_engine, sample_courses):
        """Should return all courses when no filters applied."""
        filters = QueryFilters()

        courses = [{"metadata": c["metadata"]} for c in sample_courses]
        result = mock_query_engine._post_filter_courses(courses, filters)

        assert len(result) == len(courses)


class TestBuildFilters:
    """Tests for the build_filters method (ChromaDB where clause)."""

    def test_no_filters_returns_none(self, mock_query_engine):
        """Should return None when no scalar filters."""
        filters = QueryFilters()
        result = mock_query_engine.build_filters(filters)
        assert result is None

    def test_max_level_filter(self, mock_query_engine):
        """Should build max level where clause."""
        filters = QueryFilters(max_level=200)
        result = mock_query_engine.build_filters(filters)
        assert result == {"level": {"$lte": 200}}

    def test_no_prerequisites_filter(self, mock_query_engine):
        """Should build no prerequisites where clause."""
        filters = QueryFilters(no_prerequisites=True)
        result = mock_query_engine.build_filters(filters)
        assert result == {"has_prerequisites": {"$eq": False}}

    def test_combined_scalar_filters(self, mock_query_engine):
        """Should combine scalar filters with $and."""
        filters = QueryFilters(max_level=200, no_prerequisites=True)
        result = mock_query_engine.build_filters(filters)
        assert "$and" in result
        assert {"level": {"$lte": 200}} in result["$and"]
        assert {"has_prerequisites": {"$eq": False}} in result["$and"]

    def test_list_filters_not_in_where_clause(self, mock_query_engine):
        """List filters (campus, wqb, exclude_departments) should not appear in where clause."""
        filters = QueryFilters(
            campus=["Burnaby"],
            wqb=["B-Soc"],
            exclude_departments=["CMPT"],
        )
        result = mock_query_engine.build_filters(filters)
        # These are post-filters, not ChromaDB where filters
        assert result is None


class TestSearchCourses:
    """Tests for the search_courses method."""

    @pytest.mark.asyncio
    async def test_search_applies_filters(self, mock_query_engine):
        """Search should apply both ChromaDB and post filters."""
        filters = QueryFilters(
            no_prerequisites=True,
            exclude_departments=["CMPT"],
        )

        embedding = [0.1] * 3072
        results = mock_query_engine.search_courses(embedding, filters, n_results=10)

        for course in results:
            assert course["metadata"]["has_prerequisites"] is False
            assert course["metadata"]["department"] != "CMPT"

    @pytest.mark.asyncio
    async def test_search_returns_relevance_scores(self, mock_query_engine):
        """Search results should include relevance scores."""
        filters = QueryFilters()
        embedding = [0.1] * 3072
        results = mock_query_engine.search_courses(embedding, filters, n_results=10)

        for course in results:
            assert "relevance_score" in course
            assert 0.0 <= course["relevance_score"] <= 1.0
