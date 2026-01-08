# PickMyElective

A RAG-powered system to help SFU students discover and choose elective courses through conversational AI.

## Documentation

- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md) - System design, tech stack, data sources
- [API Contracts](docs/API_CONTRACTS.md) - Endpoints, request/response formats, team responsibilities
- [Data & RAG Pipeline](docs/DATA_RAG_PIPELINE.md) - Data processing, embeddings, query flow

## Getting Started

```bash
yarn install
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
