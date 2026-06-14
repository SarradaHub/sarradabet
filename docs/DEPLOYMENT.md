# 🚀 SarradaBet Deployment Guide

## Overview

This guide covers deploying the SarradaBet application to production. The stack includes an Express API with **Socket.io**, a React frontend, and PostgreSQL. For local development setup, see the [Main README](../README.md).

**Default API port:** `8000` (configurable via `PORT`).

## Deployment Options

### 1. Docker Deployment (Recommended)

### 2. Manual Server Deployment

### 3. Cloud Platform Deployment

## Docker Deployment

### Prerequisites

- Docker and Docker Compose installed
- Domain name (optional)
- SSL certificate (for HTTPS)

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    container_name: sarradabet-postgres
    environment:
      POSTGRES_DB: sarradabet_prod
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backup:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    container_name: sarradabet-api
    environment:
      NODE_ENV: production
      PORT: 8000
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/sarradabet_prod
      DIRECT_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/sarradabet_prod
      CORS_ORIGINS: ${CORS_ORIGINS}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    container_name: sarradabet-web
    environment:
      VITE_API_URL: ${VITE_API_URL}
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: sarradabet-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - web
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

### Backend Dockerfile

Create `apps/api/Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/health-check.js

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### Frontend Dockerfile

Create `apps/web/Dockerfile`:

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
upstream api {
    server api:8000;
}

upstream web {
    server web:80;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Routes
    location /api/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Socket.io (realtime)
    location /socket.io/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check
    location /health {
        proxy_pass http://api;
        access_log off;
    }

    # Frontend Routes
    location / {
        proxy_pass http://web;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}

# Rate limiting
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
}
```

### Environment Variables

Create `.env.prod`:

```env
# Database (Prisma)
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/sarradabet_prod
DIRECT_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/sarradabet_prod

# API
JWT_SECRET=your_jwt_secret_key_here
PORT=8000

# CORS (must include your frontend origin for Socket.io)
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Frontend build — API base URL only (no /api/v1 suffix)
VITE_API_URL=https://api.your-domain.com
```

### Deployment Commands

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Run database migrations
docker-compose -f docker-compose.prod.yml exec api npm run prisma:migrate:deploy

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Update services
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Manual Server Deployment

### Server Requirements

- Ubuntu 20.04+ or CentOS 8+
- 2GB RAM minimum (4GB recommended)
- 20GB disk space
- Node.js 18+
- PostgreSQL 13+
- Nginx

### Server Setup

#### 1. Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 for process management
sudo npm install -g pm2
```

#### 2. Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE sarradabet_prod;
CREATE USER sarradabet_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sarradabet_prod TO sarradabet_user;
\q
```

#### 3. Application Deployment

```bash
# Clone repository
git clone <repository-url> /var/www/sarradabet
cd /var/www/sarradabet

# Install dependencies
npm install

# Build applications
npm run build

# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit environment files with production values
nano apps/api/.env
nano apps/web/.env

# Run database migrations
cd apps/api
npm run prisma:migrate:deploy
```

#### 4. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "sarradabet-api",
      script: "apps/api/dist/server.js",
      cwd: "/var/www/sarradabet",
      env: {
        NODE_ENV: "production",
        PORT: 8000,
      },
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "1G",
      error_file: "/var/log/pm2/sarradabet-api-error.log",
      out_file: "/var/log/pm2/sarradabet-api-out.log",
      log_file: "/var/log/pm2/sarradabet-api-combined.log",
      time: true,
    },
  ],
};
```

Start applications:

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

#### 5. Nginx Configuration

Create `/etc/nginx/sites-available/sarradabet`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8000;
        access_log off;
    }

    # Frontend
    location / {
        root /var/www/sarradabet/apps/web/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

Enable site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sarradabet /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Cloud Platform Deployment

### AWS Deployment

#### Using AWS ECS with Fargate

1. **Create ECS Cluster**
2. **Create Task Definitions**
3. **Create Services**
4. **Setup Application Load Balancer**
5. **Configure RDS PostgreSQL**

#### Using AWS Elastic Beanstalk

1. **Create Beanstalk Application**
2. **Deploy Backend**
3. **Deploy Frontend to S3 + CloudFront**
4. **Configure RDS**

### Google Cloud Platform

#### Using Cloud Run

1. **Build and push Docker images**
2. **Deploy to Cloud Run**
3. **Setup Cloud SQL**
4. **Configure Load Balancer**

### Heroku Deployment

#### Backend Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create sarradabet-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set API_KEY=your_api_key
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main

# Run migrations
heroku run npm run prisma:migrate:deploy
```

#### Frontend Deployment

