# PickMyElective - Data & RAG Pipeline

## Overview

This document describes the data collection, preprocessing, filtering, and RAG preparation pipeline for the elective recommendation system.

---

## Pipeline Overview

```
┌──────────┐    ┌─────────────┐    ┌──────────┐    ┌───────────┐    ┌─────────┐
│  FETCH   │───▶│ PREPROCESS  │───▶│  FILTER  │───▶│ TRANSFORM │───▶│  INDEX  │
│          │    │  & CLEAN    │    │          │    │  FOR RAG  │    │         │
└──────────┘    └─────────────┘    └──────────┘    └───────────┘    └─────────┘
     │               │                  │               │               │
     ▼               ▼                  ▼               ▼               ▼
  Raw JSON       Clean JSON         Electives      Embeddings      Vector DB
  (~2100)        (~2000)            (~600)         (~600)          Ready
```

---

## Stage 1: Data Fetching

### Data Sources to Merge

| Source | Provides | Use For |
|--------|----------|---------|
| **CourSys API** | Course list, sections, enrollment, campus | Primary course list |
| **SFU Outlines API** | Full descriptions, prereqs, instructor, schedule | Rich content for RAG |

### Why Both Sources?

- **CourSys**: Has complete list of offered courses + real-time enrollment
- **SFU Outlines**: Has detailed descriptions needed for semantic search

**Merge strategy:** Use CourSys as source of truth for "what's offered", enrich with SFU Outlines data.

### Fetch Logic

```python
def fetch_all_courses(semester_code: str = "1264"):
    """Fetch Summer 2026 courses from both APIs."""

    # 1. Get complete course list from CourSys
    coursys_data = fetch_coursys(
        semester=semester_code,
        tabledata=True,
        limit=3000
    )

    courses = []
    for row in coursys_data:
        course = parse_coursys_row(row)

        # 2. Enrich with SFU Outlines data
        outline = fetch_sfu_outline(
            year="2026",
            term="summer",
            dept=course.dept.lower(),
            num=course.number,
            section=course.section.lower()
        )

        if outline and 'info' in outline:
            course.description = outline['info'].get('description', '')
            course.prerequisites = outline['info'].get('prerequisites', '')
            course.corequisites = outline['info'].get('corequisites', '')
            course.designation = outline['info'].get('designation', '')
            course.delivery_method = outline['info'].get('deliveryMethod', '')
            course.instructor = outline.get('instructor', [])
            course.schedule = outline.get('courseSchedule', [])

        courses.append(course)

    return courses
```

### Expected Raw Output

```json
{
  "course_code": "CMPT 120",
  "section": "D100",
  "title": "Introduction to Computing Science and Programming I",
  "description": "An elementary introduction to computing science...",
  "prerequisites": "BC Math 12 or equivalent is recommended.",
  "corequisites": "",
  "campus": "Burnaby",
  "designation": "Quantitative/Breadth-Science",
  "units": 3,
  "instructor": "Diana Cukierman",
  "enrollment": "0/200",
  "delivery_method": "In Person",
  "schedule": [
    {"days": "Tu", "time": "12:30-14:20", "campus": "Burnaby"},
    {"days": "Fr", "time": "12:30-13:20", "campus": "Burnaby"}
  ]
}
```

---

## Stage 2: Preprocessing & Cleaning

### Cleaning Tasks

| Task | Input | Output | Example |
|------|-------|--------|---------|
| Strip HTML | `<p>text</p>` | `text` | Course details often have HTML |
| Normalize whitespace | `"foo  bar\n"` | `"foo bar"` | Clean up formatting |
| Decode entities | `&#x27;` | `'` | HTML entities in CourSys |
| Parse WQB | `"Quantitative/Breadth-Science"` | `["Q", "B-Sci"]` | Structured for filtering |
| Handle nulls | `null` / missing | `""` or default | Consistent data structure |

### WQB Designation Parsing

