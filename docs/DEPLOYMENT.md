# Deploying PickMyElective

This guide covers deploying PickMyElective to a VPS with HTTPS using Docker and Caddy.

## Requirements

- VPS with 2GB+ RAM (AWS Lightsail, DigitalOcean, etc.)
- Domain name
- API keys: OpenAI, Google Gemini, Resend

## Architecture

```
                    ┌─────────────┐
                    │   Caddy     │
                    │ (HTTPS/SSL) │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               │
    ┌─────────────┐ ┌─────────────┐        │
    │  Frontend   │ │   Backend   │        │
    │   (React)   │ │ (Spring)    │        │
    │   :3000     │ │   :8080     │        │
    └─────────────┘ └──────┬──────┘        │
                           │               │
                    ┌──────┴──────┐        │
                    │             │        │
                    ▼             ▼        │
             ┌───────────┐ ┌───────────┐   │
             │    RAG    │ │ PostgreSQL│   │
             │ (FastAPI) │ │           │   │
             └───────────┘ └───────────┘   │
                    Internal Network Only
```

## Quick Start

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy
```

### 2. Clone and Configure

```bash
git clone https://github.com/manvirheer/pickmyelective.git
cd pickmyelective
cp .env.docker.example .env
```

Edit `.env` with your production values:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=pickmyelective

JWT_SECRET=<generate with: openssl rand -base64 64>

RESEND_API_KEY=re_xxxxx
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=xxxxx

COLLECTION_NAME=courses_1264
SPRING_PROFILES_ACTIVE=prod

# Your domain
CORS_ALLOWED_ORIGINS=https://pickmyelective.yourdomain.com
VITE_API_URL=https://api.pickmyelective.yourdomain.com
```

### 3. Configure DNS

Point your domain to the server's IP:

```
A  pickmyelective.yourdomain.com      → <server-ip>
A  api.pickmyelective.yourdomain.com  → <server-ip>
```

### 4. Configure Caddy

Edit `/etc/caddy/Caddyfile`:

```
pickmyelective.yourdomain.com {
    reverse_proxy localhost:3000
}

api.pickmyelective.yourdomain.com {
    reverse_proxy localhost:8080
}
```

Restart Caddy:

```bash
sudo systemctl restart caddy
```

### 5. Deploy

For production (includes memory limits and log rotation):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

For development/testing:

```bash
docker compose up -d --build
```

## Verification

```bash
# Check services are running
docker compose ps

# Check backend health
curl https://api.pickmyelective.yourdomain.com/actuator/health

# View logs
docker compose logs -f
```

## Updating

```bash
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Troubleshooting

**Services won't start:**
```bash
docker compose logs <service-name>
```

**Database connection issues:**
```bash
docker compose exec postgres pg_isready
```

**Frontend not loading:**
- Check that `VITE_API_URL` was set before building
- Rebuild: `docker compose up -d --build frontend`

**CORS errors:**
- Verify `CORS_ALLOWED_ORIGINS` matches your frontend URL exactly
- Include the protocol (`https://`)

## Resource Usage

On a 2GB instance with production compose file:

| Service    | Memory Limit |
|------------|--------------|
| PostgreSQL | 256MB        |
| RAG        | 512MB        |
| Backend    | 512MB        |
| Frontend   | 128MB        |

## Security Notes

- PostgreSQL and RAG ports are not exposed externally
- Only the frontend (3000) and backend (8080) are accessible, proxied through Caddy
- Caddy handles SSL certificates automatically via Let's Encrypt
- Production profile disables SQL logging and restricts actuator endpoints
