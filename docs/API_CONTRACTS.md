# PickMyElective - API Contracts & Team Responsibilities

## Team Responsibilities

| Module | Owner | Notes |
|--------|-------|-------|
| `backend/` | Teammate | Uses Supabase for user data |
| `rag/` | Us | Python + FastAPI + ChromaDB |
| `frontend/` | TBD | TBD |

---

## Service Communication

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

### Why Frontend → Backend → RAG?

Frontend **never** calls RAG directly. All requests go through Backend first.

| Reason | Explanation |
|--------|-------------|
| **Authentication** | RAG doesn't know about users/tokens - Backend validates JWTs |
| **Rate Limiting** | Backend enforces the 5-query limit per user |
| **Security** | RAG is an internal service, not exposed publicly |
| **Usage Tracking** | Backend tracks who queried what (stored in Supabase) |

### Request Flow for Course Query

```
1. Frontend sends POST /api/query with JWT
              ↓
2. Backend validates JWT (is user authenticated?)
              ↓
3. Backend checks queries_remaining in Supabase
              ↓
4. If allowed → Backend proxies to RAG (POST /api/recommend)
              ↓
5. RAG returns course recommendations
              ↓
6. Backend decrements user's query count in Supabase
              ↓
7. Backend returns response + updated queries_remaining to Frontend
```

---

## Backend APIs (Frontend-facing)

### Authentication

#### Request OTP
```
POST /auth/request-otp
```

**Request:**
```json
{
  "email": "user@sfu.ca"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "OTP sent to your email"
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "Email must end with @sfu.ca"
}
```

---

#### Verify OTP
```
POST /auth/verify-otp
```

**Request:**
```json
{
  "email": "user@sfu.ca",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "email": "user@sfu.ca",
    "queries_remaining": 5,
    "created_at": "2026-01-07T10:00:00Z"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Invalid or expired OTP"
}
```

---

### User Info

#### Get Current User
```
GET /api/user
Authorization: Bearer <jwt>
```

**Response (200):**
```json
{
  "email": "user@sfu.ca",
  "queries_remaining": 3,
  "created_at": "2026-01-07T10:00:00Z"
}
```

---

### Course Query (Proxied to RAG)

#### Query Courses
```
POST /api/query
Authorization: Bearer <jwt>
```

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

**Response (200):**
```json
{
  "success": true,
  "queries_remaining": 2,
  "query_interpretation": "Looking for courses about cognitive science, psychology, and decision-making...",
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
      "match_reason": "Covers human behavior, cognition, and decision-making processes - directly matches your interest"
    }
  ]
}
```

**Error (429 - Rate Limited):**
```json
{
  "success": false,
  "error": "You have used all 5 queries. Contact support for more.",
  "queries_remaining": 0
}
```

---

## RAG API (Internal - Backend calls this)

### Recommend Courses
```
POST /api/recommend
X-User-Id: <user_id>  (optional, for logging)
```

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

**Response (200):**
```json
{
  "success": true,
  "query_interpretation": "Looking for courses about cognitive science, psychology, and decision-making at Burnaby/Surrey that fulfill breadth requirements with no prerequisites",
  "courses": [
    {
      "course_code": "PSYC 100",
      "section": "D100",
      "title": "Introduction to Psychology I",
      "description": "Acquaints the student with major issues in contemporary psychology...",
      "campus": "Burnaby",
      "wqb": ["B-Soc"],
      "units": 3,
      "prerequisites": "",
      "instructor": "Dr. Smith",
      "schedule": "Tu/Th 10:30-12:20",
      "relevance_score": 0.92,
      "match_reason": "Covers human behavior, cognition, and decision-making processes - directly matches your interest in understanding how people think"
    },
    {
      "course_code": "COGS 100",
      "section": "D100",
      "title": "Exploring the Mind",
      "description": "Introduction to cognitive science...",
      "campus": "Burnaby",
      "wqb": ["B-Soc"],
      "units": 3,
      "prerequisites": "",
      "instructor": "Dr. Johnson",
      "schedule": "Mo/We 14:30-16:20",
      "relevance_score": 0.89,
      "match_reason": "Interdisciplinary approach to understanding the mind, combining psychology, philosophy, and neuroscience"
    },
    {
      "course_code": "PHIL 105",
      "section": "D100",
      "title": "Critical Thinking",
      "description": "Analysis of reasoning and argumentation...",
      "campus": "Burnaby",
      "wqb": ["B-Hum"],
      "units": 3,
      "prerequisites": "",
      "instructor": "Dr. Lee",
      "schedule": "Tu/Th 08:30-10:20",
      "relevance_score": 0.78,
      "match_reason": "Explores how people reason and make logical decisions - related to your interest in decision-making"
    }
  ]
}
```

**Error (400):**
```json
{
  "success": false,
  "error": "No courses match your interests with the given constraints. Try relaxing the filters."
}
```

---

## Filter Options

| Filter | Type | Values | Description |
|--------|------|--------|-------------|
| `campus` | array | `["Burnaby", "Surrey", "Vancouver", "Online"]` | Physical location |
| `wqb` | array | `["W", "Q", "B-Sci", "B-Soc", "B-Hum"]` | Breadth/Writing/Quant |
| `max_level` | int | `100`, `200`, `300`, `400` | Course level ceiling |
| `no_prerequisites` | bool | `true`/`false` | Exclude courses with prereqs |

**Note:** No `department` filter - RAG uses semantic search to find relevant departments automatically.

---

## Response Fields

### Course Object

| Field | Type | Description |
|-------|------|-------------|
| `course_code` | string | e.g., "PSYC 100" |
| `section` | string | e.g., "D100" |
| `title` | string | Full course title |
| `description` | string | Course description |
| `campus` | string | Burnaby/Surrey/etc. |
| `wqb` | array | WQB designations |
| `units` | int | Credit units |
| `prerequisites` | string | Prereq text or empty |
| `instructor` | string | Instructor name |
| `schedule` | string | Days/times |
| `relevance_score` | float | 0-1, semantic similarity |
| `match_reason` | string | Why this course matches |

---

## Error Codes

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (invalid filters, no results) |
| 401 | Unauthorized (invalid/expired token) |
| 429 | Rate limited (no queries remaining) |
| 500 | Server error |

---

## Authentication Flow

```
1. User enters email (must be @sfu.ca)
        ↓
2. POST /auth/request-otp
        ↓
3. Backend sends OTP via Resend
        ↓
4. User enters OTP from email
        ↓
5. POST /auth/verify-otp
        ↓
6. Backend returns JWT + user info
        ↓
7. Frontend stores JWT for subsequent requests
```

---

## Rate Limiting

- **Limit:** 5 queries per user (lifetime)
- **Storage:** Supabase (persistent)
- **Enforcement:** Backend checks before proxying to RAG
- **Response:** Always includes `queries_remaining` count
