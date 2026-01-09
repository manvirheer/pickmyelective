"""API routes for the RAG service."""

from fastapi import APIRouter, HTTPException

from src.query import RecommendRequest, RecommendResponse, ErrorResponse

from .dependencies import get_query_engine

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "pickmyelective-rag"}


@router.post(
    "/api/recommend",
    response_model=RecommendResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad request"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def recommend_courses(request: RecommendRequest) -> RecommendResponse:
    """
    Get course recommendations based on natural language query.

    This endpoint:
    1. Interprets the user's query using LLM
    2. Performs semantic search against the course database
    3. Generates explanations for why each course matches

    Returns top-k courses ranked by relevance with match reasons.
    """
    try:
        engine = get_query_engine()

        response = await engine.recommend(
            query=request.query,
            filters=request.filters,
            top_k=request.top_k,
            min_relevance=request.min_relevance,
        )

        # Check if we got any results
        if not response.courses:
            raise HTTPException(
                status_code=400,
                detail="No courses match your interests with the given filters. Try relaxing the constraints.",
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error: {str(e)}",
        )
