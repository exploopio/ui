# Project Documentation

Complete documentation for the Next.js 16 application with Keycloak authentication and backend API integration.

## 📁 Documentation Structure

```
docs/
├── README.md                        # This file - documentation overview
├── ARCHITECTURE.md                  # System architecture (frontend + backend)
├── API_INTEGRATION.md               # Complete API client integration guide
├── ENVIRONMENT_VARIABLES.md         # Environment variables guide (NEXT_PUBLIC_* vs server-only)
├── CUSTOMIZE_TYPES_GUIDE.md         # How to customize types for your backend
├── ORGANIZING_TYPES_AT_SCALE.md     # Scaling types for large projects
├── DEPLOYMENT.md                    # Production deployment guide
├── DOCKER_SENTRY_SETUP.md           # Docker & Sentry error tracking setup
├── PRODUCTION_CHECKLIST.md          # Pre-deployment checklist
├── auth/                            # Authentication documentation
│   ├── README.md                    # Auth docs overview
│   ├── KEYCLOAK_SETUP.md            # Keycloak setup guide
│   ├── AUTH_USAGE.md                # Usage examples
│   ├── API_REFERENCE.md             # API documentation
│   ├── MIGRATION_GUIDE.md           # Migration from old auth
│   └── TROUBLESHOOTING.md           # Common issues & solutions
└── examples/                        # Example/template files
    ├── README.md                    # Examples overview
    └── types.custom.example.ts      # Type customization examples
```

---

## 🚀 Quick Start

### For New Developers

**1. Setup Project**
1. Read root [CLAUDE.md](../CLAUDE.md) - Project overview & architecture
2. Read root [README.md](../README.md) - Setup instructions
3. Configure environment variables

**2. Setup Authentication**
1. [auth/KEYCLOAK_SETUP.md](./auth/KEYCLOAK_SETUP.md) - Setup Keycloak server
2. [auth/AUTH_USAGE.md](./auth/AUTH_USAGE.md) - Implement login/logout
3. [auth/API_REFERENCE.md](./auth/API_REFERENCE.md) - API reference

**3. Connect to Backend**
1. [API_INTEGRATION.md](./API_INTEGRATION.md) - Setup API client
2. [CUSTOMIZE_TYPES_GUIDE.md](./CUSTOMIZE_TYPES_GUIDE.md) - Customize types

