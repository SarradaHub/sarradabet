# 📚 SarradaBet Documentation

Welcome to the comprehensive documentation for the SarradaBet betting platform. This documentation covers all aspects of the application, from architecture to deployment.

## 📖 Documentation Index

### Getting Started

- **[Main README](../README.md)** - Project overview, quick start, and basic setup
- **[Developer Guide](./DEVELOPER_GUIDE.md)** - Development setup, workflow, and contribution guidelines

### Architecture & Design

- **[Architecture Documentation](./ARCHITECTURE.md)** - Clean architecture, realtime data flow, and patterns
- **[API Documentation](./API.md)** - REST reference, Socket.io events, and schemas

### Feature Implementation Guides

- **[Feature Guides Index](./features/README.md)** - Status matrix, dependency graph, and links to all specs
- **[01 — User Auth & CRUD](./features/01-user-auth-and-crud.md)** - Partial
- **[02 — Coins & Pix Payments](./features/02-coins-and-pix-payments.md)** - Partial
- **[03 — Bet Closure & Payout](./features/03-bet-closure-and-payout.md)** - Planned
- **[04 — Gamification & Rewards](./features/04-gamification-and-rewards.md)** - Planned
- **[05 — Dashboard & Analytics](./features/05-dashboard-and-analytics.md)** - Planned
- **[06 — Mobile App & Advanced Admin](./features/06-mobile-app-and-admin-panel.md)** - Planned

### Deployment & Operations

- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment (Docker/nginx primary)
- **[Performance Guide](./PERFORMANCE.md)** - Caching, pooling, realtime scaling, blackbox validation

## 🚀 Quick Navigation

### For Developers

1. Start with the [Main README](../README.md) or [Developer Guide](./DEVELOPER_GUIDE.md) for setup
2. Review [Architecture Documentation](./ARCHITECTURE.md) for realtime and caching design
3. Use [API Documentation](./API.md) for REST + Socket.io integration

### For DevOps/System Administrators

1. Follow the [Deployment Guide](./DEPLOYMENT.md) for production setup
2. Review [Performance Guide](./PERFORMANCE.md) for Supabase pooling and scaling notes
3. Implement backup and monitoring procedures

### For Product Managers/Business Users

1. Start with the [Main README](../README.md) for feature overview
2. Review the [API Documentation](./API.md) for integration capabilities
3. Check deployment options in the [Deployment Guide](./DEPLOYMENT.md)

## 📋 Documentation Structure

```
docs/
├── README.md              # This index file
├── ARCHITECTURE.md        # System architecture and design patterns
├── API.md                 # REST + Socket.io API documentation
├── DEVELOPER_GUIDE.md     # Development setup and workflow
├── DEPLOYMENT.md          # Production deployment guide
├── PERFORMANCE.md         # Performance, caching, and validation
└── features/              # Implementation guides (prompt specs + codebase map)
    ├── README.md          # Status matrix and dependency graph
    ├── 01-user-auth-and-crud.md
    ├── 02-coins-and-pix-payments.md
    ├── 03-bet-closure-and-payout.md
    ├── 04-gamification-and-rewards.md
    ├── 05-dashboard-and-analytics.md
    └── 06-mobile-app-and-admin-panel.md
```

## 🎯 Key Features Covered

### Backend Architecture

- **Clean Architecture** with separation of concerns
- **Socket.io** realtime layer (`realtime/` — push on vote and bet mutations)
- **Repository / Service / Controller** layers with Prisma ORM
- **In-memory cache** (`node-cache`) for categories and resolved bets
- **Response compression** and slim list DTOs via bet mappers
- **Validation** with Zod; **security** middleware (Helmet, rate limiting, CORS)

### Frontend Architecture

- **React 19** with custom hooks (`useQuery`, `useMutation`, `useSocket`)
- **`RealtimeProvider`** — patches query cache on Socket.io events
- **Optimistic voting** in `OddsList` with rollback on error
- **Lazy-loaded admin routes** and skeleton loaders
- **Shared types** via `@sarradabet/types`

### API Features

- **RESTful API** at `/api/v1` plus **Socket.io** at `/socket.io`
- **Public endpoints** for bets (read), categories, votes; **JWT user auth** with refresh cookies and `UserRole`
- Pagination, filtering, health checks
- **HTTP cache headers** on category list responses

### Testing

- Unit tests for business logic and hooks
- Integration tests for REST bet routes
- Blackbox validation checklist in [Performance Guide](./PERFORMANCE.md)

### Security

- Input validation and sanitization
- Rate limiting and security headers
- CORS configuration (must include frontend origin for Socket.io)
- JWT user authentication with refresh token rotation

### Deployment

- **Docker / nginx / PM2** (primary path in Deployment Guide)
- **Vercel** for web (`apps/web`) and API (`apps/api`) — two projects, separate `vercel.json` per app
- **Render** as an alternative API host
- Database migrations with `DATABASE_URL` + `DIRECT_URL`

## 🔧 Technology Stack

### Backend

- **Node.js** ≥20, **Express.js**, **Socket.io**
- **TypeScript**, **PostgreSQL**, **Prisma ORM**
- **node-cache**, **compression**, **Zod**, **Jest**, **Winston**

### Frontend

- **React** 19, **Vite**, **Tailwind CSS**
- **socket.io-client**, custom query/mutation hooks
- **Vitest**, **React Testing Library**

### Shared

- **`@sarradabet/types`** — `BetListItem`, `BetDetail`, `RealtimeEvents`

### DevOps

- **Docker Compose** (local `db` service on port 5433)
- **Nginx** reverse proxy (including WebSocket upgrade for `/socket.io`)
- **Supabase** connection pooling in production

## 🤝 Contributing

1. Read the [Developer Guide](./DEVELOPER_GUIDE.md)
2. Follow patterns in [Architecture Documentation](./ARCHITECTURE.md)
3. Keep `packages/types` in sync when changing API or realtime contracts
4. Write tests and update docs with your changes

## 📈 Roadmap

### Documentation

- [x] **Performance Optimization Guide** — [PERFORMANCE.md](./PERFORMANCE.md)
- [ ] **Security Best Practices** — comprehensive security guidelines
- [ ] **Monitoring and Alerting** — production monitoring setup
- [ ] **API Versioning Guide** — managing API evolution
- [ ] **Testing Strategies** — advanced testing patterns
- [ ] **CI/CD Pipeline** — automated deployment workflows

### Features

- [x] **Real-time Updates** — Socket.io (see [ARCHITECTURE.md](./ARCHITECTURE.md) and [API.md](./API.md))
- [x] **User Authentication** — partial; see [Feature 01](./features/01-user-auth-and-crud.md)
- [x] **Payment Integration (Pix)** — partial; Mercado Pago; see [Feature 02](./features/02-coins-and-pix-payments.md)
- [x] **Admin Dashboard (basic)** — bets, categories, coin packages; see [Feature 06](./features/06-mobile-app-and-admin-panel.md)
- [ ] **Bet Closure & Payout** — see [Feature 03](./features/03-bet-closure-and-payout.md)
- [ ] **Gamification & Rewards** — see [Feature 04](./features/04-gamification-and-rewards.md)
- [ ] **Advanced Analytics** — see [Feature 05](./features/05-dashboard-and-analytics.md)
- [ ] **Mobile App** — see [Feature 06](./features/06-mobile-app-and-admin-panel.md)

---

**Happy coding!** 🚀

For quick local setup, start with the [Main README](../README.md).
