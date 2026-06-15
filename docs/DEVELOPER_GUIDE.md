# 👨‍💻 SarradaBet Developer Guide

## Getting Started

This guide will help you set up your development environment and understand how to contribute to the SarradaBet project.

## Prerequisites

### Required Software

- **Node.js** 20.0.0 or higher
- **npm** 9.0.0 or higher
- **Docker Desktop** (for database)
- **Git** (for version control)
- **VS Code** (recommended editor)

### VS Code Extensions (Recommended)

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "prisma.prisma",
    "ms-vscode.vscode-json"
  ]
}
```

## Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sarradabet
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the committed example files and adjust secrets if needed:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

#### Backend (`apps/api/.env`)

Key variables (see [`apps/api/.env.example`](../apps/api/.env.example) for the full list):

```env
NODE_ENV=development
PORT=8000
CORS_ORIGINS=http://localhost:3002,http://localhost:5173
DATABASE_URL=postgresql://appuser:sarradabet1234@localhost:5433/sarradabet
DIRECT_URL=postgresql://appuser:sarradabet1234@localhost:5433/sarradabet
JWT_SECRET=dev-jwt-secret-change-me
```

- **`DIRECT_URL`** is required by Prisma (same as `DATABASE_URL` for local Docker; use Supabase direct port `5432` in production).
- **`CORS_ORIGINS`** must include the web dev URL or Socket.io connections will fail.

#### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:8000
```

Use the API **base URL only** — do not append `/api/v1` (the client adds it).

### 4. Database Setup

```bash
# Start PostgreSQL (service name is "db", not "postgres")
docker compose up -d db

# Run migrations
cd apps/api
npm run prisma:migrate:dev

# Seed database (optional)
npm run db:seed:simple
```

### 5. Start Development Servers

```bash
# From project root
npm run dev
```

This will start:

| Service | URL |
|---------|-----|
| Backend API | http://localhost:8000 |
| Frontend | http://localhost:3002 |
| Socket.io | http://localhost:8000/socket.io |
| Database | localhost:5433 |

Vite proxies `/api` and `/socket.io` to the API in dev when using relative URLs. With `VITE_API_URL` set, the client connects directly to the API.

## Project Structure

### Monorepo Overview

```
sarradabet/
├── apps/
│   ├── api/                 # Backend API
│   └── web/                 # Frontend React app
├── packages/
│   └── types/               # @sarradabet/types — shared contracts
├── docs/                    # Documentation
├── docker-compose.yml       # Docker services
├── package.json             # Root package.json
└── turbo.json              # Turborepo configuration
```

### Backend Structure

```
apps/api/
├── src/
│   ├── core/               # Base classes, cache, middleware
│   │   ├── cache/          # node-cache wrapper
│   │   └── middleware/     # Validation, security, cache headers
│   ├── realtime/           # Socket.io server + event emitter
│   ├── modules/            # Feature modules (bet, category, admin)
│   ├── config/             # env, db, consul
│   ├── routes/             # Route aggregation
│   ├── utils/              # Logger, auth helpers
│   ├── app.ts              # Express middleware + REST routes
│   └── server.ts           # HTTP server + Socket.io bootstrap
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── vercel.json             # Vercel install/build (monorepo root npm ci + turbo)
├── __tests__/              # Tests
├── package.json
└── tsconfig.json
```

### Frontend Structure

```
apps/web/
├── src/
│   ├── core/               # Hooks (useQuery, useMutation, useSocket)
│   ├── context/            # RealtimeProvider (Socket.io cache patches)
│   ├── services/           # API services (Axios)
│   ├── hooks/              # Domain hooks (useBets, useCategories)
│   ├── components/         # React components + ui/ skeletons
│   ├── pages/              # HomePage, admin (lazy-loaded)
│   ├── types/              # Re-exports from @sarradabet/types
│   └── utils/              # Utilities
├── public/                 # Static assets
├── vercel.json             # SPA rewrites + asset cache headers
├── __tests__/              # Tests
├── package.json
└── vite.config.ts          # Dev proxy for /api and /socket.io
```

