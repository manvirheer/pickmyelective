# Milestone: RAG Service Complete

**Date:** January 9, 2026
**Status:** ✅ Complete

## Overview

The PickMyElective RAG (Retrieval-Augmented Generation) service is now fully operational. The system can recommend SFU courses based on natural language queries, with semantic search and LLM-powered explanations.

---

## Pipeline Summary

| Stage | Description | Status |
|-------|-------------|--------|
| 1. Fetch | Pull course data from SFU APIs | ✅ Complete |
| 2. Preprocess | Clean, dedupe, filter courses | ✅ Complete |
| 3. Transform | Generate keywords, format for embedding | ✅ Complete |
| 4. Index | Store in ChromaDB with embeddings | ✅ Complete |
| 5. Query | FastAPI service with LLM reasoning | ✅ Complete |

### Data Statistics

- **Raw sections fetched:** 2,101
- **Unique courses:** 1,139
- **Elective candidates (after filtering):** 391
- **Indexed in ChromaDB:** 391 courses
- **Embedding dimensions:** 3,072 (text-embedding-3-large)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Vector Database | ChromaDB 1.4.0 |
| Embeddings | OpenAI text-embedding-3-large |
| LLM | GPT-4o-mini |
| API Framework | FastAPI |
| Server | Uvicorn |

---

## API Endpoints

### Health Check
```
GET /health
```

**Response:**
```json
{"status": "healthy", "service": "pickmyelective-rag"}
```

### Course Recommendations
```
POST /api/recommend
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "string (3-500 chars)",
  "filters": {
    "campus": ["Burnaby", "Surrey", "Vancouver"],
    "wqb": ["W", "Q", "B-Sci", "B-Soc", "B-Hum"],
    "max_level": 100 | 200 | 300,
    "no_prerequisites": true | false
  },
  "top_k": 1-10
}
```

---

## Example Queries & Results

### Query 1: Easy Breadth Course

**Request:**
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "easy breadth course", "top_k": 3}'
```

**Response:**
```json
{
  "success": true,
  "query_interpretation": "Looking for easy courses that fulfill breadth requirements in a degree program.",
  "courses": [
    {
      "course_code": "EDUC 100W",
      "title": "Selected Questions and Issues",
      "wqb": ["W", "B-Hum"],
      "units": 3,
      "has_prerequisites": false,
      "relevance_score": 0.454,
      "match_reason": "EDUC 100W is an excellent match for someone seeking an 'easy breadth course' because it offers a foundational exploration of key educational concepts in an accessible manner..."
    },
    {
      "course_code": "EDUC 230",
      "title": "Intro. Philosophy of Education",
      "wqb": ["B-Hum"],
      "relevance_score": 0.453
    },
    {
      "course_code": "FASS 224",
      "title": "Arts & Soc Sci Everyday Life",
      "wqb": [],
      "units": 1,
      "relevance_score": 0.451
    }
  ]
}
```

---

### Query 2: Psychology with B-Soc Filter

**Request:**
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "psychology and human behavior",
    "filters": {"wqb": ["B-Soc"]},
    "top_k": 3
  }'
```

**Response:**
```json
{
  "success": true,
  "query_interpretation": "Looking for courses that explore the principles of psychology and the factors influencing human behavior.",
  "courses": [
    {
      "course_code": "PSYC 102",
      "title": "Intro.Psychology II",
      "description": "Topics in learning, cognition, social psychology and abnormal psychology...",
      "wqb": ["B-Soc"],
      "relevance_score": 0.449,
      "match_reason": "PSYC 102 is a great match for your interest in psychology and human behavior, as it covers key topics such as social psychology and abnormal psychology..."
    },
    {
      "course_code": "PSYC 100",
      "title": "Intro.Psychology I",
      "wqb": ["B-Soc"],
      "has_prerequisites": false,
      "relevance_score": 0.433
    },
    {
      "course_code": "EDUC 220",
      "title": "Education Psychology",
      "wqb": ["B-Soc"],
      "relevance_score": 0.391
    }
  ]
}
```

---

### Query 3: Science Course with No Prerequisites

**Request:**
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "science course about nature",
    "filters": {"wqb": ["B-Sci"], "no_prerequisites": true},
    "top_k": 3
  }'
