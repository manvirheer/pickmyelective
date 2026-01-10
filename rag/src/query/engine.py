"""Query engine for course recommendations using RAG."""

import json
from pathlib import Path

import chromadb
from chromadb.config import Settings
from google import genai
from google.genai import types
from openai import AsyncOpenAI

from .models import (
    QueryFilters,
    QueryInterpretation,
    CourseResult,
    RecommendResponse,
)


# Ranking weights (determined via evaluation - see scripts/evaluate_ranking.py)
# Combined score = RELEVANCE_WEIGHT * relevance + ELECTIVE_WEIGHT * normalized_elective
RELEVANCE_WEIGHT = 0.80
ELECTIVE_WEIGHT = 0.20
MAX_ELECTIVE_SCORE = 25  # Max possible elective score for normalization


# Prompts for LLM calls
INTERPRET_PROMPT = """Extract the main topics and interests from this course search query.

Query: "{query}"

Return a JSON object with:
- "topics": list of 3-5 key topics/subjects the user is interested in
- "interpretation": one sentence describing what the user is looking for

Common patterns to recognize:
- "easy" or "bird course" → introductory, beginner-friendly, accessible, low workload
- "breadth" or "WQB" → general education, breadth requirement, diverse topics
- "no prereqs" or "no prerequisites" → open enrollment, foundational, entry-level
- "interesting" → engaging, unique perspectives, thought-provoking

Example outputs:
{{"topics": ["psychology", "human behavior", "cognition"], "interpretation": "Looking for courses about how people think and make decisions"}}
{{"topics": ["introductory", "accessible", "beginner-friendly", "low workload"], "interpretation": "Looking for an easy, manageable course with lighter workload"}}
{{"topics": ["general education", "breadth requirement", "diverse disciplines"], "interpretation": "Looking for a course that fulfills breadth/WQB requirements"}}

Return ONLY valid JSON, no other text."""

MATCH_REASON_PROMPT = """The user is searching for courses with this interest:
"{query}"

Explain in 1-2 sentences why this course is a good match:

Course: {course_code} - {title}
Description: {description}

Be specific about how the course content relates to their interest. Focus on concrete connections."""