## Development Workflow

### Adding a New Feature

#### 1. Backend Feature Development

**Step 1: Create the Module Structure**

```bash
mkdir -p apps/api/src/modules/your-feature/{repositories,services,controllers,routes,__tests__}
```

**Step 2: Define Types**

```typescript
// apps/api/src/modules/your-feature/types.ts
export interface YourFeature {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateYourFeatureDto {
  name: string;
}

export interface UpdateYourFeatureDto {
  name?: string;
}
```

**Step 3: Create Repository**

```typescript
// apps/api/src/modules/your-feature/repositories/YourFeatureRepository.ts
import { BaseRepository } from "../../../core/base/BaseRepository";
import { YourFeature } from "../types";

export class YourFeatureRepository extends BaseRepository<YourFeature> {
  constructor(prisma: PrismaClient) {
    super(prisma, "yourFeature");
  }

  // Add custom repository methods here
  async findByName(name: string): Promise<YourFeature | null> {
    return this.prisma.yourFeature.findFirst({
      where: { name },
    });
  }
}
```

**Step 4: Create Service**

```typescript
// apps/api/src/modules/your-feature/services/YourFeatureService.ts
import { BaseService } from "../../../core/base/BaseService";
import { YourFeatureRepository } from "../repositories/YourFeatureRepository";
import { CreateYourFeatureDto, UpdateYourFeatureDto } from "../types";

export class YourFeatureService extends BaseService<YourFeature> {
  constructor(private yourFeatureRepository: YourFeatureRepository) {
    super();
  }

  async create(data: CreateYourFeatureDto): Promise<YourFeature> {
    await this.validateBusinessRules(data);
    return this.executeBusinessLogic(() =>
      this.yourFeatureRepository.create(data),
    );
  }

  protected async validateBusinessRules(
    data: CreateYourFeatureDto,
  ): Promise<void> {
    // Add business validation logic
    const existing = await this.yourFeatureRepository.findByName(data.name);
    if (existing) {
      throw new ConflictError("Your feature with this name already exists");
    }
  }
}
```

**Step 5: Create Controller**

```typescript
// apps/api/src/modules/your-feature/controllers/YourFeatureController.ts
import { BaseController } from "../../../core/base/BaseController";
import { YourFeatureService } from "../services/YourFeatureService";
import {
  CreateYourFeatureSchema,
  UpdateYourFeatureSchema,
} from "../validation";

export class YourFeatureController extends BaseController<YourFeature> {
  constructor(private yourFeatureService: YourFeatureService) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    const data = this.parseBody(req, CreateYourFeatureSchema);
    const yourFeature = await this.yourFeatureService.create(data);
    this.sendSuccess(
      res,
      { yourFeature },
      "Your feature created successfully",
      201,
    );
  }

  async list(req: Request, res: Response): Promise<void> {
    const params = this.parseQuery(req, YourFeatureQuerySchema);
    const result = await this.yourFeatureService.findMany(params);
    this.sendSuccess(res, result);
  }
}
```

**Step 6: Create Routes**

```typescript
// apps/api/src/modules/your-feature/routes/your-feature.routes.ts
import { Router } from "express";
import { YourFeatureController } from "../controllers/YourFeatureController";
import { YourFeatureService } from "../services/YourFeatureService";
import { YourFeatureRepository } from "../repositories/YourFeatureRepository";
import {
  validateBody,
  validateQuery,
} from "../../../core/middleware/ValidationMiddleware";
import { CreateYourFeatureSchema, YourFeatureQuerySchema } from "../validation";

export const yourFeatureRoutes = (router: Router): void => {
  const repository = new YourFeatureRepository(prisma);
  const service = new YourFeatureService(repository);
  const controller = new YourFeatureController(service);

  router.get(
    "/your-features",
    validateQuery(YourFeatureQuerySchema),
    controller.list.bind(controller),
  );

  router.post(
    "/your-features",
    validateBody(CreateYourFeatureSchema),
    controller.create.bind(controller),
  );
};
```

