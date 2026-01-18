# Docker Setup Guide

This guide covers running PickMyElective using Docker and Docker Compose.

## Prerequisites

- Docker Engine 24.0+
- Docker Compose V2 (included with Docker Desktop)
- 4GB+ available RAM (for all services)

## Quick Start

### 1. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.docker.example .env

# Edit .env with your values
nano .env  # or use your preferred editor
```

**Required variables:**

| Variable | Description | How to Get |
|----------|-------------|------------|
| `OPENAI_API_KEY` | OpenAI API key for embeddings | [platform.openai.com](https://platform.openai.com/api-keys) |
| `GOOGLE_API_KEY` | Google API key for Gemini LLM | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| `JWT_SECRET` | Secret for JWT tokens (min 32 chars) | `openssl rand -base64 64` |
| `RESEND_API_KEY` | Resend API key for sending OTP emails | [resend.com](https://resend.com) |

**Optional variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `postgres` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `postgres` | PostgreSQL password |
| `POSTGRES_DB` | `pickmyelective` | Database name |
| `COLLECTION_NAME` | `courses_1264` | ChromaDB collection name |
| `VITE_API_URL` | `http://localhost:8080` | Backend API URL for frontend |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated list of allowed origins |
| `SPRING_PROFILES_ACTIVE` | *(empty)* | Set to `prod` for production settings |

### 2. Build and Run

```bash
# Build and start all services
docker compose up --build

# Or run in detached mode (background)
docker compose up --build -d
```

### 3. Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Main application |
| Backend API | http://localhost:8080 | REST API endpoints |
| RAG Service | http://localhost:8000 | Recommendation engine |
| PostgreSQL | localhost:5432 | Database (internal) |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Network                        │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐│
│  │   Frontend   │   │   Backend    │   │    RAG Service       ││
│  │   (nginx)    │──▶│ (Spring Boot)│──▶│     (FastAPI)        ││
│  │   :3000      │   │    :8080     │   │       :8000          ││
│  └──────────────┘   └──────┬───────┘   └──────────────────────┘│
│                            │                                     │
│                     ┌──────▼───────┐                            │
│                     │  PostgreSQL  │                            │
│                     │    :5432     │                            │
│                     └──────────────┘                            │
│                                                                  │
│  Volumes: postgres_data, chroma_data                            │
└─────────────────────────────────────────────────────────────────┘
```

## Service Details

### Frontend (React + Nginx)

- **Image**: Multi-stage build (Node.js → Nginx Alpine)
- **Port**: 3000 (maps to container port 80)
- **Health check**: HTTP GET on `/`
- **Build arg**: `VITE_API_URL` for API endpoint configuration

### Backend (Spring Boot)

- **Image**: Multi-stage build (Maven → JRE 21 Alpine)
- **Port**: 8080
- **Health check**: `/actuator/health`
- **Dependencies**: PostgreSQL, RAG Service

### RAG Service (FastAPI)

- **Image**: Python 3.12 slim
- **Port**: 8000
- **Health check**: `/health`
- **Volume**: ChromaDB data persistence

### PostgreSQL

- **Image**: postgres:16-alpine
- **Port**: 5432
- **Volume**: Data persistence

## Commands Reference

### Basic Operations

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (data reset)
docker compose down -v

# View logs
docker compose logs

# View logs for specific service
docker compose logs backend
docker compose logs -f rag  # follow mode
```

### Building

```bash
# Rebuild all images
docker compose build

# Rebuild specific service
docker compose build frontend

# Build without cache
docker compose build --no-cache
```

### Individual Services

```bash
# Start specific service with dependencies
docker compose up backend

# Restart a service
docker compose restart rag

# Scale a service (if applicable)
docker compose up --scale rag=2
```

## Building Individual Images

You can build each service independently:

```bash
# Frontend
docker build -t pickmyelective-frontend ./frontend

# Backend
docker build -t pickmyelective-backend ./backend/demo

# RAG Service
docker build -t pickmyelective-rag ./rag
```

## Development Mode

For development with hot-reload, you may want to run services differently:

### Frontend Development

