# PickMyElective RAG Service

Course recommendation engine using Retrieval-Augmented Generation. Finds SFU electives based on natural language queries with semantic search and LLM-powered explanations.

## Quick Start

```bash
# Setup
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Add your OPENAI_API_KEY to .env

# Run pipeline (first time only)
python scripts/fetch_courses.py      # Stage 1: Fetch from SFU APIs
python scripts/preprocess_courses.py # Stage 2: Clean and filter
python scripts/transform_courses.py  # Stage 3: Generate keywords
python scripts/index_courses.py      # Stage 4: Index in ChromaDB

# Start server
python scripts/run_server.py
# API available at http://localhost:8000
```

## API Reference

### Health Check
```
GET /health
```
```json
{"status": "healthy", "service": "pickmyelective-rag"}
```

### Get Recommendations
```
POST /api/recommend
Content-Type: application/json
```

**Request:**
```json
{
  "query": "easy breadth course with no prerequisites",
  "filters": {
    "campus": ["Burnaby", "Surrey"],
    "wqb": ["W", "Q", "B-Sci", "B-Soc", "B-Hum"],
    "max_level": 200,
    "no_prerequisites": true
  },
  "top_k": 5,
  "min_relevance": 0.30
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `query` | string | required | Natural language search (3-500 chars) |
| `filters.campus` | string[] | null | Filter by campus |
| `filters.wqb` | string[] | null | Filter by WQB designation |
| `filters.max_level` | int | null | Max course level (100, 200, 300) |
| `filters.no_prerequisites` | bool | null | Only courses with no prereqs |
| `top_k` | int | 5 | Number of results (1-10) |
| `min_relevance` | float | 0.30 | Minimum similarity score (0-1) |

**Response:**
```json
{
  "success": true,
  "query_interpretation": "Looking for an easy course that fulfills breadth requirements",
  "courses": [
    {
      "course_code": "EDUC 100W",
      "title": "Selected Questions and Issues",
      "description": "An introduction to basic questions and issues in education...",
      "campus": ["Burnaby"],
      "wqb": ["W", "B-Hum"],
      "units": 3,
      "prerequisites": "",
      "has_prerequisites": false,
      "instructor": "John Smith",
      "delivery_methods": ["In Person"],
      "relevance_score": 0.454,
      "match_reason": "This course is a great match because..."
    }
  ]
}
```

## Architecture

```
User Query
    |
    v
[1. Query Interpretation] -- GPT-4o-mini extracts topics
    |
    v
[2. Embedding Generation] -- text-embedding-3-large (3072 dims)
    |
    v
[3. Vector Search] -- ChromaDB cosine similarity + metadata filters
    |
    v
[4. Match Reasoning] -- GPT-4o-mini explains relevance
    |
    v
Ranked Courses with Explanations
```

## Data Pipeline

| Stage | Script | Input | Output |
|-------|--------|-------|--------|
| 1. Fetch | `fetch_courses.py` | SFU APIs | `data/raw/courses_1264.json` |
| 2. Preprocess | `preprocess_courses.py` | Raw courses | `data/processed/electives_1264.json` |
| 3. Transform | `transform_courses.py` | Electives | `data/transformed/documents_1264.json` |
| 4. Index | `index_courses.py` | Documents | `data/chroma/` |

**Pipeline Stats (Summer 2026):**
- Raw sections: 2,101
- Unique courses: 1,139
- Elective candidates: 391
- Indexed documents: 391

## Project Structure

```
rag/
├── src/
│   ├── data/           # Stage 1: API clients
│   │   ├── coursys.py
│   │   ├── sfu_outlines.py
│   │   └── fetcher.py
│   ├── processing/     # Stage 2: Preprocessing
│   │   └── preprocessor.py
│   ├── transform/      # Stage 3: Document prep
│   │   └── transformer.py
│   ├── index/          # Stage 4: Indexing
│   │   └── indexer.py
│   ├── query/          # Stage 5: RAG engine
│   │   └── engine.py
│   └── api/            # FastAPI app
│       ├── main.py
│       └── routes.py
├── scripts/            # CLI entry points
├── data/               # Pipeline outputs (gitignored)
└── requirements.txt
```

## Configuration

Environment variables (`.env`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key |
| `CHROMA_PATH` | No | `data/chroma/` | ChromaDB storage path |
| `COLLECTION_NAME` | No | `courses_1264` | ChromaDB collection name |

## Tech Stack

| Component | Technology |
|-----------|------------|
| Vector DB | ChromaDB |
| Embeddings | OpenAI text-embedding-3-large |
| LLM | GPT-4o-mini |
| API | FastAPI + Uvicorn |
| Python | 3.12+ |

## Cost Estimates

| Operation | Cost |
|-----------|------|
| Index 391 courses | ~$0.04 (one-time) |
| Per query | ~$0.002 |
| 1000 users @ 5 queries each | ~$10 |
