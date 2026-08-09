# SarradaBet Documentation

Documentation for the SarradaBet betting platform: architecture, API reference, deployment, and planned work.

## Start here

- **[Main README](../README.md)** — clone, install, `npm run dev`
- **[Developer Guide](./DEVELOPER_GUIDE.md)** — env, Docker (`db` + `redis`), tests, conventions

## Reference (shipped behavior)

- **[API](./API.md)** — REST + Socket.io contracts
- **[Architecture](./ARCHITECTURE.md)** — Clean Architecture, modules, realtime, caching
- **[Performance](./PERFORMANCE.md)** — indexes, Redis, pooling, validation checklist

## Operations

- **[Deployment](./DEPLOYMENT.md)** — Vercel/Render (primary); optional self-hosted templates
- **[Local Mercado Pago webhooks](./LOCAL_WEBHOOKS.md)** — ngrok + real Pix testing

## Planned work

- **[Roadmap](./ROADMAP.md)** — single source of truth for unshipped items
- **[Feature 06 — Mobile & advanced admin](./features/06-mobile-app-and-admin-panel.md)**
- **[Action plans](./action-plans/)** — granular implementation specs (social login, dark mode, etc.)

## Documentation structure

```
docs/
├── README.md              # This index
├── ROADMAP.md             # Planned work only
├── API.md                 # REST + Socket.io
├── ARCHITECTURE.md        # System design
├── DEVELOPER_GUIDE.md     # Setup and workflow
├── DEPLOYMENT.md          # Production deployment
├── PERFORMANCE.md         # Caching, scaling, validation
├── LOCAL_WEBHOOKS.md      # Mercado Pago local testing
├── features/
│   ├── README.md          # Feature 06 only
│   └── 06-mobile-app-and-admin-panel.md
└── action-plans/          # Agent-executable plans
    ├── README.md
    └── 01–06-*.md
```

## Contributing to docs

1. **Shipped behavior** → update living refs (`API.md`, `ARCHITECTURE.md`, etc.).
2. **New planned work** → add to [ROADMAP.md](./ROADMAP.md) and optionally an action plan.
3. **Completed plan** → remove from ROADMAP; trim or delete the action-plan file.
4. Keep `packages/types` in sync when changing API or realtime contracts.

See [Developer Guide](./DEVELOPER_GUIDE.md) for the full contribution workflow.
