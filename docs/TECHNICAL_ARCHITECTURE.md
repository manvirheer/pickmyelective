# PickMyElective - Technical Architecture

## Project Overview

A RAG-powered conversational AI to help SFU students discover elective courses for upcoming semesters.

**Target Event:** JourneyHacks 2026 (12-hour hackathon)
**Target Users:** SFU undergraduate students seeking electives

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│                   (Chat Interface)                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND API                             │
│            (Query Processing + RAG Pipeline)                 │
├─────────────────────────────────────────────────────────────┤
│  • Pre-filter by user constraints (campus, WQB, level)      │
│  • Semantic search on course embeddings                      │
│  • LLM response generation with retrieved context            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    VECTOR DATABASE                           │
│              (Pre-indexed course embeddings)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### 1. SFU Course Outlines API (Official)

- **Base URL:** `http://www.sfu.ca/bin/wcm/course-outlines`
- **Auth:** None required
- **Rate Limits:** Not documented
- **Data Available:** 2014-2026

| Endpoint | Returns |
|----------|---------|
| `?{year}` | Available terms |
| `?{year}/{term}` | All departments (~80) |
| `?{year}/{term}/{dept}` | Courses with titles |
| `?{year}/{term}/{dept}/{num}/{section}` | Full course outline |

**Rich Fields:** description, prerequisites, corequisites, instructor, schedule, campus, WQB designation, units, delivery method

**Example Request:**
```bash
curl "http://www.sfu.ca/bin/wcm/course-outlines?2026/summer/cmpt/120/d100"
```

### 2. CourSys API (SFU CS Department)

- **Base URL:** `https://coursys.sfu.ca/browse/`
- **Auth:** None required (public browse)
- **Key Param:** `?tabledata=yes` returns JSON

| Filter | Parameter | Example |
|--------|-----------|---------|
| Semester | `semester[]=1264` | Summer 2026 |
| Subject | `subject[]=CMPT` | Computing Science |
| Campus | `campus[]=BRNBY` | Burnaby |
| Campus | `campus[]=SURRY` | Surrey |
| Campus | `campus[]=OFFST` | Off-campus/Online |

**Unique Data:** Real-time enrollment counts (e.g., "45/200"), section-level details

**Example Request:**
```bash
curl "https://coursys.sfu.ca/browse/?semester%5B%5D=1264&subject%5B%5D=CMPT&tabledata=yes"
```

**Course Info Endpoint:**
```bash
curl "https://coursys.sfu.ca/browse/info/2026su-cmpt-120-d1?data=yes"
# Returns: {"component": "LEC", "longtitle": "...", "descrlong": "..."}
```

### Semester Codes (CourSys)

| Code | Semester |
|------|----------|
| 1261 | Spring 2026 |
| 1264 | Summer 2026 |
| 1267 | Fall 2026 |

Formula: `1` + `YY` + `term` where term: 1=Spring, 4=Summer, 7=Fall

---

## Data Availability (as of Jan 2026)

| Semester | SFU Outlines API | CourSys | Recommendation |
|----------|------------------|---------|----------------|
| Spring 2026 | Full data | Full data | Available |
| Summer 2026 | Partial (some nulls) | Full data | **Primary Target** |
| Fall 2026 | Not available | Not available | Wait for release |

**Summer 2026 Stats:**
- Total sections: 2,101
- Burnaby campus: 1,139
- Surrey campus: 158
- Off-campus: varies

---

## Tech Stack (Proposed)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | React / Next.js | Fast to build, team familiarity |
| **Backend** | Python (FastAPI) | Best RAG/ML ecosystem |
| **Vector DB** | ChromaDB | Local, free, simple setup |
| **Embeddings** | OpenAI `text-embedding-3-small` | Good quality, cheap ($0.02/1M tokens) |
| **LLM** | Claude API or GPT-4o-mini | Response generation |
| **Hosting** | Vercel (FE) + Railway (BE) | Free tiers available |

### Alternatives Considered

| Component | Alternative | Tradeoff |
|-----------|-------------|----------|
| Vector DB | Pinecone | Managed but adds complexity |
| Embeddings | `all-MiniLM-L6-v2` (local) | Free but lower quality |
| LLM | Groq (Llama) | Very fast, free tier, less capable |
| LLM | Ollama (local) | No API costs, needs good hardware |

---

## Hackathon Constraints

| Constraint | Impact | Mitigation |
|------------|--------|------------|
| 12 hours total | Very limited build time | Pre-fetch data, pre-compute embeddings before event |
| Demo-focused judging | Need polished happy path | Script 5 great demo queries that work perfectly |
| Beginner-friendly event | Keep it accessible | Minimal dependencies, clear code structure |
| 4-minute presentation | Must show value quickly | Prepare compelling demo flow |

---

## MVP Scope

### In Scope (Must Have)
- [ ] Chat interface for course queries
- [ ] Filter by: campus, WQB designation, course level
- [ ] Semantic search on course descriptions
- [ ] Natural language course recommendations
- [ ] Show course details (prereqs, schedule, instructor)

### Nice to Have
- [ ] Save/bookmark courses
- [ ] Compare courses side-by-side
- [ ] Schedule visualization

### Out of Scope (v1)
- Professor reviews/ratings (RateMyProf)
- Real-time seat availability checking
- Schedule conflict detection
- User accounts/authentication
- Course history/taken courses tracking

---

## API Response Examples

### SFU Outlines - Full Course Data
```json
{
  "info": {
    "title": "Introduction to Computing Science and Programming I",
    "description": "An elementary introduction to computing science...",
    "prerequisites": "BC Math 12 or equivalent is recommended.",
    "corequisites": "",
    "units": "3",
    "designation": "Quantitative/Breadth-Science",
    "deliveryMethod": "In Person",
    "degreeLevel": "UGRD"
  },
  "instructor": [{
    "name": "Diana Cukierman",
    "email": "diana@sfu.ca"
  }],
  "courseSchedule": [{
    "campus": "Burnaby",
    "days": "Tu",
    "startTime": "12:30",
    "endTime": "14:20"
  }]
}
```

### CourSys - Course List
```json
{
  "recordsFiltered": 134,
  "data": [
    ["Summer 2026", "<a href='...'>CMPT 120 D100</a>", "Intro.Cmpt.Sci/Programming I", "0/200", "Cukierman, Diana", "Burnaby"],
    ["Summer 2026", "<a href='...'>CMPT 120 D200</a>", "Intro.Cmpt.Sci/Programming I", "0/200", "Khangura, Harinder", "Surrey"]
  ]
}
```

---

## Open Questions

- [ ] Which LLM provider? (Claude vs GPT vs Groq - cost/quality tradeoff)
- [ ] Pre-fetch all data before hackathon, or build live fetcher?
- [ ] How much UI polish vs backend intelligence?
- [ ] Team role split: who does frontend vs backend vs data?

---

## References

- [SFU Course Outlines API Documentation](https://www.sfu.ca/outlines/help/api.html)
- [SFU Course Outlines Portal](https://www.sfu.ca/outlines.html)
- [CourSys Browse](https://coursys.sfu.ca/browse/)
- [JourneyHacks 2025 Devpost](https://journeyhacks-2025.devpost.com/)
- [sfucourses-api (third-party)](https://github.com/brianrahadi/sfucourses-api)
- [SFU Academic Calendar](https://www.sfu.ca/students/calendar/2026/summer/courses.html)
