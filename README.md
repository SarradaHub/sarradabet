# SarradaBet

SarradaBet is a mock betting platform that demonstrates how to combine a TypeScript backend, a React frontend, and shared types in a single Turborepo workspace. The project highlights clean architecture patterns, strong validation, and real time event processing over PostgreSQL.

## Key Features

- Create and manage betting markets, odds, and categories with full CRUD support.
- Capture user votes and mirror the results in near real time on the web client.
- Enforce request validation, rate limiting, and structured error responses.
- Share TypeScript types and helper utilities between the API and the frontend.

## Project Layout

```
sarradabet/
├── apps/
│   ├── api/    # Express API with Prisma and PostgreSQL
│   └── web/    # React application built with Vite and Tailwind CSS
├── packages/
│   └── types/  # Shared TypeScript contracts
├── docs/       # Architectural notes and reference material
└── docker-compose.yml
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the example environment file and adjust secrets:
   ```bash
   cp apps/api/.env.example apps/api/.env
   ```
3. Start the database:
   ```bash
   docker-compose up -d postgres
   ```
4. Run migrations and seed data:
   ```bash
   cd apps/api
   npm run prisma:migrate:dev
   ```
5. Launch the development servers from the repository root:
   ```bash
   npm run dev
   ```

The API listens on `http://localhost:3001` and the web client on `http://localhost:3000`.

## Testing

- API tests:
  ```bash
  cd apps/api
  npm test
  ```
- Web tests:
  ```bash
  cd apps/web
  npm test
  ```

## Security and Observability

- Helmet, CORS configuration, and rate limiting protect the API.
- Validation uses Zod to guarantee contract fidelity.
- Logging is centralized through Winston with request identifiers.

## Contributing

Please open a pull request with proposed changes and include automated test coverage. Contract updates must stay in sync with the shared types and any downstream consumers.