class QueryEngine:
    """RAG query engine for course recommendations."""

    def __init__(
        self,
        chroma_path: Path,
        collection_name: str,
        openai_api_key: str | None = None,
        google_api_key: str | None = None,
        llm_model: str = "gemini-2.0-flash",
        embedding_model: str = "text-embedding-3-large",
    ):
        """Initialize the query engine.

        Args:
            chroma_path: Path to ChromaDB persistent storage
            collection_name: Name of the collection to query
            openai_api_key: OpenAI API key for embeddings (uses env var if not provided)
            google_api_key: Google API key for Gemini (uses env var if not provided)
            llm_model: Gemini model for query interpretation and match reasons
            embedding_model: OpenAI model for generating query embeddings
        """
        self.llm_model = llm_model
        self.embedding_model = embedding_model

        # Initialize OpenAI client (for embeddings only)
        self.openai = (
            AsyncOpenAI(api_key=openai_api_key) if openai_api_key else AsyncOpenAI()
        )

        # Initialize Gemini client (for chat completions)
        self.gemini = (
            genai.Client(api_key=google_api_key) if google_api_key else genai.Client()
        )

        # Initialize ChromaDB client
        self.chroma_client = chromadb.PersistentClient(
            path=str(chroma_path),
            settings=Settings(anonymized_telemetry=False),
        )

        # Get the collection
        self.collection = self.chroma_client.get_collection(name=collection_name)

    async def interpret_query(self, query: str) -> QueryInterpretation:
        """LLM Call #1: Extract topics and interpretation from user query."""
        prompt = INTERPRET_PROMPT.format(query=query)

        response = await self.gemini.aio.models.generate_content(
            model=self.llm_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=200,
                temperature=0.2,
            ),
        )

        content = response.text or "{}"

        # Parse JSON response
        try:
            data = json.loads(content)
            return QueryInterpretation(
                topics=data.get("topics", []),
                interpretation=data.get("interpretation", ""),
            )
        except json.JSONDecodeError:
            # Fallback: use query as-is
            return QueryInterpretation(
                topics=[query],
                interpretation=f"Looking for courses related to: {query}",
            )

    async def embed_query(self, text: str) -> list[float]:
        """Generate embedding for search text."""
        response = await self.openai.embeddings.create(
            model=self.embedding_model,
            input=text,
        )
        return response.data[0].embedding

    def build_filters(self, filters: QueryFilters) -> dict | None:
        """Convert QueryFilters to ChromaDB where clause.

        Note: ChromaDB doesn't support $contains, so list filters (campus, wqb)
        are applied as post-filters in Python after retrieval.
        """
        conditions = []

        # Max level filter (scalar - can use ChromaDB)
        if filters.max_level is not None:
            conditions.append({"level": {"$lte": filters.max_level}})

        # No prerequisites filter (boolean - can use ChromaDB)
        if filters.no_prerequisites:
            conditions.append({"has_prerequisites": {"$eq": False}})

        # Combine all conditions with AND
        if not conditions:
            return None
        elif len(conditions) == 1:
            return conditions[0]
        else:
            return {"$and": conditions}

    def _post_filter_courses(
        self, courses: list[dict], filters: QueryFilters
    ) -> list[dict]:
        """Apply filters that ChromaDB can't handle (list fields)."""
        filtered = []

        for course in courses:
            metadata = course.get("metadata", {})

            # Campus filter (comma-separated string)
            if filters.campus:
                campuses_str = metadata.get("campuses", "")
                course_campuses = [c.strip() for c in campuses_str.split(",") if c.strip()]
                if not any(c in course_campuses for c in filters.campus):
                    continue

            # WQB filter (comma-separated string)
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
        """Search ChromaDB for matching courses."""
        where_filter = self.build_filters(filters)

        # Calculate fetch multiplier based on active filters
        # More filters = need more candidates to ensure we get n_results after filtering
        # For list filters (campus, wqb), we need to fetch many more since these can
        # filter out most courses and matching courses may rank low semantically
        has_list_filters = filters.campus or filters.wqb or filters.exclude_departments
        has_scalar_filters = filters.max_level is not None or filters.no_prerequisites
        if has_list_filters:
            # List filters (campus, wqb) are applied post-retrieval and can be very
            # restrictive. Fetch most of the collection to ensure we find matches.
            fetch_count = max(200, n_results * 20)
        elif has_scalar_filters:
            fetch_count = n_results * 5  # Moderate filtering
        else:
            fetch_count = n_results  # No filtering

        results = self.collection.query(
            query_embeddings=[query_embedding],
            where=where_filter,
            n_results=fetch_count,
            include=["documents", "metadatas", "distances"],
        )

        # Convert to list of course dicts
        courses = []
        if results["ids"] and results["ids"][0]:
            for i, doc_id in enumerate(results["ids"][0]):
                metadata = results["metadatas"][0][i] if results["metadatas"] else {}
                distance = results["distances"][0][i] if results["distances"] else 0

                # Convert distance to similarity score (cosine distance to similarity)
                # ChromaDB returns L2 distance by default, but we configured cosine
                # For cosine, distance is 1 - similarity, so similarity = 1 - distance
                relevance_score = max(0, min(1, 1 - distance))

                # Compute combined score (80% relevance + 20% elective)
                elective_score = metadata.get("elective_score", 0)
                normalized_elective = elective_score / MAX_ELECTIVE_SCORE
                combined_score = (
                    RELEVANCE_WEIGHT * relevance_score
                    + ELECTIVE_WEIGHT * normalized_elective
                )

                courses.append(
                    {
                        "id": doc_id,
                        "document": results["documents"][0][i]
                        if results["documents"]
                        else "",
                        "metadata": metadata,
                        "relevance_score": relevance_score,
                        "combined_score": combined_score,
                    }
                )

        # Apply post-filters for list fields (campus, wqb)
        courses = self._post_filter_courses(courses, filters)

        # Sort by combined score (semantic relevance + elective quality)
        courses.sort(key=lambda c: c["combined_score"], reverse=True)

        return courses[:n_results]

    async def generate_match_reason(
        self,
        query: str,
        course_code: str,
        title: str,
        description: str,
    ) -> str:
        """LLM Call #2: Generate explanation for why course matches."""
        # Truncate description to avoid token limits
        desc_truncated = description[:500] if len(description) > 500 else description

        prompt = MATCH_REASON_PROMPT.format(
            query=query,
            course_code=course_code,
            title=title,
            description=desc_truncated,
        )

        response = await self.gemini.aio.models.generate_content(
            model=self.llm_model,
            contents=prompt,
            config=types.GenerateContentConfig(
                max_output_tokens=100,
                temperature=0.5,
            ),
        )

        return response.text or "Matches your search interests."

    async def recommend(
        self,
        query: str,
        filters: QueryFilters,
        top_k: int = 5,
        min_relevance: float = 0.30,
    ) -> RecommendResponse:
        """Main recommendation method - orchestrates the full RAG pipeline."""
        # Step 1: Interpret the query
        interpretation = await self.interpret_query(query)

        # Step 2: Generate embedding from interpreted topics
        search_text = " ".join(interpretation.topics)
        query_embedding = await self.embed_query(search_text)

        # Step 3: Search ChromaDB (fetch more than top_k to allow for filtering)
        candidates = self.search_courses(
            query_embedding=query_embedding,
            filters=filters,
            n_results=top_k * 2,
        )

        # Step 4: Filter by minimum relevance score
        candidates = [c for c in candidates if c["relevance_score"] >= min_relevance]

        # Step 5: Generate match reasons for top results
        courses = []
        for candidate in candidates[:top_k]:
            metadata = candidate["metadata"]

            # Parse comma-separated lists back to arrays
            campuses = (
                metadata.get("campuses", "").split(",")
                if metadata.get("campuses")
                else []
            )
            wqb = metadata.get("wqb", "").split(",") if metadata.get("wqb") else []
            delivery_methods = (
                metadata.get("delivery_methods", "").split(",")
                if metadata.get("delivery_methods")
                else []
            )

            # Extract description from document text
            # Document format: "CODE - Title\n...\n\nDescription\n..."
            document = candidate.get("document", "")
            description = ""
            if "\n\n" in document:
                parts = document.split("\n\n")
                if len(parts) >= 2:
                    description = parts[1]

            # Generate match reason
            match_reason = await self.generate_match_reason(
                query=query,
                course_code=metadata.get("course_code", ""),
                title=metadata.get("title", ""),
                description=description,
            )

            # Get instructor (first one if multiple)
            instructors = (
                metadata.get("instructors", "").split(",")
                if metadata.get("instructors")
                else []
            )
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