**4. Deploy to Production**
1. [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-deployment checklist
2. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
3. [DOCKER_SENTRY_SETUP.md](./DOCKER_SENTRY_SETUP.md) - Docker & monitoring

---

## 📚 Documentation by Topic

### 🏗️ Architecture & Setup

**[ARCHITECTURE.md](./ARCHITECTURE.md)**
- System architecture overview
- Frontend + Backend interaction
- Authentication flow
- State management
- Feature-based structure

### 🔐 Authentication (Keycloak)

**Location:** [`/docs/auth/`](./auth/)

Complete Keycloak OAuth2/OIDC integration:
- **[Setup Guide](./auth/KEYCLOAK_SETUP.md)** - Configure Keycloak server and client
- **[Usage Guide](./auth/AUTH_USAGE.md)** - Implement login, logout, protected routes, roles
- **[API Reference](./auth/API_REFERENCE.md)** - Complete function and type documentation
- **[Migration Guide](./auth/MIGRATION_GUIDE.md)** - Migrate from old authentication
- **[Troubleshooting](./auth/TROUBLESHOOTING.md)** - Solutions to common problems

**Start here:** [auth/README.md](./auth/README.md)

### 🔧 Environment Variables

**[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)**
- Understanding `NEXT_PUBLIC_*` vs server-only variables
- Security implications of each type
- Request flow: Browser → Next.js → Backend
- Code examples for API routes and client code
- Common mistakes and how to avoid them

### 🔌 Backend API Integration

**[API_INTEGRATION.md](./API_INTEGRATION.md)**
- Setup HTTP client with auto auth headers
- Configure SWR hooks for data fetching
- Error handling & retry logic
- Request/response interceptors
- Backend requirements

**[CUSTOMIZE_TYPES_GUIDE.md](./CUSTOMIZE_TYPES_GUIDE.md)**
- Match TypeScript types to your backend schema
- Override default types
- Add custom endpoints
- Extend API client

**[ORGANIZING_TYPES_AT_SCALE.md](./ORGANIZING_TYPES_AT_SCALE.md)**
- Organize types for large projects (50+ types)
- Domain-driven structure
- Feature-based organization
- Code generation strategies

### 🚀 Deployment & Production

**[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)**
- Pre-deployment checklist
- Environment configuration
- Security verification
- Performance optimization

**[DEPLOYMENT.md](./DEPLOYMENT.md)**
- Deploy to Vercel
- Deploy with Docker
- Deploy to traditional server
- Nginx configuration
- SSL/TLS setup

**[DOCKER_SENTRY_SETUP.md](./DOCKER_SENTRY_SETUP.md)**
- Docker multi-stage build
- Production deployment
- Sentry error tracking
- Health checks & monitoring

---

## 🔍 Quick Reference

### Common Tasks

| Task | Documentation |
|------|---------------|
| **Setup project** | [README.md](../README.md) |
| **Understand architecture** | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| **Configure env variables** | [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) |
| **Add login/logout** | [auth/AUTH_USAGE.md](./auth/AUTH_USAGE.md) |
| **Protect a route** | [auth/AUTH_USAGE.md#protected-routes](./auth/AUTH_USAGE.md#protected-routes) |
| **Check user roles** | [auth/AUTH_USAGE.md#role-based-access](./auth/AUTH_USAGE.md#role-based-access) |
| **Call backend API** | [API_INTEGRATION.md](./API_INTEGRATION.md) |
| **Customize types** | [CUSTOMIZE_TYPES_GUIDE.md](./CUSTOMIZE_TYPES_GUIDE.md) |
| **Fix auth errors** | [auth/TROUBLESHOOTING.md](./auth/TROUBLESHOOTING.md) |
| **Deploy to production** | [DEPLOYMENT.md](./DEPLOYMENT.md) |

### By Role

**Frontend Developers:**
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
2. [auth/AUTH_USAGE.md](./auth/AUTH_USAGE.md) - Implement auth
3. [API_INTEGRATION.md](./API_INTEGRATION.md) - Call backend APIs

**Backend Developers:**
1. [auth/KEYCLOAK_SETUP.md](./auth/KEYCLOAK_SETUP.md) - Setup Keycloak
2. [auth/API_REFERENCE.md](./auth/API_REFERENCE.md) - Token validation
3. [API_INTEGRATION.md#backend-requirements](./API_INTEGRATION.md#backend-requirements) - API requirements

**DevOps:**
1. [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Pre-deployment
2. [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment options
3. [DOCKER_SENTRY_SETUP.md](./DOCKER_SENTRY_SETUP.md) - Docker & monitoring

---

## 📖 External Resources

- **Next.js 16:** https://nextjs.org/docs
- **React 19:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **Zustand:** https://zustand-demo.pmnd.rs
- **Keycloak:** https://www.keycloak.org/documentation
- **SWR:** https://swr.vercel.app
- **Docker:** https://docs.docker.com
- **Sentry:** https://docs.sentry.io

---

## 📊 Project Status

### ✅ Completed Features

- **Authentication & Security**
  - Keycloak OAuth2/OIDC integration
  - Secure cookie management (HttpOnly, Secure, SameSite)
  - JWT token validation & refresh
  - Role-based access control
  - Protected routes middleware
  - CSRF protection

- **Backend API Integration**
  - Type-safe HTTP client
  - SWR hooks for data fetching
  - Automatic auth header injection
  - Error handling & retry logic
  - Customizable types system

- **Testing & Quality**
  - 274 comprehensive tests
  - 84.28% overall code coverage
  - 95%+ coverage on critical components
  - Unit, integration, and edge case tests

- **Deployment & Monitoring**
  - Docker multi-stage build
  - Nginx reverse proxy
  - SSL/TLS configuration
  - Sentry error tracking
  - Health checks
  - Production-ready configuration

### 📈 Documentation Coverage

- ✅ Authentication: 100%
- ✅ API Integration: 100%
- ✅ Architecture: 100%
- ✅ Deployment: 100%
- ✅ Testing: 100%

---

## 🎓 Learning Path

**Week 1: Setup & Authentication**
```
Day 1-2: Project setup
├─ Read README.md
├─ Read CLAUDE.md
└─ Setup development environment

Day 3-5: Authentication
├─ Read auth/README.md
├─ Setup Keycloak (auth/KEYCLOAK_SETUP.md)
├─ Implement login/logout (auth/AUTH_USAGE.md)
└─ Test authentication flow
```

**Week 2: Backend Integration**
```
Day 1-3: API Client
├─ Read API_INTEGRATION.md
├─ Configure API client
└─ Test API calls

Day 4-5: Types & Customization
├─ Read CUSTOMIZE_TYPES_GUIDE.md
├─ Customize types for your backend
└─ Implement feature with API calls
```

**Week 3: Production Deployment**
```
Day 1-2: Preparation
├─ Read PRODUCTION_CHECKLIST.md
├─ Complete checklist items
└─ Test production build

Day 3-5: Deployment
├─ Read DEPLOYMENT.md
├─ Setup Docker (optional)
├─ Configure monitoring (DOCKER_SENTRY_SETUP.md)
└─ Deploy to production
```

---

## 🆘 Getting Help

### Documentation Issues

If documentation is unclear, outdated, or missing:
- Open an issue with appropriate label
- Contact team via Slack/email
- Check troubleshooting guide

### Code Issues

- **Authentication errors**: [auth/TROUBLESHOOTING.md](./auth/TROUBLESHOOTING.md)
- **API errors**: [API_INTEGRATION.md#error-handling](./API_INTEGRATION.md#error-handling)
- **Deployment issues**: [DEPLOYMENT.md#troubleshooting](./DEPLOYMENT.md#troubleshooting)
- **Other bugs**: Open an issue on GitHub

---

**Last Updated:** 2025-12-11

**Version:** 1.0.0

**Status:** ✅ Production-ready
