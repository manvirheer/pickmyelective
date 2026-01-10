"""Models for course indexing into ChromaDB."""

from datetime import datetime

from pydantic import BaseModel, Field


class IndexingConfig(BaseModel):
    """Configuration for the indexing pipeline."""

    collection_name: str = Field(..., description="ChromaDB collection name")
    embedding_model: str = Field(default="text-embedding-3-large")
    embedding_dimensions: int = Field(default=3072)
    batch_size: int = Field(default=100, description="Batch size for embedding API")
    distance_metric: str = Field(default="cosine", description="cosine, l2, or ip")

    # Rate limiting
    requests_per_minute: int = Field(default=3000, description="OpenAI rate limit")
    delay_between_batches: float = Field(
        default=0.5, description="Seconds between batches"
    )


class IndexingStats(BaseModel):
    """Statistics from the indexing pipeline."""

    total_documents: int = 0
    documents_indexed: int = 0
    documents_skipped: int = 0

    # Embedding stats
    total_embeddings_generated: int = 0
    embedding_batches: int = 0
    avg_embedding_time_ms: float = 0.0

    # API usage
    total_tokens_used: int = 0

    # Timing
    indexing_duration_seconds: float = 0.0


class IndexOutput(BaseModel):
    """Output schema for indexing operation."""

    semester: str
    collection_name: str
    indexed_at: datetime = Field(default_factory=datetime.now)
    stats: IndexingStats = Field(default_factory=IndexingStats)
    chroma_path: str = ""
    sample_ids: list[str] = Field(
        default_factory=list, description="First 5 indexed IDs"
    )


class VerificationResult(BaseModel):
    """Result of index verification."""

    collection_exists: bool = False
    document_count: int = 0
    sample_query_results: int = 0
    metadata_fields: list[str] = Field(default_factory=list)
    is_valid: bool = False