```python
WQB_MAP = {
    "Quantitative": "Q",
    "Writing": "W",
    "Breadth-Science": "B-Sci",
    "Breadth-Social Sciences": "B-Soc",
    "Breadth-Humanities": "B-Hum"
}

def parse_wqb(designation: str) -> list[str]:
    """Parse WQB designation string into list of codes."""
    if not designation:
        return []

    wqb_list = []
    for key, code in WQB_MAP.items():
        if key in designation:
            wqb_list.append(code)

    return wqb_list

# Example:
# parse_wqb("Quantitative/Breadth-Science") -> ["Q", "B-Sci"]
# parse_wqb("Writing/Breadth-Humanities") -> ["W", "B-Hum"]
```

### Prerequisite Analysis

Prerequisites are **unstructured text** - complex to parse fully.

**Strategy for MVP:**
1. Store raw text (let LLM interpret)
2. Extract boolean: `has_hard_prerequisites`
3. Future: NLP extraction of course codes

```python
def analyze_prerequisites(prereq_text: str) -> dict:
    """Analyze prerequisite text."""
    if not prereq_text or prereq_text.strip() == "":
        return {"has_prerequisites": False, "raw": "", "difficulty": "none"}

    text_lower = prereq_text.lower()

    # "Recommended" is soft, not enforced
    if "recommended" in text_lower and "required" not in text_lower:
        return {
            "has_prerequisites": False,
            "raw": prereq_text,
            "difficulty": "recommended"
        }

    # Check for hard prerequisites
    has_hard = any([
        "credit for" in text_lower,
        "completion of" in text_lower,
        "with a minimum grade" in text_lower,
        "prerequisite:" in text_lower
    ])

    return {
        "has_prerequisites": has_hard,
        "raw": prereq_text,
        "difficulty": "required" if has_hard else "soft"
    }
```

### Course Level Extraction

```python
def get_course_level(course_number: str) -> int:
    """Extract course level from number (100, 200, 300, etc.)."""
    # Remove letters (e.g., "105W" -> "105")
    num = ''.join(filter(str.isdigit, course_number))
    if num:
        return (int(num) // 100) * 100
    return 0

# Examples:
# get_course_level("120") -> 100
# get_course_level("105W") -> 100
# get_course_level("354") -> 300
# get_course_level("726") -> 700
```

---

## Stage 3: Filtering for Electives

### Hard Filters (Exclude Entirely)

| Filter | Logic | Rationale |
|--------|-------|-----------|
| Graduate courses | `level >= 600` OR `degreeLevel == "GRAD"` | Not undergraduate electives |
| Co-op/Practicum | Title matches pattern | Requires work term placement |
| Thesis/Project | Title matches pattern | Requires supervisor arrangement |
| Directed Studies | Title matches pattern | Requires special permission |
| No description | `description == ""` | Can't recommend without info |

### Exclusion Patterns

```python
import re

EXCLUDE_PATTERNS = [
    re.compile(r"co-?op", re.IGNORECASE),
    re.compile(r"practicum", re.IGNORECASE),
    re.compile(r"\bthesis\b", re.IGNORECASE),
    re.compile(r"directed (study|studies|reading)", re.IGNORECASE),
    re.compile(r"honours (essay|project|thesis)", re.IGNORECASE),
    re.compile(r"capstone", re.IGNORECASE),
    re.compile(r"(graduate |grad )?project\s*(i|ii|iii|iv|v|1|2|3|4|5)?$", re.IGNORECASE),
    re.compile(r"special topics", re.IGNORECASE),  # Usually need instructor permission
    re.compile(r"oral (exam|candidacy)", re.IGNORECASE),
]

def should_exclude(course: dict) -> bool:
    """Check if course should be excluded from electives."""

    # Graduate level
    if course.get('level', 0) >= 600:
        return True
    if course.get('degree_level') == 'GRAD':
        return True

    # No description
    if not course.get('description', '').strip():
        return True

    # Title patterns
    title = course.get('title', '')
    for pattern in EXCLUDE_PATTERNS:
        if pattern.search(title):
            return True

    return False
```

