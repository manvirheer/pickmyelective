"""Course indexing pipeline for ChromaDB with OpenAI embeddings."""

import asyncio
import json
import time
from pathlib import Path

import chromadb
from chromadb.config import Settings
from openai import AsyncOpenAI
from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TaskProgressColumn,
    TextColumn,
)

from src.transform.models import TransformedCourse, TransformOutput

from .models import (
    IndexingConfig,
    IndexingStats,
    IndexOutput,
    VerificationResult,
)

console = Console()


class CourseIndexer:
    """Indexes transformed courses into ChromaDB with OpenAI embeddings."""

    def __init__(
        self,
        config: IndexingConfig,
        chroma_path: Path,
        openai_api_key: str | None = None,
    ):
        self.config = config
        self.chroma_path = chroma_path
        self.stats = IndexingStats()

        # Initialize OpenAI client
        self.openai = (
            AsyncOpenAI(api_key=openai_api_key) if openai_api_key else AsyncOpenAI()
        )

        # Initialize ChromaDB with persistent storage
        self.chroma_client = chromadb.PersistentClient(
            path=str(chroma_path),
            settings=Settings(anonymized_telemetry=False),
        )

        self.collection = None

    def _get_or_create_collection(self, recreate: bool = False) -> None:
        """Get existing collection or create new one."""
        if recreate:
            # Delete existing collection if it exists
            try:
                self.chroma_client.delete_collection(self.config.collection_name)
                console.print(
                    f"[yellow]Deleted existing collection: {self.config.collection_name}[/yellow]"
                )
            except Exception:
                pass  # Collection doesn't exist

        # Create/get collection with distance metric
        self.collection = self.chroma_client.get_or_create_collection(
            name=self.config.collection_name,
            metadata={"hnsw:space": self.config.distance_metric},
        )

    async def generate_embeddings(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        """Generate embeddings for a batch of texts using OpenAI API."""
        response = await self.openai.embeddings.create(
            model=self.config.embedding_model,
            input=texts,
        )

        # Track token usage
        self.stats.total_tokens_used += response.usage.total_tokens

        # Extract embeddings in order
        embeddings = [item.embedding for item in response.data]
        return embeddings

    def _prepare_metadata(self, course: TransformedCourse) -> dict:
        """Convert TransformedCourse metadata to flat ChromaDB format.

        ChromaDB requires flat metadata - no nested objects or lists.
        Lists are stored as comma-separated strings for $contains filtering.
        """
        meta = course.metadata
        return {
            "course_code": course.course_code,
            "title": course.title,
            "department": meta.department,
            "level": meta.level,
            "units": meta.units,
            "elective_score": meta.elective_score,
            "total_capacity": meta.total_capacity,
            "has_wqb": meta.has_wqb,
            "has_prerequisites": meta.has_prerequisites,
            "campuses": ",".join(meta.campuses),
            "wqb": ",".join(meta.wqb),
            "delivery_methods": ",".join(meta.delivery_methods),
            "prerequisite_level": meta.prerequisite_level,
            "keywords": ",".join(course.keywords),
        }

    async def index_batch(
        self,
        courses: list[TransformedCourse],
    ) -> int:
        """Index a batch of courses into ChromaDB."""
        if not courses:
            return 0

        # Prepare data for batch
        ids = [course.id for course in courses]
        documents = [course.document for course in courses]
        metadatas = [self._prepare_metadata(course) for course in courses]

        # Generate embeddings
        embeddings = await self.generate_embeddings(documents)

        # Upsert to ChromaDB (handles both insert and update)
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas,
        )

        return len(courses)

    async def index_all(
        self,
        courses: list[TransformedCourse],
        semester: str,
        recreate: bool = False,
    ) -> IndexOutput:
        """Index all courses with progress tracking."""
        start_time = time.time()

        # Setup collection
        self._get_or_create_collection(recreate=recreate)

        total = len(courses)
        self.stats.total_documents = total
        batch_size = self.config.batch_size

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            console=console,
        ) as progress:
            task = progress.add_task(
                f"[cyan]Indexing {total} courses...",
                total=total,
            )

            # Process in batches
            for i in range(0, total, batch_size):
                batch = courses[i : i + batch_size]
                indexed = await self.index_batch(batch)

                self.stats.documents_indexed += indexed
                self.stats.embedding_batches += 1

                progress.update(task, advance=len(batch))

                # Rate limiting delay between batches
                if i + batch_size < total:
                    await asyncio.sleep(self.config.delay_between_batches)

        # Calculate timing
        self.stats.indexing_duration_seconds = time.time() - start_time
        self.stats.total_embeddings_generated = self.stats.documents_indexed

        if self.stats.embedding_batches > 0:
            avg_batch_time = (
                self.stats.indexing_duration_seconds * 1000
            ) / self.stats.embedding_batches
            self.stats.avg_embedding_time_ms = avg_batch_time

        return IndexOutput(
            semester=semester,
            collection_name=self.config.collection_name,
            stats=self.stats,
            chroma_path=str(self.chroma_path),
            sample_ids=[c.id for c in courses[:5]],
        )

    def verify_index(self) -> VerificationResult:
        """Verify the index is working correctly."""
        result = VerificationResult()

        # Check collection exists
        try:
            collections = self.chroma_client.list_collections()
            result.collection_exists = any(
                c.name == self.config.collection_name for c in collections
            )
        except Exception:
            return result

        if not result.collection_exists:
            return result

        # Get document count
        result.document_count = self.collection.count()

        # Get metadata fields from a sample document
        if result.document_count > 0:
            sample = self.collection.peek(limit=1)
            if sample["metadatas"]:
                result.metadata_fields = list(sample["metadatas"][0].keys())

        result.is_valid = (
            result.collection_exists
            and result.document_count > 0
            and len(result.metadata_fields) > 0
        )

        return result


def load_transformed_courses(path: Path) -> tuple[list[TransformedCourse], str]:
    """Load transformed courses from JSON file."""
    with open(path) as f:
        data = json.load(f)

    output = TransformOutput(**data)
    return output.courses, output.semester
