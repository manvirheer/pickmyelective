# PickMyElective - Technical Architecture

## Project Overview

A RAG-powered conversational AI to help SFU students discover elective courses for upcoming semesters.

**Target Event:** JourneyHacks 2026 (12-hour hackathon)
**Target Users:** SFU undergraduate students seeking electives

---

## Monorepo Structure

```
pickmyelective/
├── frontend/      # React UI (TBD)
├── backend/       # Auth + API gateway [TEAMMATE]
├── rag/           # RAG service [OUR FOCUS]
└── docs/          # Documentation
```

## Team Responsibilities

| Module | Owner | Tech Stack |
|--------|-------|------------|
| `backend/` | Teammate | Python + FastAPI + Supabase |
| `rag/` | Us | Python + FastAPI + ChromaDB |
| `frontend/` | TBD | React / Next.js |

---

## System Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────▶│ Backend  │────▶│   RAG    │
└──────────┘     └────┬─────┘     └──────────┘
                      │            (our focus)
                      ▼
              ┌────────────┐
              │  Supabase  │
              │  + Resend  │
              └────────────┘
```

### Service Responsibilities

| Service | Responsibilities |
|---------|------------------|
| **Frontend** | Chat UI, auth flow, display recommendations |
| **Backend** | Auth (OTP via Resend), rate limiting (5/lifetime), proxy to RAG |
| **RAG** | Semantic search, query interpretation, match explanations |

---

## Architecture Decisions

| Decision | Choice | Owner |
|----------|--------|-------|
| Rate limiting | Lifetime (5 queries per user) | Backend |
| Service communication | REST API | Both |
| Email provider | Resend | Backend |
| User Database | Supabase | Backend |
| Vector DB | ChromaDB | RAG |
| Embeddings | OpenAI `text-embedding-3-small` | RAG |
| LLM | Claude/GPT-4o-mini | RAG |

---

## API Contracts

### Backend → RAG (Internal API)

**Endpoint:** `POST /api/recommend`

**Request:**
```json
{
  "query": "I'm interested in understanding how people think and make decisions",
  "filters": {
    "campus": ["Burnaby", "Surrey"],
    "wqb": ["B-Hum", "B-Soc"],
    "max_level": 200,
    "no_prerequisites": true
  },
  "top_k": 5
}
```

**Note:** No `department` filter - RAG uses semantic search to find relevant departments.

**Response:**
```json
{
  "success": true,
  "query_interpretation": "Looking for courses about cognitive science, psychology, and decision-making at Burnaby/Surrey that fulfill breadth requirements with no prerequisites",
  "courses": [
    {
      "course_code": "PSYC 100",
      "section": "D100",
      "title": "Introduction to Psychology I",
      "description": "Acquaints the student with major issues...",
      "campus": "Burnaby",
      "wqb": ["B-Soc"],
      "units": 3,
      "prerequisites": "",
      "instructor": "Dr. Smith",
      "schedule": "Tu/Th 10:30-12:20",
      "relevance_score": 0.92,
      "match_reason": "Covers human behavior, cognition, and decision-making processes - directly matches your interest in understanding how people think"
    }
  ]
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "No courses match your interests with the given constraints."
}
```

### Backend Public APIs (Frontend-facing)

```
POST /auth/request-otp
  Body: { email: "user@sfu.ca" }
  Response: { success: true, message: "OTP sent" }

POST /auth/verify-otp
  Body: { email: "user@sfu.ca", code: "123456" }
  Response: { token: "jwt...", user: { email, queries_remaining: 5 } }

POST /api/query
  Headers: Authorization: Bearer <jwt>
  Body: { query: "...", filters: {...} }
  Response: { courses: [...], queries_remaining: 4 }

GET /api/user
  Headers: Authorization: Bearer <jwt>
  Response: { email, queries_remaining, created_at }
```

---

## Filter Options

| Filter | Type | Values |
|--------|------|--------|
| `campus` | array | `["Burnaby", "Surrey", "Vancouver", "Online"]` |
| `wqb` | array | `["W", "Q", "B-Sci", "B-Soc", "B-Hum"]` |
| `max_level` | int | `100`, `200`, `300`, `400` |
| `no_prerequisites` | bool | `true`/`false` |

---

## Data Sources

### 1. SFU Course Outlines API (Official)

- **Base URL:** `http://www.sfu.ca/bin/wcm/course-outlines`
- **Auth:** None required
- **Rate Limits:** Not documented

| Endpoint | Returns |
|----------|---------|
| `?{year}` | Available terms |
| `?{year}/{term}` | All departments (~80) |
| `?{year}/{term}/{dept}` | Courses with titles |
| `?{year}/{term}/{dept}/{num}/{section}` | Full course outline |

**Example:**
```bash
curl "http://www.sfu.ca/bin/wcm/course-outlines?2026/summer/cmpt/120/d100"
```

### 2. CourSys API (SFU CS)

- **Base URL:** `https://coursys.sfu.ca/browse/?tabledata=yes`
- **Auth:** None required

| Filter | Parameter | Example |
|--------|-----------|---------|
| Semester | `semester[]=1264` | Summer 2026 |
| Subject | `subject[]=CMPT` | Computing Science |
| Campus | `campus[]=BRNBY` | Burnaby |

**Semester Codes:** `1261` = Spring 2026, `1264` = Summer 2026, `1267` = Fall 2026

---

## Data Availability (Jan 2026)

| Semester | Status | Recommendation |
|----------|--------|----------------|
| Spring 2026 | Full data | Available |
| Summer 2026 | Full data | **Primary Target** |
| Fall 2026 | Not available | Wait for release |

**Summer 2026:** ~2,100 sections, 1,139 Burnaby, 158 Surrey

---

## Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Query style | Natural language | Users describe interests, not filters |
| Department filter | Removed | Semantic search finds relevant depts |
| Conversation | Single-shot | Simpler for hackathon |
| Explanations | Yes (`match_reason`) | Users understand why courses were picked |
| Interpretation | Yes (`query_interpretation`) | User sees what system understood |

---

## Hackathon Constraints

| Constraint | Mitigation |
|------------|------------|
| 12 hours | Pre-fetch data, pre-compute embeddings |
| Demo-focused | Script 5 great demo queries |
| 4-minute presentation | Prepare compelling demo flow |

---

## References

- [SFU Course Outlines API](https://www.sfu.ca/outlines/help/api.html)
- [CourSys Browse](https://coursys.sfu.ca/browse/)
- [JourneyHacks 2025 Devpost](https://journeyhacks-2025.devpost.com/)
