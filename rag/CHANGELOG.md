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

## Upcoming

### Stage 2: Preprocess & Filter
- [ ] HTML cleaning and text normalization
- [ ] WQB designation parsing into structured codes
- [ ] Prerequisite analysis (has_prerequisites boolean)
- [ ] Course level extraction
- [ ] Apply exclusion filters (graduate, co-op, thesis, etc.)
- [ ] Calculate elective-friendliness scores

### Stage 3: Embedding & Indexing
- [ ] Document transformation for RAG
- [ ] OpenAI embedding generation
- [ ] ChromaDB setup and indexing

### Stage 4: Query Engine
- [ ] FastAPI endpoints
- [ ] Query interpretation with LLM
- [ ] Vector search with metadata filtering
- [ ] Match reason generation