**Step 7: Add Validation Schemas**

```typescript
// apps/api/src/modules/your-feature/validation/schemas.ts
import { z } from "zod";

export const CreateYourFeatureSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
});

export const UpdateYourFeatureSchema = CreateYourFeatureSchema.partial();

export const YourFeatureQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});
```

**Step 8: Register Routes**

```typescript
// apps/api/src/routes/index.ts
import { yourFeatureRoutes } from "../modules/your-feature/routes/your-feature.routes";

// Add to existing routes
yourFeatureRoutes(router);
```

#### 2. Frontend Feature Development

**Step 1: Create Service**

```typescript
// apps/web/src/services/YourFeatureService.ts
import { BaseService } from "../core/base/BaseService";
import { YourFeature, CreateYourFeatureDto } from "../types/yourFeature";

export class YourFeatureService extends BaseService {
  async getYourFeatures(
    params?: YourFeatureQueryParams,
  ): Promise<ApiResponse<YourFeature[]>> {
    return this.request<YourFeature[]>("/your-features", { params });
  }

  async createYourFeature(
    data: CreateYourFeatureDto,
  ): Promise<ApiResponse<YourFeature>> {
    return this.request<YourFeature>("/your-features", {
      method: "POST",
      body: data,
    });
  }
}

export const yourFeatureService = new YourFeatureService();
```

**Step 2: Create Custom Hooks**

```typescript
// apps/web/src/hooks/useYourFeatures.ts
import { useQuery, useMutation } from "../core/hooks";
import { yourFeatureService } from "../services/YourFeatureService";
import { YourFeature, CreateYourFeatureDto } from "../types/yourFeature";

export const useYourFeatures = (params?: YourFeatureQueryParams) => {
  return useQuery(
    `your-features-${JSON.stringify(params)}`,
    () => yourFeatureService.getYourFeatures(params),
    { staleTime: 5 * 60 * 1000 }, // 5 minutes
  );
};

export const useCreateYourFeature = () => {
  return useMutation(yourFeatureService.createYourFeature, {
    onSuccess: () => {
      // Refetch or rely on RealtimeProvider if you emit socket events
      // queryCache is updated via RealtimeProvider for bet/vote flows
    },
  });
};
```

**Step 3: Create Components**

```typescript
// apps/web/src/components/YourFeatureCard.tsx
import React from 'react';
import { YourFeature } from '../types/yourFeature';
import { Button } from './ui/Button';

interface YourFeatureCardProps {
  yourFeature: YourFeature;
  onEdit?: (yourFeature: YourFeature) => void;
  onDelete?: (id: number) => void;
}

export const YourFeatureCard: React.FC<YourFeatureCardProps> = ({
  yourFeature,
  onEdit,
  onDelete
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-2">{yourFeature.name}</h3>
      <div className="flex gap-2">
        {onEdit && (
          <Button variant="secondary" onClick={() => onEdit(yourFeature)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button variant="danger" onClick={() => onDelete(yourFeature.id)}>
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};
```

**Step 4: Create Page Component**

```typescript
// apps/web/src/pages/YourFeaturesPage.tsx
import React from 'react';
import { useYourFeatures, useCreateYourFeature } from '../hooks/useYourFeatures';
import { YourFeatureCard } from '../components/YourFeatureCard';
import { Button } from '../components/ui/Button';

export const YourFeaturesPage: React.FC = () => {
  const { data: yourFeatures, loading, error } = useYourFeatures();
  const createYourFeature = useCreateYourFeature();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Features</h1>
        <Button onClick={() => createYourFeature.mutate({ name: 'New Feature' })}>
          Create Feature
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {yourFeatures?.map((yourFeature) => (
          <YourFeatureCard
            key={yourFeature.id}
            yourFeature={yourFeature}
          />
        ))}
      </div>
    </div>
  );
};
```

