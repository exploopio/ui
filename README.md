# Next.js 16 Codebase with Keycloak Authentication

Production-ready Next.js 16 application with Keycloak OAuth2/OIDC authentication, backend API integration, and comprehensive security features.

## ✨ Features

### 🔐 Authentication & Security
- **Keycloak OAuth2/OIDC** - Enterprise-grade authentication
- **Secure Cookie Management** - HttpOnly, Secure, SameSite
- **JWT Token Validation** - Automatic token refresh
- **Role-Based Access Control** - Fine-grained permissions
- **Protected Routes** - Middleware-based route protection
- **CSRF Protection** - Cross-site request forgery prevention
- **Security Headers** - CSP, X-Frame-Options, etc.

### 🔌 Backend Integration
- **Type-Safe API Client** - Automatic auth header injection
- **SWR Data Fetching** - Built-in caching and revalidation
- **Error Handling** - Centralized error management
- **Request/Response Interceptors** - Custom request processing
- **Customizable Types** - Match your backend schema

### 🎨 UI & Developer Experience
- **Next.js 16** - Latest App Router with Server Components
- **React 19** - Latest React features
- **TypeScript** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Zustand** - Lightweight state management

### 🧪 Testing & Quality
- **274 Comprehensive Tests** - Unit, integration, edge cases
- **84.28% Code Coverage** - V8 coverage reporting
- **95%+ Critical Coverage** - Auth components fully tested
- **Vitest** - Fast, modern testing framework

### 🚀 Deployment & Monitoring
- **Docker Support** - Multi-stage optimized build
- **Nginx Configuration** - Reverse proxy with SSL/TLS
- **Sentry Integration** - Error tracking (configurable)
- **Health Checks** - Built-in monitoring endpoints
- **Production-Ready** - Environment validation, security hardening

---

## 🛠️ Tech Stack

**Framework & Runtime:**
- Next.js 16.0.8 (App Router)
- React 19
- Node.js 20+

**Authentication:**
- Keycloak (OAuth2/OIDC)
- JWT token validation
- Cookie-based sessions

**UI & Styling:**
- Tailwind CSS 4
- shadcn/ui components
- Radix UI primitives

**State & Data:**
- Zustand (global state)
- SWR (data fetching)
- Zod (validation)

**Testing:**
- Vitest
- React Testing Library
- V8 coverage

**DevOps:**
- Docker
- Nginx
- Sentry (optional)

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Keycloak Server** - [Setup Guide](./docs/auth/KEYCLOAK_SETUP.md)
- **Backend API** (optional) - Your separate backend service

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd codebase-nextjs

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Generate CSRF secret
npm run generate-secret

# Edit .env.local with your values
nano .env.local
```

**Required environment variables:**
```env
# Keycloak Configuration
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=your-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=your-client-id
KEYCLOAK_CLIENT_SECRET=your-client-secret

# Backend API
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:8000

# Security
CSRF_SECRET=<generated-secret>
SECURE_COOKIES=false  # Set to true in production

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Setup Keycloak

Follow the [Keycloak Setup Guide](./docs/auth/KEYCLOAK_SETUP.md) to:
1. Install Keycloak server
2. Create realm and client
3. Configure redirect URIs
4. Get client credentials

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) directory:

### Getting Started
- **[CLAUDE.md](./CLAUDE.md)** - Project architecture & conventions
- **[docs/README.md](./docs/README.md)** - Documentation overview

### Authentication
- **[Keycloak Setup](./docs/auth/KEYCLOAK_SETUP.md)** - Setup Keycloak server
- **[Auth Usage](./docs/auth/AUTH_USAGE.md)** - Implement login, logout, protected routes
- **[API Reference](./docs/auth/API_REFERENCE.md)** - Complete API documentation
- **[Troubleshooting](./docs/auth/TROUBLESHOOTING.md)** - Common issues & solutions

### Backend Integration
- **[API Integration](./docs/API_INTEGRATION.md)** - Connect to your backend API
- **[Customize Types](./docs/CUSTOMIZE_TYPES_GUIDE.md)** - Match your backend schema
- **[Scaling Types](./docs/ORGANIZING_TYPES_AT_SCALE.md)** - Organize for large projects

### Deployment
- **[Production Checklist](./docs/PRODUCTION_CHECKLIST.md)** - Pre-deployment checklist
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - Vercel, Docker, traditional server
- **[Docker & Sentry](./docs/DOCKER_SENTRY_SETUP.md)** - Docker deployment with monitoring

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server (port 3000)

# Building
npm run build            # Create production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript checks
npm test                 # Run tests
npm run test:coverage    # Run tests with coverage
npm run test:ui          # Run tests with UI

