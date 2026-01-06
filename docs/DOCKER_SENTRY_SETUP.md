# Docker & Sentry Setup Guide

**Last Updated:** 2025-12-11

Complete guide for setting up Docker deployment and Sentry error reporting.

---

## Table of Contents

- [Docker Setup](#docker-setup)
- [Sentry Setup](#sentry-setup)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Docker Setup

### Prerequisites

- Docker installed (v20.10+)
- Docker Compose installed (v2.0+)

```bash
# Check versions
docker --version
docker-compose --version
```

### Step 1: Configure Environment Variables

Create `.env.production` file:

```bash
# Copy from example
cp .env.example .env.production

# Edit with your production values
nano .env.production
```

Required variables:
```env
# Keycloak
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.your-domain.com
NEXT_PUBLIC_KEYCLOAK_REALM=production
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=nextjs-client
KEYCLOAK_CLIENT_SECRET=<from-keycloak>
NEXT_PUBLIC_KEYCLOAK_REDIRECT_URI=https://your-app.com/auth/callback

# Backend API
NEXT_PUBLIC_BACKEND_API_URL=https://api.your-domain.com
BACKEND_API_URL=https://api.your-domain.com

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.com

# Security
SECURE_COOKIES=true
CSRF_SECRET=<from-npm-run-generate-secret>

# Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Step 2: Build Docker Image

```bash
# Build image
docker-compose build

# Or build with specific env file
docker-compose --env-file .env.production build
```

### Step 3: Run Container

```bash
# Development (with port exposed)
docker-compose up

# Production (with Nginx reverse proxy)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose logs -f nextjs
```

### Step 4: Setup Nginx (Production)

#### Option A: Self-Signed Certificate (Development)

```bash
# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

#### Option B: Let's Encrypt (Production)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Copy certificates to nginx/ssl/ directory
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

#### Configure Nginx

Edit `nginx/nginx.conf`:
```nginx
# Line 72 & 78: Update domain name
server_name your-domain.com www.your-domain.com;

# Lines 87-88: Update certificate paths (if different)
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

Restart Nginx:
```bash
docker-compose restart nginx
```

### Step 5: Verify Deployment

```bash
# Check containers are running
docker-compose ps

# Test health check
curl http://localhost:3000/api/health

# Test with Nginx (if configured)
curl https://your-domain.com/api/health
```

---

## Sentry Setup

### Step 1: Create Sentry Project

1. Go to [sentry.io](https://sentry.io)
2. Sign up / Log in
3. Create new project
4. Choose "Next.js" as platform
5. Copy the DSN (Data Source Name)

### Step 2: Install Sentry SDK

```bash
# Install Sentry package
npm install --save @sentry/nextjs

# Or with yarn
yarn add @sentry/nextjs
```

### Step 3: Configure Environment

Add to `.env.local` (development) or `.env.production`:

```env
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

**Important:** The DSN is public and can be exposed to the browser.

### Step 4: Sentry Configuration Files

Already created:
- ✅ `sentry.client.config.ts` - Browser-side config
- ✅ `sentry.server.config.ts` - Server-side config
- ✅ `sentry.edge.config.ts` - Edge runtime config
- ✅ `instrumentation.ts` - Initialization
- ✅ `src/lib/error-reporting.ts` - Error reporting utility

### Step 5: Test Sentry Integration

#### Test Client-Side Error

Create test component `src/app/test-sentry/page.tsx`:

```typescript
'use client'

export default function TestSentryPage() {
  return (
    <button onClick={() => {
      throw new Error('Test client error')
    }}>
      Throw Client Error
    </button>
  )
}
```

#### Test Server-Side Error

Create API route `src/app/api/test-sentry/route.ts`:

```typescript
export async function GET() {
  throw new Error('Test server error')
}
```

#### Test with Error Reporting Utility

```typescript
import { reportError } from '@/lib/error-reporting'

try {
  // ... code
} catch (error) {
  reportError(error, {
    context: 'User action',
    level: 'error',
    user: {
      id: 'user-123',
      email: 'user@example.com',
    },
  })
}
```

### Step 6: Verify in Sentry Dashboard

1. Trigger errors (click button, visit API route)
2. Go to Sentry dashboard
3. Check "Issues" tab
4. Verify errors appear with:
   - Error message
   - Stack trace
   - User context
   - Environment info

---

## Docker + Sentry Combined

### Build with Sentry

```bash
# Set Sentry DSN in environment
export NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Build Docker image
docker-compose build

# Run with Sentry enabled
docker-compose up
```

### Environment File Setup

`.env.production`:
```env
# ... other vars ...
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

### Verify Both Working

```bash
# 1. Check Docker container running
docker-compose ps

# 2. Check Sentry initialization
docker-compose logs nextjs | grep -i sentry

# 3. Trigger test error
curl http://localhost:3000/api/test-sentry

# 4. Check Sentry dashboard for error
```

---

## Testing

### Docker Testing

```bash
# Build test
docker-compose build

# Run test
docker-compose up -d

# Health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok","timestamp":"...","environment":"production"}

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Sentry Testing

#### 1. Development Test
```bash
# Set DSN
export NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...

# Run dev server
npm run dev

# Visit test pages
# http://localhost:3000/test-sentry
```

#### 2. Production Test
```bash
# Build with Sentry
npm run build

# Start production server
npm start

# Trigger errors
# Check Sentry dashboard
```

#### 3. Using Error Reporting Utility
```typescript
// In any component or function
import { reportError, reportWarning } from '@/lib/error-reporting'

// Report error
reportError(new Error('Something went wrong'), {
  context: 'Payment processing',
  level: 'error',
  metadata: {
    orderId: '12345',
    amount: 99.99,
  },
  user: {
    id: userId,
    email: userEmail,
  },
})

// Report warning
reportWarning('Rate limit approaching', {
  context: 'API calls',
  metadata: {
    remaining: 10,
    limit: 100,
  },
})
```

---

## Troubleshooting

### Docker Issues

#### "Port 3000 already in use"

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
docker-compose up -p 3001:3000
```

#### "Permission denied" errors

```bash
# Fix npm cache permissions
sudo chown -R $(whoami) ~/.npm

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

#### Container won't start

```bash
# Check logs
docker-compose logs nextjs

# Common issues:
# 1. Missing environment variables
# 2. Build errors
# 3. Port conflicts

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

#### Nginx SSL errors

```bash
# Check certificate files exist
ls -la nginx/ssl/

# Generate self-signed cert if missing
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Test Nginx config
docker-compose exec nginx nginx -t
```

### Sentry Issues

#### "Sentry not capturing errors"

1. **Check DSN is set:**
   ```bash
   echo $NEXT_PUBLIC_SENTRY_DSN
   ```

2. **Check Sentry initialized:**
   ```bash
   # Should see Sentry initialization logs
   docker-compose logs | grep -i sentry
   ```

3. **Check error is being reported:**
   ```typescript
   // Add console.log to verify
   reportError(error, { context: 'test' })
   console.log('Error reported to Sentry')
   ```

4. **Check Sentry dashboard quota:**
   - Free tier has limits
   - Check project settings

#### "Sentry package not found"

```bash
# Install Sentry
npm install --save @sentry/nextjs

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### "Source maps not working"

Next.js automatically uploads source maps if configured. Check:

1. `sentry.client.config.ts` has correct DSN
2. Build completes successfully
3. Sentry project settings allow source maps

---

## Production Checklist

### Before Deploying

- [ ] Environment variables configured in `.env.production`
- [ ] Sentry DSN added
- [ ] CSRF secret generated
- [ ] SECURE_COOKIES=true
- [ ] SSL certificates ready (production)
- [ ] Keycloak configured with production URLs
- [ ] Backend API accessible

### Docker

- [ ] Dockerfile builds successfully
- [ ] docker-compose.yml configured
- [ ] Environment file (.env.production) created
- [ ] Image built: `docker-compose build`
- [ ] Container runs: `docker-compose up -d`
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] Nginx configured (if using)
- [ ] SSL certificates installed (production)

### Sentry

- [ ] Sentry project created
- [ ] SDK installed: `npm install @sentry/nextjs`
- [ ] DSN configured
- [ ] Config files in place
- [ ] Test errors sent successfully
- [ ] Source maps uploaded (automatic)
- [ ] Alerts configured
- [ ] Team members added to Sentry project

---

## Useful Commands

### Docker

```bash
# Build
docker-compose build
docker-compose build --no-cache  # Force rebuild

# Run
docker-compose up                # Foreground
docker-compose up -d             # Background
docker-compose up --build        # Build and run

# Logs
docker-compose logs              # All logs
docker-compose logs -f nextjs    # Follow Next.js logs
docker-compose logs --tail=100   # Last 100 lines

# Stop
docker-compose stop              # Stop containers
docker-compose down              # Stop and remove
docker-compose down -v           # Stop, remove, and delete volumes

# Exec into container
docker-compose exec nextjs sh    # Shell access

# Resource usage
docker stats                     # Real-time stats
docker-compose ps                # Running containers
```

### Sentry

```bash
# Test error reporting
npm run build && npm start
# Visit /test-sentry or /api/test-sentry

# View Sentry logs
docker-compose logs | grep -i sentry

# Check Sentry initialization
# Look for: "[Sentry] Initialized"
```

---

## Next Steps

1. **Deploy to production:**
   - Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
   - Use production environment file
   - Enable Nginx reverse proxy
   - Configure SSL certificates

2. **Monitor errors:**
   - Check Sentry dashboard daily
   - Setup alerts for critical errors
   - Review error patterns
   - Fix high-frequency issues

3. **Optimize:**
   - Monitor Docker resource usage
   - Adjust rate limiting
   - Tune Sentry sample rates
   - Setup performance monitoring

---

## Support

**Docker Issues:**
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

**Sentry Issues:**
- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Support](https://sentry.io/support/)

**Project Issues:**
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- [docs/auth/TROUBLESHOOTING.md](docs/auth/TROUBLESHOOTING.md)

---

**Last Updated:** 2025-12-11
**Version:** 1.0.0
