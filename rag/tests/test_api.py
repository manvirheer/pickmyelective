"""Tests for API routes."""

import pytest


class TestHealthEndpoint:
    """Tests for the /health endpoint."""

    def test_health_returns_ok(self, client):
        """Health endpoint should return healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "pickmyelective-rag"


class TestRecommendEndpoint:
    """Tests for the /api/recommend endpoint."""

    def test_recommend_returns_courses(self, client):
        """Recommend endpoint should return course recommendations."""
        response = client.post(
            "/api/recommend",
            json={"query": "introduction to programming", "top_k": 5},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "query_interpretation" in data
        assert "courses" in data
        assert isinstance(data["courses"], list)

    def test_recommend_with_filters(self, client):
        """Recommend endpoint should accept filter parameters."""
        response = client.post(
            "/api/recommend",
            json={
                "query": "easy course",
                "filters": {
                    "campus": ["Burnaby"],
                    "no_prerequisites": True,
                },
                "top_k": 3,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_recommend_with_department_exclusion(self, client):
        """Recommend endpoint should exclude specified departments."""
        response = client.post(
            "/api/recommend",
            json={
                "query": "programming",
                "filters": {"exclude_departments": ["CMPT"]},
                "top_k": 5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify no CMPT courses in results
        for course in data["courses"]:
            assert not course["course_code"].startswith("CMPT"), \
                f"CMPT course {course['course_code']} should be excluded"

    def test_recommend_with_wqb_filter(self, client):
        """Recommend endpoint should filter by WQB requirements."""
        response = client.post(
            "/api/recommend",
            json={
                "query": "breadth course",
                "filters": {"wqb": ["B-Soc", "B-Hum"]},
                "top_k": 5,
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

        # Verify all courses have WQB designations
        for course in data["courses"]:
            assert any(w in course["wqb"] for w in ["B-Soc", "B-Hum"]), \
                f"Course {course['course_code']} should have B-Soc or B-Hum"

    def test_recommend_validates_query_length(self, client):
        """Recommend endpoint should validate minimum query length."""
        response = client.post(
            "/api/recommend",
            json={"query": "ab"},  # Too short (min 3 chars)
        )
        assert response.status_code == 422  # Validation error

    def test_recommend_validates_top_k_range(self, client):
        """Recommend endpoint should validate top_k range."""
        response = client.post(
            "/api/recommend",
            json={"query": "programming", "top_k": 100},  # Max is 10
        )
        assert response.status_code == 422

    def test_recommend_course_result_format(self, client):
        """Course results should have expected fields."""
        response = client.post(
            "/api/recommend",
            json={"query": "introduction", "top_k": 1},
        )
        assert response.status_code == 200
        data = response.json()

        if data["courses"]:
            course = data["courses"][0]
            expected_fields = [
                "course_code",
                "title",
                "description",
                "campus",
                "wqb",
                "units",
                "prerequisites",
                "has_prerequisites",
                "instructor",
                "delivery_methods",
                "relevance_score",
                "match_reason",
            ]
            for field in expected_fields:
                assert field in course, f"Missing field: {field}"

    def test_recommend_relevance_scores_in_range(self, client):
        """Relevance scores should be between 0 and 1."""
        response = client.post(
            "/api/recommend",
            json={"query": "math course", "top_k": 5},
        )
        assert response.status_code == 200
        data = response.json()

        for course in data["courses"]:
            assert 0.0 <= course["relevance_score"] <= 1.0, \
                f"Invalid relevance score: {course['relevance_score']}"
