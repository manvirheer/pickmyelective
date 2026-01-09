#!/usr/bin/env python3
"""CLI script to preprocess and filter course data."""

import argparse
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from processing.preprocessor import CoursePreprocessor


def main():
    parser = argparse.ArgumentParser(
        description="Preprocess and filter course data for RAG",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
This script:
  1. Deduplicates sections into unique courses
  2. Cleans text (HTML, whitespace)
  3. Parses WQB designations
  4. Analyzes prerequisites
  5. Filters out non-elective courses
  6. Calculates elective-friendliness scores

Examples:
  python preprocess_courses.py                          # Process default file
  python preprocess_courses.py -i data/raw/courses.json # Custom input
  python preprocess_courses.py -o data/processed/       # Custom output dir
        """,
    )

    parser.add_argument(
        "--input",
        "-i",
        type=Path,
        default=Path(__file__).parent.parent / "data" / "raw" / "courses_1264.json",
        help="Input JSON file from fetch stage",
    )

    parser.add_argument(
        "--output-dir",
        "-o",
        type=Path,
        default=None,
        help="Output directory (default: data/processed/)",
    )

    args = parser.parse_args()

    if not args.input.exists():
        print(f"Error: Input file not found: {args.input}")
        print("Run fetch_courses.py first to fetch data.")
        sys.exit(1)

    preprocessor = CoursePreprocessor(
        input_path=args.input,
        output_dir=args.output_dir,
    )

    try:
        preprocessor.process()
    except KeyboardInterrupt:
        print("\n\nProcessing cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