```bash
# Run only backend services in Docker
docker compose up postgres rag backend

# Run frontend locally with hot-reload
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### Backend Development

```bash
# Run only infrastructure in Docker
docker compose up postgres rag

# Run backend locally
cd backend/demo
./mvnw spring-boot:run
```

## Production Considerations

### Enable Production Mode

For production deployments, enable the Spring production profile:

```bash
# In your .env file
SPRING_PROFILES_ACTIVE=prod
CORS_ALLOWED_ORIGINS=https://yourdomain.com
VITE_API_URL=https://api.yourdomain.com
```

The production profile (`application-prod.properties`) enables:
- `ddl-auto=validate` (no automatic schema changes)
- SQL logging disabled
- Reduced log verbosity
- Stricter actuator endpoint access

### Security

1. **Change default passwords** in `.env`:
   ```bash
   POSTGRES_PASSWORD=use_a_strong_password_here
   JWT_SECRET=$(openssl rand -base64 64)
   ```

2. **Limit exposed ports** - consider removing direct database access:
   ```yaml
   postgres:
     # Remove or comment out:
     # ports:
     #   - "5432:5432"
   ```

3. **Use Docker secrets** for sensitive values in production.

### Performance

1. **Resource limits** - Add memory/CPU limits:
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           memory: 1G
           cpus: '1.0'
   ```

2. **Multi-stage builds** are already configured for smaller images.

### Persistence

Data is persisted in Docker volumes:
- `postgres_data` - Database files
- `chroma_data` - Vector embeddings

Back these up regularly:
```bash
# Backup PostgreSQL
docker compose exec postgres pg_dump -U postgres pickmyelective > backup.sql

# Backup volumes
docker run --rm -v pickmyelective_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz /data
```

## Troubleshooting

### Common Issues

**1. Services fail to start**
```bash
# Check logs for errors
docker compose logs

# Ensure all environment variables are set
cat .env

# Verify Docker has enough resources
docker system info
```

**2. Database connection errors**
```bash
# Wait for PostgreSQL to be ready
docker compose up postgres
# Wait for "database system is ready to accept connections"
docker compose up backend
```

**3. RAG service fails to start**
```bash
# Check if API keys are valid
docker compose logs rag

# Verify ChromaDB data exists
docker compose exec rag ls -la /app/data/chroma
```

**4. Frontend can't reach backend**
- Verify backend is healthy: `curl http://localhost:8080/actuator/health`
- Check CORS configuration
- Ensure `VITE_API_URL` build arg matches your setup

**5. Health checks failing**
```bash
# Check individual service health
docker compose ps

# Manual health check
curl http://localhost:8000/health
curl http://localhost:8080/actuator/health
```

### Resetting Everything

```bash
# Stop all containers and remove volumes
docker compose down -v

# Remove all images
docker compose down --rmi all

# Clean Docker system
docker system prune -a
```

## ChromaDB Data

The RAG service includes pre-indexed course data. If you need to re-index:

```bash
# Enter the RAG container
docker compose exec rag bash

# Run indexing script (if available)
python scripts/index_courses.py
```

Alternatively, mount your own ChromaDB data:

```yaml
rag:
  volumes:
    - ./my-chroma-data:/app/data/chroma
```

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `POSTGRES_USER` | No | PostgreSQL username (default: postgres) |
| `POSTGRES_PASSWORD` | No | PostgreSQL password (default: postgres) |
| `POSTGRES_DB` | No | Database name (default: pickmyelective) |
| `JWT_SECRET` | Yes | JWT signing secret (min 32 chars) |
| `RESEND_API_KEY` | Yes | Resend API key for emails |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated allowed origins for CORS |
| `SPRING_PROFILES_ACTIVE` | No | Spring profile (`prod` for production) |

### Frontend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend API URL (default: http://localhost:8080) |

### RAG Service (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for embeddings |
| `GOOGLE_API_KEY` | Yes | Google API key for Gemini |
| `COLLECTION_NAME` | No | ChromaDB collection (default: courses_1264) |

## Support

For issues specific to Docker setup, check:
1. Docker and Docker Compose versions: `docker --version && docker compose version`
2. Available system resources: `docker system info`
3. Service logs: `docker compose logs [service-name]`
