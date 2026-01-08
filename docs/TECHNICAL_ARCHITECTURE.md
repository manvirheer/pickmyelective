# PickMyElective - Technical Architecture

## Project Overview

A RAG-powered conversational AI to help SFU students discover elective courses for upcoming semesters.

**Target Event:** JourneyHacks 2026 (12-hour hackathon)
**Target Users:** SFU undergraduate students seeking electives

---

## System Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend │────▶│ Backend  │────▶│   RAG    │
└──────────┘     └────┬─────┘     └──────────┘
                      │
                      ▼
              ┌────────────┐
              │  Supabase  │
              │  + Resend  │
              └────────────┘
```

### Monorepo Structure

```
pickmyelective/
├── frontend/      # React UI
├── backend/       # Auth + API gateway
├── rag/           # RAG service
└── docs/          # Documentation
```

---

## Technology Decisions

### RAG Service (Our Ownership)
| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Framework** | Python + FastAPI | Best ML ecosystem |
| **Vector DB** | ChromaDB | Local, simple |
| **Embeddings** | OpenAI `text-embedding-3-small` | Good quality, cheap |
| **LLM** | Claude / GPT-4o-mini | Response generation |

### Backend (Teammate's Ownership)
| Component | Choice |
|-----------|--------|
| **User Database** | Supabase |
| **Email (OTP)** | Resend |
| **Framework** | Their choice |

---

## Service Responsibilities

| Service | Responsibilities |
|---------|------------------|
| **Frontend** | Chat UI, auth flow, display recommendations |
| **Backend** | Auth (OTP), rate limiting, proxy to RAG |
| **RAG** | Semantic search, query interpretation, explanations |

---

## Data Sources

### SFU Course Outlines API
- **URL:** `http://www.sfu.ca/bin/wcm/course-outlines`
- **Auth:** None
- **Data:** Course descriptions, prereqs, schedules, instructors

### CourSys API
- **URL:** `https://coursys.sfu.ca/browse/?tabledata=yes`
- **Auth:** None
- **Data:** Course listings, enrollment, campus

### Semester Codes
| Code | Semester |
|------|----------|
| 1261 | Spring 2026 |
| 1264 | Summer 2026 |
| 1267 | Fall 2026 |

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Semantic-first** | No rigid department filters, embeddings find relevant courses |
| **Explainable** | Every recommendation has a `match_reason` |
| **Transparent** | User sees `query_interpretation` |
| **Single-shot** | One query → recommendations (no multi-turn) |

---

## Hackathon Constraints

| Constraint | Mitigation |
|------------|------------|
| 12 hours | Pre-fetch data, pre-compute embeddings |
| Demo-focused | Script 5 great demo queries |
| 4-minute presentation | Prepare compelling demo flow |

---

## Related Documentation

- [API Contracts](./API_CONTRACTS.md) - Endpoint specifications, request/response formats
- [Data & RAG Pipeline](./DATA_RAG_PIPELINE.md) - Data processing, embedding, query flow