```

**Response:**
```json
{
  "success": true,
  "query_interpretation": "Looking for a science course focused on the study of nature and its components.",
  "courses": [
    {
      "course_code": "EVSC 100",
      "title": "Environmental Science",
      "description": "Introduces students to the study of environmental science...",
      "wqb": ["B-Sci"],
      "has_prerequisites": false,
      "relevance_score": 0.447,
      "match_reason": "EVSC 100 is a strong match for your interest in a science course about nature, as it provides a comprehensive introduction to environmental science..."
    },
    {
      "course_code": "HSCI 100",
      "title": "Human Biology",
      "wqb": ["B-Sci"],
      "relevance_score": 0.424
    },
    {
      "course_code": "BISC 113",
      "title": "Biology in Everyday Life",
      "wqb": ["B-Sci"],
      "relevance_score": 0.42
    }
  ]
}
```

---

### Query 4: Writing Course (W-Designated)

**Request:**
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "writing course",
    "filters": {"wqb": ["W"], "max_level": 200},
    "top_k": 3
  }'
```

**Response:**
```json
{
  "success": true,
  "query_interpretation": "Looking for courses that focus on different styles and techniques of writing.",
  "courses": [
    {
      "course_code": "MSE 101W",
      "title": "Process of Prof. Writing",
      "campus": ["Surrey"],
      "wqb": ["W"],
      "has_prerequisites": false,
      "relevance_score": 0.426,
      "match_reason": "MSE 101W is an excellent match for your interest in writing courses, as it emphasizes the development of clear and concise communication skills..."
    },
    {
      "course_code": "ENGL 199W",
      "title": "Writing to Persuade",
      "wqb": ["W"],
      "relevance_score": 0.378
    },
    {
      "course_code": "ENGL 114W",
      "title": "Language and Purpose",
      "wqb": ["W", "B-Hum"],
      "relevance_score": 0.373
    }
  ]
}
```

---

## Running the Service

### Start the Server
```bash
cd rag
source .venv/bin/activate
python scripts/run_server.py
```

Server runs on `http://localhost:8000`

### Environment Variables
```bash
OPENAI_API_KEY=sk-...        # Required
CHROMA_PATH=data/chroma/     # Optional (default)
COLLECTION_NAME=courses_1264 # Optional (default)
```

---

## Cost Estimates

| Operation | Cost |
|-----------|------|
| Index 391 courses | ~$0.04 (one-time) |
| Per query | ~$0.002 |
| 5 queries/user × 1000 users | ~$10 |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    POST /api/recommend                        │
│                    { query, filters, top_k }                  │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 1: Query Interpretation (GPT-4o-mini)                  │
│  "easy breadth course" → ["breadth requirements", "easy"]    │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 2: Embed Query (text-embedding-3-large)                │
│  topics → [0.023, -0.089, 0.156, ...] (3072 dims)           │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 3: Vector Search (ChromaDB)                            │
│  Cosine similarity + metadata filters → top candidates       │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Step 4: Generate Match Reasons (GPT-4o-mini)                │
│  For each course: explain why it matches the query           │
└─────────────────────────┬────────────────────────────────────┘
                          ▼
┌──────────────────────────────────────────────────────────────┐
│  Response: { query_interpretation, courses[] }               │
└──────────────────────────────────────────────────────────────┘
```

---

## Files Created

```
rag/
├── src/
│   ├── index/                 # Stage 4: Indexing
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── indexer.py
│   ├── query/                 # Stage 5: Query Engine
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── engine.py
│   └── api/                   # Stage 5: FastAPI
│       ├── __init__.py
│       ├── main.py
│       ├── routes.py
│       └── dependencies.py
├── scripts/
│   ├── index_courses.py       # CLI: Index courses
│   └── run_server.py          # CLI: Start API server
└── data/
    ├── transformed/           # Stage 3 output
    └── chroma/                # ChromaDB storage
```

---

## Next Steps

1. **Frontend Integration** - Connect React UI to `/api/recommend`
2. **Backend Proxy** - Route requests through auth/rate-limiting layer
3. **Production Deployment** - Docker, environment configs
4. **Monitoring** - Add logging, metrics, error tracking