### Soft Scoring (for Ranking)

Courses that pass hard filters get scored for "elective-friendliness":

```python
def calculate_elective_score(course: dict) -> int:
    """Score course on how good it is as an elective."""
    score = 0

    # No prerequisites = accessible to anyone
    if not course.get('has_prerequisites', True):
        score += 10

    # WQB designation = fulfills graduation requirements
    wqb = course.get('wqb', [])
    score += 5 * len(wqb)

    # Lower level = more introductory/accessible
    level = course.get('level', 0)
    if level == 100:
        score += 5
    elif level == 200:
        score += 3
    elif level == 300:
        score += 1

    # Large capacity = easier to get a seat
    capacity = course.get('capacity', 0)
    if capacity >= 200:
        score += 3
    elif capacity >= 100:
        score += 2
    elif capacity >= 50:
        score += 1

    # Has instructor listed = more likely to run
    if course.get('instructor'):
        score += 1

    return score
```

---

## Stage 4: RAG Transformation

### Document Structure for Embedding

Each course becomes a single text document:

```
[COURSE_CODE] - [TITLE]
Department: [DEPT_NAME] | Campus: [CAMPUS] | Credits: [UNITS]
WQB: [WQB_LIST or "None"]
Prerequisites: [PREREQS or "None"]
Delivery: [DELIVERY_METHOD]

[DESCRIPTION]

Good for students interested in: [KEYWORDS]
```

### Example Document

```
PSYC 100 - Introduction to Psychology I
Department: Psychology | Campus: Burnaby | Credits: 3
WQB: B-Soc (Breadth Social Sciences)
Prerequisites: None
Delivery: In Person

Acquaints the student with the major issues in contemporary
psychology and considers the historical antecedents. Special
attention is given to questions of methodology and research
design in psychology.

Good for students interested in: social sciences, human behavior,
research methods, understanding the mind, introductory courses,
no prerequisites needed
```

### Keyword Generation

Add semantic keywords to improve retrieval:

```python
def generate_keywords(course: dict) -> list[str]:
    """Generate searchable keywords for course."""
    keywords = []

    # Department full name
    keywords.append(course.get('dept_name', ''))

    # Level description
    level = course.get('level', 0)
    if level == 100:
        keywords.extend(['introductory', 'beginner', 'first-year', '100-level'])
    elif level == 200:
        keywords.extend(['intermediate', 'second-year', '200-level'])

    # WQB descriptions
    wqb_full = {
        'Q': 'quantitative reasoning math',
        'W': 'writing intensive communication',
        'B-Sci': 'breadth science natural sciences',
        'B-Soc': 'breadth social sciences society',
        'B-Hum': 'breadth humanities arts culture'
    }
    for code in course.get('wqb', []):
        keywords.append(wqb_full.get(code, ''))

    # Prereq status
    if not course.get('has_prerequisites'):
        keywords.extend(['no prerequisites', 'open to all', 'accessible'])

    return keywords
```

### Chunking Strategy

**No chunking needed** for this use case:
- Average course description: 100-300 words
- With metadata: ~400-500 tokens total
- Well within embedding model context limits
- Each course = one atomic document

### Embedding Model Selection

| Model | Dimensions | Cost | Quality | Recommendation |
|-------|-----------|------|---------|----------------|
| `text-embedding-3-small` (OpenAI) | 1536 | $0.02/1M tokens | Good | **Recommended** |
| `text-embedding-3-large` (OpenAI) | 3072 | $0.13/1M tokens | Better | Overkill for MVP |
| `all-MiniLM-L6-v2` (local) | 384 | Free | Acceptable | Fallback option |

