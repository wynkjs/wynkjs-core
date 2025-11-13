# Deployment Guide

This guide covers deploying WynkJS applications to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Build for Production](#build-for-production)
- [Environment Configuration](#environment-configuration)
- [Deployment Platforms](#deployment-platforms)
  - [Railway](#railway)
  - [Fly.io](#flyio)
  - [DigitalOcean](#digitalocean)
  - [AWS](#aws)
  - [Docker](#docker)
  - [VPS (Self-Hosted)](#vps-self-hosted)
- [Performance Optimization](#performance-optimization)
- [Monitoring & Logging](#monitoring--logging)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- ✅ Built and tested your application locally
- ✅ All tests passing (`bun test`)
- ✅ Environment variables documented
- ✅ Database migrations ready (if applicable)
- ✅ CORS configured for production domains

---

## Build for Production

### 1. Build TypeScript

```bash
# Build the project
bun run build

# This creates the dist/ folder with compiled JavaScript
```

### 2. Verify Build

```bash
# Test the built version
bun dist/index.js

# Ensure server starts without errors
```

### 3. Update package.json

```json
{
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "tsc",
    "start": "bun dist/index.js", // ✅ Production start
    "test": "bun test"
  }
}
```

---

## Environment Configuration

### .env.production

Create a production environment file:

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://user:password@host:5432/dbname

# API Keys (use secrets management in production)
API_KEY=your-production-api-key
JWT_SECRET=your-strong-jwt-secret

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Logging
LOG_LEVEL=info
```

### Load Environment Variables

```typescript
// src/index.ts
import { WynkFactory, CorsOptions } from "wynkjs";

// Load environment variables
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== "production";

const corsOptions: CorsOptions = {
  origin: isDevelopment
    ? true // Allow all in development
    : process.env.ALLOWED_ORIGINS?.split(",") || [], // Strict in production
  credentials: true,
};

const app = WynkFactory.create({
  controllers: [UserController],
  cors: corsOptions,
});

await app.listen(PORT);
console.log(`🚀 Server running on port ${PORT}`);
```

---

## Deployment Platforms

### Railway

[Railway.app](https://railway.app) provides easy deployment with Bun support.

#### Setup

1. Create `railway.toml`:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "bun run start"
```

2. Create a new Railway project
3. Connect your GitHub repository
4. Add environment variables in Railway dashboard
5. Deploy!

#### Environment Variables

Add in Railway dashboard:
- `PORT` (auto-provided)
- `DATABASE_URL`
- `ALLOWED_ORIGINS`
- Other secrets

---

### Fly.io

[Fly.io](https://fly.io) supports Bun natively with global edge deployment.

#### Setup

1. Install Fly CLI:

```bash
curl -L https://fly.io/install.sh | sh
```

2. Login:

```bash
fly auth login
```

3. Create `fly.toml`:

```toml
app = "my-wynkjs-app"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

4. Create `Dockerfile`:

```dockerfile
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --production

# Copy source
COPY . .

# Build TypeScript
RUN bun run build

# Expose port
EXPOSE 8080

# Start application
CMD ["bun", "dist/index.js"]
```

5. Deploy:

```bash
fly deploy
```

#### Set Secrets

```bash
fly secrets set DATABASE_URL=postgres://...
fly secrets set API_KEY=your-api-key
fly secrets set ALLOWED_ORIGINS=https://yourdomain.com
```

---

### DigitalOcean

Deploy on DigitalOcean App Platform or Droplets.

#### App Platform

1. Create `app.yaml`:

```yaml
name: wynkjs-app
services:
  - name: api
    github:
      repo: username/repo
      branch: main
    build_command: bun install && bun run build
    run_command: bun run start
    envs:
      - key: NODE_ENV
        value: production
    http_port: 3000
```

2. Push to GitHub
3. Create new App in DigitalOcean dashboard
4. Connect repository
5. Add environment variables
6. Deploy!

#### Droplet (VPS)

See [VPS deployment](#vps-self-hosted) below.

---

### AWS

Deploy on AWS using EC2, ECS, or Lambda.

#### EC2 Deployment

1. Launch Ubuntu EC2 instance
2. SSH into instance
3. Install Bun:

```bash
curl -fsSL https://bun.sh/install | bash
```

4. Clone your repository:

```bash
git clone https://github.com/username/repo.git
cd repo
```

5. Install dependencies and build:

```bash
bun install
bun run build
```

6. Use PM2 for process management:

```bash
bun add -g pm2
pm2 start dist/index.js --name wynkjs-app
pm2 save
pm2 startup
```

7. Setup reverse proxy with Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

### Docker

Containerize your WynkJS application.

#### Dockerfile

```dockerfile
# Use Bun's official image
FROM oven/bun:1 as base

WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

# Production image
FROM base AS production
WORKDIR /app

# Copy built files and dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run healthcheck.js || exit 1

# Run application
CMD ["bun", "dist/index.js"]
```

#### .dockerignore

```
node_modules
dist
.env
.env.local
.git
.gitignore
*.md
tests
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - API_KEY=${API_KEY}
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=wynk
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=wynkdb
    volumes:
      - postgres-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres-data:
```

#### Build and Run

```bash
# Build image
docker build -t wynkjs-app .

# Run container
docker run -p 3000:3000 --env-file .env.production wynkjs-app

# Or use docker-compose
docker-compose up -d
```

---

### VPS (Self-Hosted)

Deploy on any VPS (DigitalOcean, Linode, Vultr, etc.)

#### Initial Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Bun
curl -fsSL https://bun.sh/install | bash

# 3. Install Nginx
sudo apt install nginx -y

# 4. Install Certbot for SSL
sudo apt install certbot python3-certbot-nginx -y

# 5. Clone your repository
git clone https://github.com/username/repo.git
cd repo

# 6. Install dependencies and build
bun install
bun run build
```

#### Process Management with PM2

```bash
# Install PM2
bun add -g pm2

# Start application
pm2 start dist/index.js --name wynkjs-app

# Save PM2 config
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### SSL Certificate

```bash
# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renew setup
sudo certbot renew --dry-run
```

#### Firewall Setup

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## Performance Optimization

### 1. Enable Clustering (if needed)

WynkJS is already very fast, but you can use PM2 clustering:

```bash
pm2 start dist/index.js -i max --name wynkjs-app
```

### 2. Database Connection Pooling

```typescript
// providers/database.service.ts
@Injectable()
@singleton()
export class DatabaseService {
  async onModuleInit() {
    this.db = drizzle(process.env.DATABASE_URL, {
      connection: {
        max: 20, // ✅ Connection pool size
        min: 5,
        idleTimeoutMillis: 30000,
      },
    });
  }
}
```

### 3. Enable Compression

```typescript
// Add compression middleware
const compressionMiddleware = async (ctx: any, next: Function) => {
  // Response compression logic
  return next();
};

const app = WynkFactory.create({
  controllers: [UserController],
});

// Apply globally
```

### 4. Cache Static Assets

Use CDN for static files or configure Nginx caching.

---

## Monitoring & Logging

### Application Logging

```typescript
// src/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: "info", message, meta, timestamp: new Date().toISOString() }));
  },
  error: (message: string, error?: any) => {
    console.error(JSON.stringify({ level: "error", message, error: error?.stack, timestamp: new Date().toISOString() }));
  },
};

// Use in controllers
@Controller("/users")
export class UserController {
  @Post({ path: "/" })
  async create(@Body() body: any) {
    logger.info("Creating user", { email: body.email });
    // ...
  }
}
```

### Health Check Endpoint

```typescript
@Controller("/health")
export class HealthController {
  constructor(private dbService: DatabaseService) {}

  @Get("/")
  async check() {
    try {
      // Check database
      await this.dbService.getDb().execute("SELECT 1");

      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }
}
```

### External Monitoring

- **Sentry** - Error tracking
- **DataDog** - Full observability
- **Prometheus + Grafana** - Metrics
- **PM2 Plus** - Process monitoring

---

## Security Best Practices

### 1. Environment Variables

```bash
# Never commit .env files
# Use secrets management:
# - AWS Secrets Manager
# - HashiCorp Vault
# - Railway/Fly.io secrets
```

### 2. Rate Limiting

```typescript
// middleware/rate-limit.ts
export const rateLimiter = async (ctx: any, next: Function) => {
  // Implement rate limiting
  // Use Redis for distributed rate limiting
  return next();
};
```

### 3. CORS Configuration

```typescript
const corsOptions: CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || [],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
```

### 4. Security Headers

Configure in Nginx or add middleware:

```typescript
const securityHeaders = async (ctx: any, next: Function) => {
  ctx.set.headers["X-Frame-Options"] = "SAMEORIGIN";
  ctx.set.headers["X-Content-Type-Options"] = "nosniff";
  ctx.set.headers["X-XSS-Protection"] = "1; mode=block";
  return next();
};
```

### 5. Input Validation

Always use DTO validation:

```typescript
@Post({ path: "/", body: CreateUserDTO }) // ✅ Validation
async create(@Body() body: CreateUserType) {
  // Input is validated
}
```

---

## Troubleshooting

### Issue: Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: Permission Denied

```bash
# Use port > 1024 or run with sudo
PORT=8080 bun run start
```

### Issue: High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart wynkjs-app
```

### Issue: Database Connection Fails

```typescript
// Add connection retry logic
async onModuleInit() {
  let retries = 5;
  while (retries > 0) {
    try {
      await this.connect();
      break;
    } catch (error) {
      retries--;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
```

---

## Checklist Before Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] CORS configured for production domains
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error monitoring setup
- [ ] Backup strategy in place
- [ ] Rollback plan ready

---

## Resources

- [Bun Documentation](https://bun.sh/docs)
- [PM2 Guide](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Built with ❤️ by the WynkJS Team**
