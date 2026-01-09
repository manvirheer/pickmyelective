#!/usr/bin/env python3
"""CLI script to index transformed courses into ChromaDB."""

import argparse
import asyncio
import os
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

from src.index.indexer import CourseIndexer, load_transformed_courses
from src.index.models import IndexingConfig

console = Console()


def print_stats(output) -> None:
    """Print indexing statistics."""
    stats = output.stats

    console.print("\n[bold green]Indexing Complete![/bold green]\n")

    table = Table(title="Indexing Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Collection", output.collection_name)
    table.add_row("ChromaDB Path", output.chroma_path)
    table.add_row("Total Documents", str(stats.total_documents))
    table.add_row("Documents Indexed", str(stats.documents_indexed))
    table.add_row("Embedding Batches", str(stats.embedding_batches))
    table.add_row("Avg Batch Time", f"{stats.avg_embedding_time_ms:.1f} ms")
    table.add_row("Total Tokens Used", f"{stats.total_tokens_used:,}")
    table.add_row("Duration", f"{stats.indexing_duration_seconds:.1f} seconds")

    console.print(table)

    if output.sample_ids:
        console.print(f"\n[dim]Sample IDs: {', '.join(output.sample_ids[:5])}[/dim]")


def print_verification(result) -> None:
    """Print verification results."""
    console.print("\n[bold]Index Verification:[/bold]")

    status = "[green]PASS[/green]" if result.is_valid else "[red]FAIL[/red]"
    console.print(f"  Status: {status}")
    console.print(f"  Collection exists: {result.collection_exists}")
    console.print(f"  Document count: {result.document_count}")
    console.print(f"  Metadata fields: {len(result.metadata_fields)}")

    if result.metadata_fields:
        console.print(f"  Fields: {', '.join(result.metadata_fields)}")


async def run_index(args) -> None:
    """Run the indexing pipeline."""
    load_dotenv()

    # Check for API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        console.print("[red]Error: OPENAI_API_KEY not set in environment[/red]")
        console.print("Set it in .env file or environment variable")
        sys.exit(1)

    # Load transformed courses
    console.print(f"[cyan]Loading courses from:[/cyan] {args.input}")
    courses, semester = load_transformed_courses(args.input)
    console.print(f"[green]Loaded {len(courses)} courses for semester {semester}[/green]")

    # Apply limit if specified
    if args.limit:
        courses = courses[:args.limit]
        console.print(f"[yellow]Limited to {args.limit} courses[/yellow]")

    # Determine collection name
    collection_name = args.collection or f"courses_{semester}"

    # Determine ChromaDB path
    chroma_path = args.chroma_path or (args.input.parent.parent / "chroma")
    chroma_path.mkdir(parents=True, exist_ok=True)

    # Configure indexer
    config = IndexingConfig(
        collection_name=collection_name,
        batch_size=args.batch_size,
    )

    console.print(f"[cyan]Collection:[/cyan] {collection_name}")
    console.print(f"[cyan]ChromaDB path:[/cyan] {chroma_path}")
    console.print(f"[cyan]Batch size:[/cyan] {args.batch_size}")

    if args.recreate:
        console.print("[yellow]Will recreate collection (--recreate)[/yellow]")

    # Initialize indexer
    indexer = CourseIndexer(
        config=config,
        chroma_path=chroma_path,
        openai_api_key=api_key,
    )

    # Run indexing
    output = await indexer.index_all(
        courses=courses,
        semester=semester,
        recreate=args.recreate,
    )

    # Print results
    print_stats(output)

    # Verify if requested
    if args.verify:
        result = indexer.verify_index()
        print_verification(result)


def main():
    parser = argparse.ArgumentParser(
        description="Index transformed courses into ChromaDB with OpenAI embeddings",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script:
  1. Loads transformed courses from Stage 3
  2. Generates embeddings using OpenAI text-embedding-3-large
  3. Stores documents in ChromaDB with metadata
  4. Supports upsert for idempotent re-runs

Examples:
  python index_courses.py                              # Index all courses
  python index_courses.py --limit 10                   # Test with 10 courses
  python index_courses.py --recreate                   # Delete and recreate collection
  python index_courses.py --verify                     # Verify after indexing
  python index_courses.py --batch-size 50              # Custom batch size
        """,
    )

    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=Path(__file__).parent.parent / "data" / "transformed" / "documents_1264.json",
        help="Input JSON file from transform stage",
    )

    parser.add_argument(
        "--chroma-path",
        type=Path,
        default=None,
        help="ChromaDB persistent storage path (default: data/chroma/)",
    )

    parser.add_argument(
        "--collection",
        "-c",
        type=str,
        default=None,
        help="Collection name (default: courses_{semester})",
    )

    parser.add_argument(
        "--batch-size",
        "-b",
        type=int,
        default=100,
        help="Batch size for embedding API calls (default: 100)",
    )

    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=None,
        help="Limit number of courses to index (for testing)",
    )

    parser.add_argument(
        "--recreate",
        action="store_true",
        help="Delete existing collection and recreate",
    )

    parser.add_argument(
        "--verify",
        action="store_true",
        help="Verify index after completion",
    )

    args = parser.parse_args()

    if not args.input.exists():
        console.print(f"[red]Error: Input file not found: {args.input}[/red]")
        console.print("Run transform_courses.py first to transform data.")
        sys.exit(1)

    try:
        asyncio.run(run_index(args))
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Indexing cancelled.[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Error: {e}[/red]")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