**Cost estimate:** ~600 courses × 500 tokens = 300K tokens = **$0.006**

---

## Stage 5: Vector Database Schema

### Document Schema

```python
{
    # Unique identifier
    "id": "cmpt-120-d100-2026su",

    # Embedding vector (1536 dimensions for text-embedding-3-small)
    "embedding": [0.0234, -0.0891, 0.0156, ...],

    # Filterable metadata
    "metadata": {
        "course_code": "CMPT 120",
        "section": "D100",
        "department": "CMPT",
        "department_name": "Computing Science",
        "title": "Introduction to Computing Science and Programming I",
        "campus": "Burnaby",
        "wqb": ["Q", "B-Sci"],
        "level": 100,
        "units": 3,
        "has_prerequisites": false,
        "delivery_method": "In Person",
        "elective_score": 23,
        "instructor": "Diana Cukierman",
        "capacity": 200
    },

    # Full text (for display after retrieval)
    "document": "CMPT 120 - Introduction to Computing Science..."
}
```

### Query Strategy: Semantic-First with LLM Enhancement

Users describe interests in natural language. The RAG system interprets intent and explains recommendations.

**Design Philosophy:**
- **Semantic-first**: No rigid department filters, let embeddings find relevant courses
- **Explainable**: Every recommendation has a human-readable reason
- **Transparent**: User sees what the system understood

---

## RAG Query Flow (Runtime)

```
┌─────────────────────────────────────────────────────────────────┐
│  INPUT: query + filters                                         │
│  "interested in how people think" + {campus: Burnaby, wqb: ...} │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Query Interpretation (LLM Call #1)                     │
│  ─────────────────────────────────────────                      │
│  Input:  Raw user query                                         │
│  Prompt: "Extract the topics and interests from this query..."  │
│  Output: {                                                      │
│    "topics": ["cognitive science", "psychology", "behavior"],   │
│    "interpretation": "Looking for courses about how the mind    │
│                       works and decision-making processes"      │
│  }                                                              │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Embed Interpreted Query                                │
│  ─────────────────────────────────────────                      │
│  Model: text-embedding-3-small                                  │
│  Input: "cognitive science psychology behavior decision-making" │
│  Output: [0.023, -0.089, 0.156, ...] (1536 dims)               │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Vector Search with Metadata Filtering                  │
│  ─────────────────────────────────────────                      │
│  Database: ChromaDB                                             │
│  Filters: campus IN [Burnaby], wqb CONTAINS [B-Soc], etc.      │
│  Search:  Cosine similarity on embeddings                       │
│  Output:  Top 10 candidate courses                              │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Generate Match Reasons (LLM Call #2)                   │
│  ─────────────────────────────────────────                      │
│  For each course in top 5:                                      │
│  Input:  User query + course title + course description         │
│  Prompt: "Explain why this course matches the user's interest"  │
│  Output: "Covers human behavior and cognition - directly        │
│           matches your interest in understanding how people     │
│           think and make decisions"                             │
└─────────────────────────────┬───────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  OUTPUT: Structured response                                    │
│  {                                                              │
│    "query_interpretation": "...",                               │
│    "courses": [{ ..., "match_reason": "..." }, ...]            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### LLM Usage Summary

| Step | Purpose | Input | Output |
|------|---------|-------|--------|
| 1 | Interpretation | User's raw query | Topics + interpretation text |
| 4 | Explanation | Query + each course | Match reason per course |

**Cost estimate per request:**
- Interpretation: ~200 tokens in, ~100 tokens out
- Explanation (5 courses): ~500 tokens in, ~250 tokens out
- Total: ~1000 tokens ≈ $0.002 per query (GPT-4o-mini)

### Implementation

```python
async def recommend_courses(
    query: str,
    filters: dict,
    top_k: int = 5
) -> dict:
    """Main recommendation function with LLM enhancement."""

    # Step 1: Interpret query with LLM
    interpretation = await interpret_query(query)

    # Step 2: Embed the interpreted topics
    search_text = " ".join(interpretation["topics"])
    query_embedding = embed_text(search_text)

    # Step 3: Vector search with metadata filters
    where_filter = build_filters(filters)
    candidates = vector_db.query(
        query_embeddings=[query_embedding],
        where=where_filter,
        n_results=top_k * 2
    )

    # Step 4: Generate match reasons for top results
    top_courses = candidates[:top_k]
    for course in top_courses:
        course["match_reason"] = await generate_match_reason(
            query, course
        )

    return {
        "success": True,
        "query_interpretation": interpretation["interpretation"],
        "courses": top_courses
    }


