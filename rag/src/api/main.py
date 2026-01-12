"""FastAPI application for the RAG course recommendation service."""

import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.query import QueryEngine

from .dependencies import set_query_engine, clear_query_engine
from .routes import router

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup, cleanup on shutdown."""
    # Get configuration from environment
    chroma_path = Path(
        os.getenv("CHROMA_PATH", Path(__file__).parent.parent.parent / "data" / "chroma")
    )
    collection_name = os.getenv("COLLECTION_NAME", "courses_1264")
    openai_api_key = os.getenv("OPENAI_API_KEY")
    google_api_key = os.getenv("GOOGLE_API_KEY")

    if not openai_api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is required")

    if not google_api_key:
        raise RuntimeError("GOOGLE_API_KEY environment variable is required")

    # Initialize query engine
    engine = QueryEngine(
        chroma_path=chroma_path,
        collection_name=collection_name,
        openai_api_key=openai_api_key,
        google_api_key=google_api_key,
    )
    set_query_engine(engine)

    yield

    # Cleanup
    clear_query_engine()


# Create FastAPI app
app = FastAPI(
    title="PickMyElective RAG Service",
    description="Course recommendation service using RAG (Retrieval-Augmented Generation)",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)