# Utilities
npm run generate-secret  # Generate CSRF secret
```

---

## 📁 Project Structure

```
codebase-nextjs/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── (auth)/               # Auth pages (login, register)
│   │   ├── (dashboard)/          # Protected dashboard pages
│   │   └── api/                  # API routes
│   ├── components/               # Shared components
│   │   └── ui/                   # shadcn/ui components
│   ├── features/                 # Feature-based modules
│   │   ├── auth/                 # Authentication feature
│   │   └── dashboard/            # Dashboard feature
│   ├── lib/                      # Shared utilities
│   │   ├── api/                  # API client & hooks
│   │   ├── keycloak/             # Keycloak utilities
│   │   └── cookies.ts            # Cookie management
│   └── stores/                   # Zustand stores
├── docs/                         # Documentation
│   ├── auth/                     # Auth documentation
│   └── examples/                 # Example code
├── scripts/                      # Utility scripts
├── public/                       # Static assets
├── Dockerfile                    # Docker configuration
├── docker-compose.yml            # Docker Compose setup
└── nginx/                        # Nginx configuration
```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run with UI
npm run test:ui

# Watch mode
npm test -- --watch
```

### Coverage Report

Current coverage: **84.28%** overall, **95%+** on critical auth components

```
src/
├── features/auth/        95.2% ✅
├── lib/keycloak/         94.8% ✅
├── stores/auth-store.ts  98.1% ✅
└── Overall               84.28% ✅
```

---

## 🚀 Deployment

### Option 1: Vercel (Recommended for quick deployment)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

See [Deployment Guide](./docs/DEPLOYMENT.md#vercel) for details.

### Option 2: Docker (Recommended for production)

```bash
# Build image
docker-compose build

# Run (development)
docker-compose up

# Run (production)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

See [Docker Setup Guide](./docs/DOCKER_SENTRY_SETUP.md) for details.

### Option 3: Traditional Server

```bash
# Build
npm run build

# Start
npm start
```

See [Deployment Guide](./docs/DEPLOYMENT.md#traditional-server) for details.

### Pre-Deployment Checklist

Before deploying to production, complete the [Production Checklist](./docs/PRODUCTION_CHECKLIST.md):

- [ ] Environment variables configured
- [ ] SECURE_COOKIES=true
- [ ] CSRF_SECRET generated (64+ characters)
- [ ] Keycloak configured with HTTPS
- [ ] Backend API accessible
- [ ] Build passes successfully
- [ ] Tests passing
- [ ] Security headers configured

---

## 🔒 Security

This project implements multiple security layers:

- ✅ **Secure Authentication** - OAuth2/OIDC with Keycloak
- ✅ **Cookie Security** - HttpOnly, Secure, SameSite=Lax
- ✅ **CSRF Protection** - Double-submit cookie pattern
- ✅ **XSS Prevention** - Content Security Policy headers
- ✅ **Clickjacking Protection** - X-Frame-Options
- ✅ **MIME Sniffing Protection** - X-Content-Type-Options
- ✅ **Open Redirect Prevention** - URL validation
- ✅ **Environment Validation** - Build-time checks
- ✅ **Input Validation** - Zod schemas

See [Security Documentation](./docs/auth/KEYCLOAK_SETUP.md#security-considerations) for details.

---

## 🐛 Troubleshooting

### Common Issues

**Authentication errors:**
- See [Troubleshooting Guide](./docs/auth/TROUBLESHOOTING.md)

**API connection issues:**
- Check `NEXT_PUBLIC_BACKEND_API_URL` in `.env.local`
- Verify backend is running
- Check CORS configuration on backend

**Build errors:**
- Ensure all environment variables are set
- Run `npm run type-check` to find TypeScript errors
- Check Node.js version (requires 20+)

**Docker issues:**
- See [Docker Setup Guide](./docs/DOCKER_SENTRY_SETUP.md#troubleshooting)

---

## 📞 Support

- **Documentation:** [docs/README.md](./docs/README.md)
- **Auth Issues:** [docs/auth/TROUBLESHOOTING.md](./docs/auth/TROUBLESHOOTING.md)
- **API Issues:** [docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md)
- **Deployment:** [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 🏗️ Project Status

**Version:** 1.0.0
**Status:** ✅ Production-ready
**Last Updated:** 2025-12-11

### Completed
- ✅ Keycloak authentication
- ✅ Backend API integration
- ✅ Comprehensive testing (274 tests, 84% coverage)
- ✅ Docker deployment
- ✅ Security hardening
- ✅ Complete documentation

### Roadmap
- ⏳ Performance monitoring (Sentry installed, needs configuration)
- ⏳ CI/CD pipeline
- ⏳ Internationalization (i18n)

---

## 📄 License

[Your License Here]

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/)
- [Keycloak](https://www.keycloak.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

**For detailed documentation, see [docs/README.md](./docs/README.md)**