async def interpret_query(query: str) -> dict:
    """LLM Call #1: Extract topics and interpretation."""
    prompt = f"""
    Extract the main topics and interests from this course search query.

    Query: "{query}"

    Return JSON:
    {{
        "topics": ["topic1", "topic2", ...],
        "interpretation": "One sentence describing what the user is looking for"
    }}
    """
    return await llm_call(prompt)


async def generate_match_reason(query: str, course: dict) -> str:
    """LLM Call #2: Explain why course matches."""
    prompt = f"""
    The user is looking for: "{query}"

    Explain in 1-2 sentences why this course is a good match:

    Course: {course["title"]}
    Description: {course["description"][:300]}

    Be specific about how the course content relates to their interest.
    """
    return await llm_call(prompt)

---

## Data Refresh Strategy

### For Hackathon (Pre-Event)

```
Day before hackathon:
1. Run fetch script -> raw_courses.json
2. Run preprocess script -> clean_courses.json
3. Run filter script -> electives.json
4. Run embedding script -> embeddings saved
5. Index into ChromaDB -> ready to query

At hackathon:
- Load pre-built database
- No API calls needed during demo
- Fast, reliable responses
```

### For Production (Future)

```
Daily cron job:
1. Fetch latest course data
2. Diff against existing data
3. Update changed/new courses only
4. Re-embed modified documents
5. Incremental index update
```

---

## Estimated Data Volumes

| Stage | Count | Size |
|-------|-------|------|
| Raw course sections (Summer 2026) | ~2,100 | ~5 MB JSON |
| After deduplication (unique courses) | ~1,500 | ~4 MB |
| After filtering (elective candidates) | ~600-800 | ~2 MB |
| Embeddings (1536 dim each) | ~600-800 | ~5 MB |
| Total vector DB | ~600-800 docs | ~10-15 MB |

---

## Sample Queries for Testing

| User Query | Expected Filters | Expected Results |
|------------|------------------|------------------|
| "Easy breadth course" | `max_level=200`, `no_prereqs=true` | B-Hum/B-Soc 100-level courses |
| "Science elective at Surrey" | `campus=["Surrey"]`, `wqb=["B-Sci"]` | B-Sci courses at Surrey |
| "Something about psychology" | semantic match on "psychology" | PSYC courses, related courses |
| "Writing course for CS student" | `wqb=["W"]`, exclude CMPT | W-designated non-CMPT |
| "Fun elective no math" | `no_prereqs=true`, semantic | Humanities, social sciences |
| "Interesting history or culture course" | semantic match | HIST, ARCH, cultural studies |

---

## Appendix: Sample Elective-Friendly Courses

Based on our analysis, these types of courses are ideal electives:

| Course | Why It's Good |
|--------|---------------|
| PSYC 100 | No prereqs, B-Soc, large capacity |
| CRIM 101 | No prereqs, B-Soc, interesting topic |
| ARCH 100 | No prereqs, B-Soc, unique subject |
| PHIL 105 | No prereqs, B-Hum, critical thinking |
| HIST 130 | No prereqs, B-Hum, global perspective |
| BISC 113 | No prereqs, B-Sci, "everyday life" focus |

These represent the "sweet spot" for elective recommendations.
