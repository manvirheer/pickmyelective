# RAG Service Changelog

## [0.1.0] - 2026-01-08

### Added

**Data Pipeline - Stage 1: Fetch**

- Created `rag/` directory structure with Python project setup
- Implemented CourSys API client (`src/data/coursys.py`)
  - Fetches course listings from `https://coursys.sfu.ca/browse/`
  - Supports DataTables pagination
  - Parses course code, section, title, enrollment, instructor, campus
- Implemented SFU Outlines API client (`src/data/sfu_outlines.py`)
  - Fetches detailed course info from `http://www.sfu.ca/bin/wcm/course-outlines`
  - Extracts description, prerequisites, WQB designation, delivery method, schedule
  - Handles 404s gracefully for courses without outlines
- Created main fetcher orchestration (`src/data/fetcher.py`)
  - Merges CourSys and SFU Outlines data
  - Concurrent requests with rate limiting (10 parallel, 0.5s batch delay)
  - Progress bar display using Rich
- Created CLI script (`scripts/fetch_courses.py`)
  - `--semester` flag for semester selection (default: 1264 Summer 2026)
  - `--limit` flag for testing with subset
  - `--test` flag for API diagnostics
- Created analysis script (`scripts/analyze_courses.py`)
  - Department distribution
  - Course level breakdown (100-900)
  - WQB designation analysis
  - Prerequisites analysis
  - Exclusion pattern matching preview
  - Elective candidate estimation

### Fixed

**CourSys API Semester Filter**

- **Issue**: Initial implementation returned 137,306 courses instead of expected ~2,100
- **Root Cause**: Semester parameter format was incorrect
  - Wrong: `semester=1264`
  - Correct: `semester[]=1264` (URL encoded as `semester%5B%5D=1264`)
- **Solution**: Updated URL construction to use array parameter format
- **Result**: Now correctly fetches 2,101 courses for Summer 2026

### Data Statistics (Summer 2026)

```
Total Courses:        2,101
Enriched w/ Outline:  2,075 (98.8%)
Unique Departments:   70

By Level:
  Undergraduate:      1,360 (64.7%)
  Graduate:             739 (35.2%)

By Campus:
  Burnaby:            1,139 (54.2%)
  Off-campus:           573 (27.3%)
  Surrey:               158 (7.5%)
  Harbour Centre:       115 (5.5%)

WQB Designations:       260 (12.4%)
No Prerequisites:       733 (34.9%)
With Description:     1,973 (93.9%)

Estimated Electives:    962 (after filtering)
  - With WQB:           255 (26.5%)
  - No Prerequisites:   153 (15.9%)
```

### Exclusion Patterns Identified

| Pattern | Matches | Action |
|---------|---------|--------|
| Practicum | 254 | Exclude |
| Directed Studies | 215 | Exclude |
| Thesis | 198 | Exclude |
| Co-op | 118 | Exclude |
| Project Course | 52 | Exclude |
| Special Topics | 29 | Exclude |
| Capstone | 9 | Exclude |
| Honours Project | 3 | Exclude |

### Dependencies

```
httpx>=0.27.0      # Async HTTP client
pydantic>=2.0.0    # Data validation
rich>=13.0.0       # CLI output/progress
```

### Files Created

```
rag/
├── src/
│   ├── __init__.py
│   └── data/
│       ├── __init__.py
│       ├── models.py          # Pydantic models
│       ├── coursys.py         # CourSys API client
│       ├── sfu_outlines.py    # SFU Outlines API client
│       └── fetcher.py         # Main orchestration
├── scripts/
│   ├── fetch_courses.py       # CLI for fetching
│   └── analyze_courses.py     # Data analysis
├── data/raw/                   # Output (gitignored)
├── pyproject.toml
├── requirements.txt
└── CHANGELOG.md
```

---

## [0.2.0] - 2026-01-08

### Added

**Data Pipeline - Stage 2: Preprocess & Filter**

- Created processing module (`src/processing/`)
  - `models.py` - ProcessedCourse, WQBCode enum, PrerequisiteLevel enum, ExclusionReason enum
  - `preprocessor.py` - Main preprocessing pipeline
- Implemented section deduplication
  - Merges multiple sections (D100, D200, etc.) into single course
  - Keeps best description (longest)
  - Aggregates: campuses, delivery methods, instructors, total capacity
  - 2,101 sections → 1,139 unique courses
- Implemented text cleaning
  - HTML tag removal
  - HTML entity decoding
  - Whitespace normalization
- Implemented WQB parsing
  - Parses designation strings into structured codes: Q, W, B-Sci, B-Soc, B-Hum
- Implemented prerequisite analysis
  - Classifies into: NONE, RECOMMENDED, REQUIRED
  - Detects course code references (e.g., "CMPT 120")
  - Detects unit requirements (e.g., "60 units")
- Implemented exclusion filters
  - Graduate courses (600+ level)
  - No description
  - Co-op, Practicum, Thesis, Directed Studies, Capstone, Special Topics, Honours, Project courses
