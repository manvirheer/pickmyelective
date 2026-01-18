# RAG Service Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for chromadb
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy requirements first for caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY src ./src
COPY scripts ./scripts

# Copy pre-indexed ChromaDB data (if available)
# This can be overridden by a volume mount
COPY data ./data

# Create directory for ChromaDB persistence
RUN mkdir -p /app/data/chroma && chown -R appuser:appgroup /app

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV CHROMA_PATH=/app/data/chroma
ENV COLLECTION_NAME=courses_1264

USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl --fail http://localhost:8000/health || exit 1

# Run the FastAPI application
CMD ["python", "-m", "uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
