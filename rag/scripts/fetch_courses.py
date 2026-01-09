#!/usr/bin/env python3
"""CLI script to fetch course data from SFU APIs."""

import argparse
import asyncio
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from data.fetcher import CourseFetcher
from data.coursys import fetch_coursys_courses


async def test_coursys(semester: str, limit: int = 100):
    """Quick test of CourSys API to understand data."""
    from rich.console import Console
    from rich.table import Table

    console = Console()
    console.print(f"\n[bold]Testing CourSys API for semester {semester}[/bold]\n")

    # Fetch with limit - use correct array parameter format
    from data.coursys import COURSYS_URL
    import httpx

    # semester[]=1264 is the correct format
    url = (
        f"{COURSYS_URL}?tabledata=yes"
        f"&semester%5B%5D={semester}"
        f"&start=0"
        f"&length={limit}"
    )

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.get(url)
        data = response.json()

    console.print(f"recordsTotal: {data.get('recordsTotal')}")
    console.print(f"recordsFiltered: {data.get('recordsFiltered')}")
    console.print(f"Fetched: {len(data.get('data', []))} rows\n")

    # Count unique terms
    terms = set()
    depts = set()
    for row in data.get("data", []):
        if len(row) >= 6:
            import re
            term = re.sub(r"<[^>]+>", "", str(row[0])).strip()
            terms.add(term)
            # Parse dept from course code
            code = re.sub(r"<[^>]+>", "", str(row[1])).strip()
            parts = code.split()
            if parts:
                depts.add(parts[0])

    console.print(f"Unique terms: {terms}")
    console.print(f"Unique departments: {len(depts)}")
    console.print(f"Sample departments: {list(depts)[:10]}\n")


def main():
    parser = argparse.ArgumentParser(
        description="Fetch SFU course data for the PickMyElective RAG system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Semester codes:
  1261  Spring 2026
  1264  Summer 2026 (default)
  1267  Fall 2026

Examples:
  python fetch_courses.py                    # Fetch Summer 2026
  python fetch_courses.py --semester 1267    # Fetch Fall 2026
  python fetch_courses.py -o ./my_data       # Custom output directory
  python fetch_courses.py --test             # Test API without full fetch
        """,
    )

    parser.add_argument(
        "--semester",
        "-s",
        default="1264",
        help="Semester code (default: 1264 for Summer 2026)",
    )

    parser.add_argument(
        "--output-dir",
        "-o",
        type=Path,
        default=None,
        help="Output directory (default: rag/data/raw/)",
    )

    parser.add_argument(
        "--test",
        "-t",
        action="store_true",
        help="Test mode: just check API response structure",
    )

    parser.add_argument(
        "--limit",
        "-l",
        type=int,
        default=None,
        help="Limit number of courses to fetch (for testing)",
    )

    args = parser.parse_args()

    if args.test:
        asyncio.run(test_coursys(args.semester))
        return

    # Run the fetcher
    fetcher = CourseFetcher(
        semester=args.semester,
        output_dir=args.output_dir,
        limit=args.limit,
    )

    try:
        asyncio.run(fetcher.fetch_all())
    except KeyboardInterrupt:
        print("\n\nFetch cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
