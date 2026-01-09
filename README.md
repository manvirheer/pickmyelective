# PickMyElective

A RAG-powered system to help SFU students discover and choose elective courses through conversational AI.

## Documentation

- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) - System design, tech stack, data sources
- [API Contracts](docs/API_CONTRACTS.md) - Endpoints, request/response formats, team responsibilities
- [Data & RAG Pipeline](docs/DATA_RAG_PIPELINE.md) - Data processing, embeddings, query flow
- [RAG Changelog](rag/CHANGELOG.md) - Detailed development progress

## Project Structure

```
pickmyelective/
├── frontend/          # React UI (coming soon)
├── rag/               # RAG service (Python + FastAPI + ChromaDB)
│   ├── src/           # Source code
│   ├── scripts/       # CLI tools
│   └── data/          # Data files (gitignored)
└── docs/              # Documentation
```

## Getting Started

### RAG Service

```bash
cd rag

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e .

# Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run the server
python scripts/run_server.py
```

The API will be available at `http://localhost:8000`. Test it:

```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"query": "easy breadth course", "top_k": 5}'
```

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
| `misc` | Other changes (config, refactoring, etc.) |

**Examples:**
```
task: add user authentication
bug: fix login redirect issue
docs: update README with setup instructions
```

### Git Workflow

- Rebase-only workflow (no merge commits)
- Work on `dev` branch, merge to `main` for releases
