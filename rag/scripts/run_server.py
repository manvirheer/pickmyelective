#!/usr/bin/env python3
"""Start the RAG API server."""

import argparse
import os
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import uvicorn
from dotenv import load_dotenv


def main():
    parser = argparse.ArgumentParser(
        description="Start the PickMyElective RAG API server",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Environment variables:
  OPENAI_API_KEY      Required. OpenAI API key for LLM and embeddings.
  CHROMA_PATH         ChromaDB storage path (default: data/chroma/)
  COLLECTION_NAME     Collection name (default: courses_1264)

Examples:
  python run_server.py                    # Start on port 8000
  python run_server.py --port 3001        # Start on port 3001
  python run_server.py --reload           # Start with auto-reload
        """,
    )

    parser.add_argument(
        "--host",
        type=str,
        default="0.0.0.0",
        help="Host to bind to (default: 0.0.0.0)",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Port to bind to (default: 8000)",
    )

    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable auto-reload for development",
    )

    args = parser.parse_args()

    # Load environment variables
    load_dotenv()

    # Check for required environment variables
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY environment variable is required")
        print("Set it in .env file or export it in your shell")
        sys.exit(1)

    print(f"Starting PickMyElective RAG server on {args.host}:{args.port}")
    print("Press Ctrl+C to stop")

    uvicorn.run(
        "src.api.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
    )


if __name__ == "__main__":
    main()
