"""Shared dependencies for the API."""

from src.query import QueryEngine

# Global query engine instance (initialized in main.py lifespan)
query_engine: QueryEngine | None = None


def get_query_engine() -> QueryEngine:
    """Get the query engine instance."""
    if query_engine is None:
        raise RuntimeError("Query engine not initialized")
    return query_engine


def set_query_engine(engine: QueryEngine) -> None:
    """Set the query engine instance."""
    global query_engine
    query_engine = engine


def clear_query_engine() -> None:
    """Clear the query engine instance."""
    global query_engine
    query_engine = None
