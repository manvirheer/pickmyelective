#!/usr/bin/env python3
"""CLI script to transform courses into embedding-ready documents."""

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

from src.transform.transformer import CourseTransformer, load_processed_courses

console = Console()


def print_stats(output) -> None:
    """Print transformation statistics."""
    stats = output.stats

    console.print("\n[bold green]Transformation Complete![/bold green]\n")

    # Summary table
    table = Table(title="Transformation Summary")
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="white")

    table.add_row("Semester", f"{output.semester_name} ({output.semester})")
    table.add_row("Total Courses", str(output.total_courses))
    table.add_row("Successfully Transformed", str(stats.successful))
    table.add_row("Failed Keywords", str(stats.failed_keywords))
    table.add_row("Avg Document Length", f"{stats.avg_document_length:.0f} chars")
    table.add_row("Avg Keywords/Course", f"{stats.avg_keywords_per_course:.1f}")
    table.add_row("LLM Calls", str(stats.llm_calls))
    table.add_row("Total Tokens Used", f"{stats.total_tokens_used:,}")

    console.print(table)


def print_sample(courses: list, n: int = 2) -> None:
    """Print sample transformed courses."""
    console.print(f"\n[bold]Sample Transformed Courses ({n}):[/bold]\n")

    for course in courses[:n]:
        console.print(f"[cyan]ID:[/cyan] {course.id}")
        console.print(f"[cyan]Keywords:[/cyan] {', '.join(course.keywords)}")
        console.print(f"[cyan]Document:[/cyan]")
        console.print(course.document)
        console.print("-" * 60)


async def run_transform(args) -> None:
    """Run the transformation pipeline."""
    # Load environment variables
    load_dotenv()

    # Check for API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key and not args.skip_keywords:
        console.print("[red]Error: OPENAI_API_KEY not set in environment[/red]")
        console.print("Set it in .env file or environment variable, or use --skip-keywords")
        sys.exit(1)

    # Load processed courses
    console.print(f"[cyan]Loading courses from:[/cyan] {args.input}")
    courses, semester = load_processed_courses(args.input)
    console.print(f"[green]Loaded {len(courses)} courses for semester {semester}[/green]")

    # Apply limit if specified
    if args.limit:
        courses = courses[:args.limit]
        console.print(f"[yellow]Limited to {args.limit} courses[/yellow]")

    # Initialize transformer
    transformer = CourseTransformer(
        openai_api_key=api_key,
        skip_llm=args.skip_keywords,
    )

    # Determine output path
    if args.output:
        output_path = args.output
    else:
        output_dir = args.input.parent.parent / "transformed"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"documents_{semester}.json"

    # Run transformation
    generate_keywords = not args.skip_keywords
    if args.skip_keywords:
        console.print("[yellow]Skipping keyword generation (--skip-keywords)[/yellow]")

    transformed = await transformer.transform_all(
        courses=courses,
        semester=semester,
        generate_keywords=generate_keywords,
        checkpoint_path=output_path if not args.skip_keywords else None,
        checkpoint_interval=args.checkpoint_interval,
    )

    # Create output
    output = transformer.create_output(transformed, semester)

    # Save output
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(output.model_dump_json(indent=2))
    console.print(f"\n[green]Saved to:[/green] {output_path}")

    # Print stats
    print_stats(output)

    # Print sample
    if args.show_sample:
        print_sample(transformed, n=args.show_sample)


def main():
    parser = argparse.ArgumentParser(
        description="Transform processed courses into embedding-ready documents",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script:
  1. Loads processed courses from Stage 2
  2. Generates semantic keywords using LLM
  3. Formats documents for embedding
  4. Extracts filterable metadata
  5. Saves transformed documents to JSON

Examples:
  python transform_courses.py                              # Transform all
  python transform_courses.py --limit 10                   # Test with 10 courses
  python transform_courses.py --skip-keywords              # Skip LLM calls
  python transform_courses.py --show-sample 3              # Show 3 sample outputs
        """,
    )

    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=Path(__file__).parent.parent / "data" / "processed" / "electives_1264.json",
        help="Input JSON file from preprocess stage",
    )

    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Output JSON file (default: data/transformed/documents_{semester}.json)",
    )

    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=None,
        help="Limit number of courses to transform (for testing)",
    )

    parser.add_argument(
        "--skip-keywords",
        action="store_true",
        help="Skip LLM keyword generation (for testing without API key)",
    )

    parser.add_argument(
        "--checkpoint-interval",
        type=int,
        default=50,
        help="Save checkpoint every N courses (default: 50)",
    )

    parser.add_argument(
        "--show-sample",
        type=int,
        default=0,
        help="Show N sample transformed courses after completion",
    )

    args = parser.parse_args()

    if not args.input.exists():
        console.print(f"[red]Error: Input file not found: {args.input}[/red]")
        console.print("Run preprocess_courses.py first to process data.")
        sys.exit(1)

    try:
        asyncio.run(run_transform(args))
    except KeyboardInterrupt:
        console.print("\n\n[yellow]Transformation cancelled.[/yellow]")
        sys.exit(1)
    except Exception as e:
        console.print(f"\n[red]Error: {e}[/red]")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