- Implemented elective scoring algorithm
  - No prerequisites: +10
  - WQB designation: +5 each
  - 100-level: +5, 200-level: +3, 300-level: +1
  - Large capacity (200+): +3, (100+): +2, (50+): +1
  - Has instructor: +1
  - Multiple delivery/campuses: +1 each
- Added department list for frontend filtering UI
  - 57 departments with elective courses
  - Enables "exclude my department" feature
- Created CLI script (`scripts/preprocess_courses.py`)

### Processing Statistics (Summer 2026)

```
Input:
  Total sections:       2,101

Deduplication:
  Unique courses:       1,139
  Multi-section:          451

Exclusions:
  Graduate (600+):        392
  Practicum:               60
  Directed Studies:        30
  No description:          19
  Co-op:                   15
  Thesis:                  15
  Other:                   20
  Total excluded:         551

Output:
  Elective candidates:    588
  With WQB:               194 (33.0%)
  No prerequisites:       107 (18.2%)
  Departments:             57
```

### Top Electives by Score

| Course | Score | WQB | Prereq | Capacity |
|--------|-------|-----|--------|----------|
| CMPT 120 | 30 | Q, B-Sci | No | 400 |
| EDUC 100W | 30 | W, B-Hum | No | 300 |
| ENGL 112W | 28 | W, B-Hum | No | 136 |
| PHIL 100W | 28 | W, B-Hum | No | 140 |
| STAT 100 | 28 | Q, B-Sci | No | 105 |

### Files Created

```
rag/
├── src/
│   └── processing/
│       ├── __init__.py
│       ├── models.py           # ProcessedCourse, enums
│       └── preprocessor.py     # Main pipeline
├── scripts/
│   └── preprocess_courses.py   # CLI
└── data/processed/             # Output (gitignored)
    └── electives_1264.json     # 588 electives
```

---

## [0.3.0] - 2026-01-09

### Added

**Data Pipeline - Stage 3: Transform**

- Created transform module (`src/transform/`)
  - `models.py` - TransformedCourse, CourseMetadata schemas
  - `transformer.py` - Document formatting, LLM keyword generation
- Implemented document preparation for embedding
  - Structured format: code, title, metadata, description, keywords
  - Optimized for semantic search
- Implemented LLM keyword generation
  - Uses GPT-4o-mini to generate 5-8 semantic keywords per course
  - Rate limiting and retry logic for API calls
  - Checkpoint system for resumability
- Created CLI script (`scripts/transform_courses.py`)

**Data Pipeline - Stage 4: Index**

- Created index module (`src/index/`)
  - `models.py` - IndexingConfig, IndexOutput schemas
  - `indexer.py` - Embedding generation, ChromaDB indexing
- Implemented OpenAI embedding generation
  - Model: text-embedding-3-large (3,072 dimensions)
  - Batch processing with rate limiting
- Implemented ChromaDB vector storage
  - Persistent storage in `data/chroma/`
  - Cosine similarity distance metric
  - Metadata stored as flat strings for filtering
- Created CLI script (`scripts/index_courses.py`)

**Data Pipeline - Stage 5: Query API**

- Created query module (`src/query/`)
  - `models.py` - RecommendRequest, RecommendResponse, CourseResult
  - `engine.py` - RAG query pipeline
- Implemented query interpretation
  - LLM extracts topics and intent from natural language
- Implemented semantic search
  - Vector similarity search with ChromaDB
  - Post-filtering for campus and WQB
- Implemented match reason generation
  - LLM explains why each course matches the query
- Created FastAPI application (`src/api/`)
  - `main.py` - App setup with lifespan management
  - `routes.py` - `/health` and `/api/recommend` endpoints
  - `dependencies.py` - Query engine dependency injection
- Created server script (`scripts/run_server.py`)

### Transform & Index Statistics (Summer 2026)

```
Transformed:         391 courses
Avg document length: 695 chars
Avg keywords/course: 8
LLM calls:          391
Total tokens:       81,151

Indexed:            391 courses
Embedding model:    text-embedding-3-large
Dimensions:         3,072
Distance metric:    cosine
```

### Files Created

```
rag/
├── src/
│   ├── transform/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── transformer.py
│   ├── index/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── indexer.py
│   ├── query/
│   │   ├── __init__.py
│   │   ├── models.py
│   │   └── engine.py
│   └── api/
│       ├── __init__.py
│       ├── main.py
│       ├── routes.py
│       └── dependencies.py
├── scripts/
│   ├── transform_courses.py
│   ├── index_courses.py
│   └── run_server.py
└── data/
    ├── transformed/
    └── chroma/
```

---

## [0.3.1] - 2026-01-09

### Improved

**Query Quality Enhancements**

- Enhanced query interpretation prompt
  - Added recognition for common patterns: "easy", "breadth", "no prereqs"
  - More examples for better topic extraction
- Improved fetch multiplier for filtered queries
  - Heavy filtering (list + scalar): 5x candidates
  - Moderate filtering: 3x candidates
  - Ensures sufficient results after post-filtering
- Added minimum relevance threshold
  - New `min_relevance` parameter (default: 0.35)
  - Filters out low-relevance matches before generating match reasons
  - Reduces noise in results