```bash
# Create separate Heroku app for frontend
heroku create sarradabet-web

# Set environment variables
heroku config:set VITE_API_URL=https://sarradabet-api.herokuapp.com

# Deploy
git subtree push --prefix apps/web heroku main
```

## Monitoring and Maintenance

### Health Checks

#### Application Health Check

Create `apps/api/src/health-check.js`:

```javascript
const http = require("http");

const options = {
  hostname: "localhost",
  port: process.env.PORT || 8000,
  path: "/health",
  method: "GET",
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

req.on("error", () => {
  process.exit(1);
});

req.end();
```

### Logging

#### Application Logs

```bash
# View PM2 logs
pm2 logs sarradabet-api

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
```

### Database Backup

#### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/backup"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="sarradabet_prod"
DB_USER="sarradabet_user"

# Create backup
pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove backups older than 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

#### Cron Job for Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Performance Monitoring

#### Using PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-server-monit

# View monitoring dashboard
pm2 monit
```

#### Database Monitoring

```bash
# Monitor database connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Monitor database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('sarradabet_prod'));"
```

### Security Updates

#### Regular Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js packages
npm audit
npm audit fix

# Update Docker images
docker-compose pull
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Application Won't Start

```bash
# Check logs
pm2 logs sarradabet-api
docker-compose logs api

# Check environment variables
pm2 env sarradabet-api
docker-compose exec api env

# Check database connection
pm2 logs sarradabet-api | grep database
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check database connectivity
psql -h localhost -U sarradabet_user -d sarradabet_prod

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

#### Nginx Issues

```bash
# Test configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Performance Issues

#### High CPU Usage

```bash
# Check process usage
top
htop

# Check PM2 processes
pm2 monit

# Check database queries
sudo -u postgres psql -c "SELECT query, state, query_start FROM pg_stat_activity WHERE state = 'active';"
```

#### Memory Issues

```bash
# Check memory usage
free -h
pm2 monit

# Restart application if needed
pm2 restart sarradabet-api
```

## Rollback Procedures

### Application Rollback

```bash
# Git rollback
git log --oneline
git checkout <previous-commit-hash>

# Rebuild and restart
npm run build
pm2 restart sarradabet-api

# Database rollback (if needed)
npm run prisma:migrate:rollback
```

### Docker Rollback

```bash
# Check available images
docker images

# Rollback to previous image
docker-compose down
docker-compose up -d --scale api=0
docker-compose up -d
```

## Alternative: Render + Vercel

For managed hosting without self-managed Docker/nginx:

### API (Render)

- **Root directory:** `apps/api`
- **Build:** `npm install && npm run build && npm run prisma:generate`
- **Start:** `npm run start`
- **Environment:**
  - `DATABASE_URL` — Supabase pooler (`6543?pgbouncer=true`)
  - `DIRECT_URL` — Supabase direct (`5432`, migrations)
  - `CORS_ORIGINS` — your Vercel frontend URL
  - `JWT_SECRET`, `PORT` (Render sets `PORT` automatically)
- **WebSockets:** supported on a single Render web service; see [PERFORMANCE.md](./PERFORMANCE.md) for multi-instance Redis adapter.

### Web (Vercel)

The web app depends on `@sarradahub/design-system` from the sibling [`SarradaHub/platform`](https://github.com/SarradaHub/platform) repo. Vercel must clone that repo before install/build (handled by [`scripts/clone-platform.sh`](../scripts/clone-platform.sh)).

**Option A — monorepo root (recommended, matches Turborepo):**

- **Root directory:** `.` (repository root)
- **Install / build / output:** defined in root [`vercel.json`](../vercel.json) — clones platform, builds design-system, then `turbo run build --filter=web`
- **Output directory:** `apps/web/dist`

**Option B — web app only:**

- **Root directory:** `apps/web`
- **Install / build / output:** defined in [`apps/web/vercel.json`](../apps/web/vercel.json)

**Environment:** `VITE_API_URL=https://your-api.onrender.com` (no `/api/v1` suffix)

If the Vercel project dashboard overrides **Install Command** or **Build Command**, remove those overrides so `vercel.json` settings apply (or set them to the same values). A bare `turbo run build` without cloning platform will fail with `Cannot find module '@sarradahub/design-system'`.

### Migrations

Run `npm run prisma:migrate:deploy` in CI or a one-off Render shell with `DATABASE_URL` and `DIRECT_URL` set (see [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)).

## Security Considerations

### Production Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall
- [ ] Install SSL certificates
- [ ] Configure security headers
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] Backup encryption
- [ ] Monitoring and alerting
- [ ] Access logging

### Firewall Configuration

```bash
# Install UFW
sudo apt install ufw -y

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

This deployment guide provides comprehensive instructions for deploying SarradaBet to production environments. Choose the deployment method that best fits your infrastructure and requirements.