## Testing

### Backend Testing

**Unit Tests:**

```typescript
// apps/api/src/modules/your-feature/__tests__/YourFeatureService.test.ts
import { YourFeatureService } from "../services/YourFeatureService";
import { YourFeatureRepository } from "../services/YourFeatureRepository";
import { ConflictError } from "../../../core/errors/AppError";

describe("YourFeatureService", () => {
  let service: YourFeatureService;
  let mockRepository: jest.Mocked<YourFeatureRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findByName: jest.fn(),
    } as any;
    service = new YourFeatureService(mockRepository);
  });

  describe("create", () => {
    it("should create a new your feature", async () => {
      const data = { name: "Test Feature" };
      const expectedFeature = {
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue(expectedFeature);

      const result = await service.create(data);

      expect(result).toEqual(expectedFeature);
      expect(mockRepository.create).toHaveBeenCalledWith(data);
    });

    it("should throw ConflictError if feature with same name exists", async () => {
      const data = { name: "Existing Feature" };
      const existingFeature = {
        id: 1,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.findByName.mockResolvedValue(existingFeature);

      await expect(service.create(data)).rejects.toThrow(ConflictError);
    });
  });
});
```

**Integration Tests:**

```typescript
// apps/api/src/__tests__/integration/your-feature.routes.test.ts
import request from "supertest";
import { app } from "../../app";

describe("Your Feature Routes", () => {
  describe("POST /api/v1/your-features", () => {
    it("should create a new your feature", async () => {
      const featureData = { name: "Test Feature" };

      const response = await request(app)
        .post("/api/v1/your-features")
        .set("X-API-Key", "test-api-key")
        .send(featureData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.yourFeature.name).toBe(featureData.name);
    });

    it("should return validation error for invalid data", async () => {
      const invalidData = { name: "" };

      const response = await request(app)
        .post("/api/v1/your-features")
        .set("X-API-Key", "test-api-key")
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveLength(1);
    });
  });
});
```

### Frontend Testing

**Component Tests:**

```typescript
// apps/web/src/components/__tests__/YourFeatureCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { YourFeatureCard } from '../YourFeatureCard';

const mockYourFeature = {
  id: 1,
  name: 'Test Feature',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

describe('YourFeatureCard', () => {
  it('should render your feature name', () => {
    render(<YourFeatureCard yourFeature={mockYourFeature} />);
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = jest.fn();
    render(<YourFeatureCard yourFeature={mockYourFeature} onEdit={onEdit} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(mockYourFeature);
  });
});
```

**Hook Tests:**

```typescript
// apps/web/src/hooks/__tests__/useYourFeatures.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { useYourFeatures } from "../useYourFeatures";
import { yourFeatureService } from "../../services/YourFeatureService";

jest.mock("../../services/YourFeatureService");

describe("useYourFeatures", () => {
  it("should fetch your features", async () => {
    const mockFeatures = [mockYourFeature];
    (yourFeatureService.getYourFeatures as jest.Mock).mockResolvedValue({
      success: true,
      data: mockFeatures,
    });

    const { result } = renderHook(() => useYourFeatures());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockFeatures);
    });
  });
});
```

## Code Style and Standards

### TypeScript

**Strict Configuration:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Naming Conventions:**

- **PascalCase**: Classes, interfaces, types, enums
- **camelCase**: Variables, functions, methods
- **UPPER_SNAKE_CASE**: Constants
- **kebab-case**: File names, URLs

### React

**Component Guidelines:**

- Use functional components with hooks
- Prefer composition over inheritance
- Use TypeScript for all components
- Follow the single responsibility principle

**Hook Guidelines:**

- Use custom hooks for reusable logic
- Keep hooks focused and simple
- Use proper dependency arrays
- Handle loading and error states

