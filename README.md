# PickMyElective

A RAG-powered system to help SFU students discover and choose elective courses through conversational AI.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Spring Boot 3.4, Java 21, PostgreSQL |
| RAG Service | Python 3.12, FastAPI, ChromaDB, Gemini API |
| Database | Supabase (PostgreSQL) |
| Authentication | JWT + OTP via Resend |

## Project Structure

```
pickmyelective/
├── frontend/          # React + Vite frontend
├── backend/demo/      # Spring Boot API server
├── rag/               # RAG service (Python + FastAPI)
└── docs/              # Documentation
```

## Prerequisites

- **Node.js** 18+ and npm
- **Java** 21
- **Python** 3.12
- **Maven** 3.9+

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/manvirheer/pickmyelective.git
cd pickmyelective
```

### 2. RAG Service Setup

```bash
cd rag

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -e .

# Configure environment
cp .env.example .env
```

Edit `rag/.env` and add your API keys:
```env
OPENAI_API_KEY=sk-...       # For embeddings
GOOGLE_API_KEY=...          # For Gemini LLM
```

Start the RAG service:
```bash
python scripts/run_server.py
```

The RAG API will be available at `http://localhost:8000`.

### 3. Backend Setup

```bash
cd backend/demo

# Configure environment
cp .env.example .env
```

Edit `backend/demo/.env` with your credentials:
```env
SUPABASE_DB_URL=jdbc:postgresql://your-host:5432/postgres
SUPABASE_DB_USERNAME=postgres
SUPABASE_DB_PASSWORD=your-password
JWT_SECRET=your-secure-jwt-secret
RESEND_API_KEY=re_...
```

Build and run:
```bash
./mvnw spring-boot:run
```

The backend API will be available at `http://localhost:8080`.

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

## Running All Services

For development, run each service in a separate terminal:

```bash
# Terminal 1 - RAG Service
cd rag && source .venv/bin/activate && python scripts/run_server.py

# Terminal 2 - Backend
cd backend/demo && ./mvnw spring-boot:run

# Terminal 3 - Frontend
cd frontend && npm run dev
```

## API Endpoints

### Backend (Port 8080)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/request-otp` | Request OTP for login |
| POST | `/api/auth/verify-otp` | Verify OTP and get JWT |
| POST | `/api/query` | Submit course query |
| GET | `/api/query/history` | Get query history |
| GET | `/api/query/remaining` | Get remaining queries |

### RAG Service (Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/recommend` | Get course recommendations |
| GET | `/health` | Health check |

## Documentation

- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [API Contracts](docs/API_CONTRACTS.md)
- [Data & RAG Pipeline](docs/DATA_RAG_PIPELINE.md)

## Development

### Commit Message Format

```
<type>: <message>
```

| Type | Use For |
|------|---------|
| `task` | New features or functionality |
| `bug` | Bug fixes |
| `docs` | Documentation changes |
| `design` | UI/UX or architectural changes |
| `misc` | Other changes |

### Git Workflow

- Rebase-only workflow (no merge commits)
- Work on `dev` branch, merge to `main` for releases