### Backend

**Service Guidelines:**

- Keep business logic in services
- Use dependency injection
- Handle errors appropriately
- Write comprehensive tests

**Repository Guidelines:**

- Keep data access logic in repositories
- Use Prisma ORM efficiently
- Handle database errors
- Implement proper pagination

## Git Workflow

### Branch Naming

- `feature/your-feature-name` - New features
- `fix/issue-description` - Bug fixes
- `refactor/component-name` - Code refactoring
- `docs/documentation-update` - Documentation updates

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

**Examples:**

```
feat(bets): add bet creation endpoint
fix(validation): handle empty string validation
docs(api): update endpoint documentation
refactor(services): extract common validation logic
```

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes and Commit**

   ```bash
   git add .
   git commit -m "feat(your-feature): add new functionality"
   ```

3. **Push and Create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

4. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - Include screenshots for UI changes
   - Ensure all tests pass
   - Request code review

## Debugging

### Backend Debugging

**VS Code Debug Configuration:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/server.ts",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

**Database Debugging:**

```bash
# Connect to local database (docker compose service: db)
docker compose exec db psql -U appuser -d sarradabet

# View database logs
docker compose logs db
```
```

### Frontend Debugging

**React DevTools:**

- Install React Developer Tools browser extension
- Use React DevTools Profiler for performance debugging

**Network Debugging:**

- Use browser DevTools Network tab for REST calls
- Check the **WS** filter for the `socket.io` connection
- After voting, expect only `POST /api/v1/votes` — no follow-up `GET /api/v1/bets/:id`
- Monitor Socket.io events: `vote:created`, `bet:created`, `bet:updated`

## Validating Changes (Blackbox)

Quick checks without reading internal code. Full checklist: [Performance Guide](./PERFORMANCE.md#blackbox-validation-checklist).

1. **Two-browser realtime** — open http://localhost:3002 in two windows; vote in one; counts update in both without refresh.
2. **DevTools** — confirm WebSocket to `/socket.io` and no post-vote bet refetch.
3. **REST shape** — `curl http://localhost:8000/api/v1/bets?limit=1` returns slim odds (no `createdAt` on list items).
4. **Cache headers** — `curl -D - http://localhost:8000/api/v1/categories -o /dev/null | grep -i cache-control`
5. **Regression** — `npm run test:api` and `npm run test:web`

## Performance Optimization

See [Performance Guide](./PERFORMANCE.md) for caching TTLs, Supabase pooling, Socket.io scaling, and the blackbox checklist.

Implemented in this codebase:

- **Backend:** `node-cache`, gzip compression, slim bet list DTOs, DB indexes on `categoryId` and `(status, created_at)`
- **Frontend:** Socket.io push (no polling), optimistic votes, lazy admin routes, skeleton loaders, query cache with stale-while-revalidate

## Common Issues and Solutions

### Backend Issues

**Database Connection Issues:**

```bash
# Check if PostgreSQL is running
docker compose ps db

# Restart database
docker compose restart db

# Reset database
docker compose down -v
docker compose up -d db
```

**TypeScript Compilation Errors:**

```bash
# Clear build cache
rm -rf apps/api/dist
rm -rf node_modules/.cache

# Rebuild
npm run build
```

### Frontend Issues

**Build Errors:**

```bash
# Clear cache
rm -rf apps/web/dist
rm -rf node_modules/.vite

# Reinstall dependencies
npm install
```

**Hot Reload Issues:**

```bash
# Restart dev server
npm run dev
```

## Resources

### Documentation

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

### Tools

- [VS Code](https://code.visualstudio.com/)
- [Postman](https://www.postman.com/) (API testing)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Learning Resources

- [Clean Architecture Book](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [React Patterns](https://reactpatterns.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

Happy coding! 🚀 If you have any questions or need help, don't hesitate to ask in the project's issue tracker or reach out to the development team.
