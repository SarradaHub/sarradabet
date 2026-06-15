# 🏗️ SarradaBet Architecture Documentation

## Overview

SarradaBet follows **Clean Architecture** principles with a **Socket.io realtime layer** for push updates on votes and bet mutations. Shared contracts live in `@sarradabet/types` (`packages/types`).

## Architecture Principles

### Clean Architecture Layers

```
┌─────────────────────────────────────┐
│           Presentation Layer        │  ← Controllers, Routes, Middleware
├─────────────────────────────────────┤
│            Application Layer        │  ← Use Cases, Services
├─────────────────────────────────────┤
│             Domain Layer            │  ← Entities, Business Rules
├─────────────────────────────────────┤
│          Infrastructure Layer       │  ← Database, External APIs
└─────────────────────────────────────┘
```

### Key Principles

1. **Dependency Inversion**: High-level modules don't depend on low-level modules
2. **Single Responsibility**: Each class/module has one reason to change
3. **Open/Closed**: Open for extension, closed for modification
4. **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
5. **Dependency Injection**: Dependencies are injected, not instantiated

## Backend Architecture

### Directory Structure

```
apps/api/src/
├── core/                           # Core architecture components
│   ├── interfaces/                # Base interfaces
│   │   ├── IRepository.ts         # Repository interface
│   │   ├── IService.ts            # Service interface
│   │   └── IController.ts         # Controller interface
│   ├── base/                      # Base classes
│   │   ├── BaseRepository.ts      # Generic repository base
│   │   ├── BaseService.ts         # Generic service base
│   │   └── BaseController.ts      # Generic controller base
│   ├── errors/                    # Custom error classes
│   │   └── AppError.ts            # Application error hierarchy
│   ├── validation/                # Validation schemas
│   │   ├── ValidationSchemas.ts   # Zod validation schemas
│   │   └── SanitizationSchemas.ts # Input sanitization
│   ├── cache/                     # In-memory cache (node-cache)
│   │   └── CacheService.ts
│   └── middleware/                # Core middleware
│       ├── ErrorHandler.ts        # Global error handling
│       ├── ValidationMiddleware.ts # Request validation
│       ├── SecurityMiddleware.ts  # Security middleware
│       └── cacheHeaders.ts        # Cache-Control for GET routes
├── realtime/                      # Socket.io layer
│   ├── socket.ts                  # IO server on HTTP server
│   └── emitter.ts                 # Typed event broadcast
├── modules/                       # Feature modules
│   ├── bet/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── controllers/
│   │   ├── mappers/               # Slim BetListItem / BetDetail DTOs
│   │   └── __tests__/
│   ├── category/
│   └── admin/
├── config/                        # env.ts, db.ts, consul
├── routes/                        # Route aggregation
├── utils/
├── app.ts                         # Express + REST + compression
└── server.ts                      # HTTP server + Socket.io bootstrap
```

## Realtime Architecture

Vote and bet mutations emit Socket.io events after the database transaction succeeds. Clients subscribe instead of polling REST.

```mermaid
sequenceDiagram
  participant Client
  participant REST as Express_REST
  participant Svc as VoteService_BetService
  participant IO as Socket_io
  participant DB as Postgres

  Client->>REST: POST /api/v1/votes
  REST->>Svc: createVote
  Svc->>DB: transaction + aggregate counts
  Svc->>IO: emit vote:created
  IO->>Client: push payload
  Note over Client: RealtimeProvider patches query cache; BetCard updates odds
```

| Event | Emitter | Payload |
|-------|---------|---------|
| `vote:created` | `vote.service.ts` | `{ betId, oddId, odds[], totalVotes }` |
| `bet:created` | `BetService.create` | `BetListItem` |
| `bet:updated` | `BetService` update/close/resolve | `BetListItem` |

Event contracts: [`packages/types/src/realtime.ts`](../packages/types/src/realtime.ts). API reference: [API.md](./API.md#realtime-api-socketio).

**Scaling note:** broadcasts are in-process. Multiple API instances need `@socket.io/redis-adapter` — see [PERFORMANCE.md](./PERFORMANCE.md).

## Caching and Performance Layers

| Layer | Implementation | Notes |
|-------|----------------|-------|
| Backend memory | `CacheService` (node-cache) | Categories 5m, resolved bets 2m, bet detail 30s |
| HTTP headers | `cacheHeaders` middleware | `GET /api/v1/categories` |
| Response size | `bet.mapper.ts` | Slim list DTOs vs full detail |
| Wire format | `compression` middleware | gzip above ~1KB |
| Frontend | `useQuery` + `queryCache` | Stale-while-revalidate; `RealtimeProvider` patches cache |
| Frontend UI | `OddsList` optimistic vote | Rollback on error; socket reconciles counts |

## Shared Types

The `@sarradabet/types` package exports `BetListItem`, `BetDetail`, `Category`, and `RealtimeEvents`. Both `apps/api` and `apps/web` depend on it.

### Layer Responsibilities

#### 1. Infrastructure Layer

**Repositories** (`modules/*/repositories/`)

- Data access and persistence
- Database operations using Prisma ORM
- Extends `BaseRepository` for common operations
- Implements `IRepository` interface

```typescript
export class BetRepository
  extends BaseRepository<Bet>
  implements IRepository<Bet>
{
  // Database-specific operations
  async findWithOdds(id: number): Promise<BetWithOdds | null> {
    return this.prisma.bet.findUnique({
      where: { id },
      include: { odds: true },
    });
  }
}
```

#### 2. Domain Layer

**Services** (`modules/*/services/`)

- Business logic and rules
- Validation and orchestration
- Extends `BaseService` for common operations
- Implements `IService` interface

```typescript
export class BetService
  extends BaseService<Bet>
  implements IBusinessService<Bet>
{
  async create(data: CreateBetDto): Promise<Bet> {
    // Business logic validation
    await this.validateBusinessRules(data);

    // Execute business logic
    return this.executeBusinessLogic(() => this.betRepository.create(data));
  }
}
```

#### 3. Application Layer

**Controllers** (`modules/*/controllers/`)

- Request/response handling
- Input validation and transformation
- Extends `BaseController` for common operations
- Implements `IController` interface

```typescript
export class BetController extends BaseController<Bet> {
  async create(req: Request, res: Response): Promise<void> {
    const data = this.parseBody(req, CreateBetSchema);
    const bet = await this.betService.create(data);
    this.sendSuccess(res, { bet }, "Bet created successfully", 201);
  }
}
```

#### 4. Presentation Layer

**Routes** (`modules/*/routes/`)

- API endpoint definitions
- Middleware integration
- Route parameter handling

```typescript
export const betRoutes = (router: Router): void => {
  const betController = new BetController(betService);

  router.get(
    "/bets",
    validateQuery(BetQuerySchema),
    betController.list.bind(betController),
  );
  router.post(
    "/bets",
    validateBody(CreateBetSchema),
    betController.create.bind(betController),
  );
};
```

### Base Classes

#### BaseRepository

Provides common database operations:

- CRUD operations
- Pagination
- Transaction handling
- Generic type support

```typescript
export abstract class BaseRepository<T> implements IRepository<T> {
  constructor(protected prisma: PrismaClient) {}

  async findMany(options?: PaginationParams): Promise<PaginatedResult<T>> {
    // Common pagination logic
  }

  async executeTransaction<R>(
    callback: (tx: PrismaTransaction) => Promise<R>,
  ): Promise<R> {
    // Transaction handling
  }
}
```

#### BaseService

Provides common business logic:

- Validation orchestration
- Business rule enforcement
- Error handling
- Generic operations

```typescript
export abstract class BaseService<T> implements IBusinessService<T> {
  async validateBusinessRules(data: any): Promise<void> {
    // Common validation logic
  }

  async executeBusinessLogic<R>(operation: () => Promise<R>): Promise<R> {
    // Business logic execution with error handling
  }
}
```

#### BaseController

Provides common request handling:

- Response formatting
- Error handling
- Input parsing
- Status code management

```typescript
export abstract class BaseController<T> implements IController<T> {
  protected parseBody<R>(req: Request, schema: ZodSchema<R>): R {
    // Request body parsing
  }

  protected sendSuccess<R>(
    res: Response,
    data: R,
    message?: string,
    statusCode: number = 200,
  ): void {
    // Success response formatting
  }
}
```

## Frontend Architecture

### Directory Structure

```
apps/web/src/
├── core/                         # Core architecture
│   ├── interfaces/              # TypeScript interfaces
│   │   └── IService.ts          # Service interface
│   ├── base/                    # Base classes
│   │   └── BaseService.ts       # HTTP service base
│   └── hooks/                   # Core hooks
│       ├── useApi.ts            # Generic API hook
│       ├── useQuery.ts          # Query + cache + SWR
│       ├── useMutation.ts       # Mutations + onMutate/onRollback
│       ├── useSocket.ts         # Socket.io client
│       └── useQueryCache.ts     # In-memory query cache
├── context/
│   └── RealtimeProvider.tsx     # Socket listeners → cache patches
├── services/                    # API services
│   ├── BetService.ts           # Bet API service
│   ├── CategoryService.ts      # Category API service
│   └── VoteService.ts          # Vote API service
├── hooks/                       # Domain-specific hooks
│   ├── useBets.ts              # staleTime 2m
│   ├── useCategories.ts        # staleTime 5m
│   └── useVotes.ts
├── components/
│   ├── ui/                     # Button, Modal, BetCardSkeleton, etc.
│   ├── CreateBetModal.tsx
│   ├── BetCard.tsx             # Socket vote updates + category from list
│   └── OddsList.tsx            # Optimistic vote + rollback
├── pages/
│   ├── HomePage.tsx
│   ├── AdminLogin.tsx          # lazy-loaded
│   └── AdminDashboard.tsx      # lazy-loaded
├── types/                       # Re-exports from @sarradabet/types
└── App.tsx                     # Router + RealtimeProvider
```

### Frontend Patterns

#### 1. Service Layer Pattern

**BaseService** provides common HTTP operations:

- Request/response handling
- Error management
- Type safety
- Generic CRUD operations

```typescript
export class BaseService {
  protected async request<T>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<ApiResponse<T>> {
    // Common HTTP request logic
  }

  protected handleError(error: any): ApiError {
    // Error handling logic
  }
}
```

**Domain Services** extend BaseService:

```typescript
export class BetService extends BaseService {
  async getBets(params?: BetQueryParams): Promise<ApiResponse<Bet[]>> {
    return this.request<Bet[]>("/bets", { params });
  }

  async createBet(data: CreateBetDto): Promise<ApiResponse<Bet>> {
    return this.request<Bet>("/bets", {
      method: "POST",
      body: data,
    });
  }
}
```

#### 2. Custom Hooks Pattern

**Core Hooks** provide generic functionality:

```typescript
// useApi - Generic API state management
export const useApi = <T>(service: () => Promise<ApiResponse<T>>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  // ... implementation
};

// useQuery - Query with caching
export const useQuery = <T>(
  queryKey: string,
  service: () => Promise<ApiResponse<T>>,
  options?: QueryOptions,
) => {
  // Caching and stale time logic
};

// useMutation - Mutations with optional optimistic updates
export function useMutation<TData, TVariables, TContext = unknown>(
  mutationFn: (variables: TVariables) => Promise<ApiResponse<TData>>,
  options?: {
    onMutate?: (variables: TVariables) => TContext | void;
    onRollback?: (context: TContext, error: ApiError, variables: TVariables) => void;
    onSuccess?: (data: TData, variables: TVariables) => void;
  },
) {
  // Runs onMutate before request; onRollback on failure
}
```

**Domain Hooks** use custom cache keys and stale times:

```typescript
export const useBets = (params?: BetQueryParams) => {
  return useQuery(
    `bets-${JSON.stringify(params)}`,
    () => betService.getBetsWithPagination(params),
    { staleTime: 2 * 60 * 1000, refetchOnMount: false },
  );
};

export const useCategories = () => {
  return useQuery(
    `categories-...`,
    () => categoryService.getCategoriesWithPagination(),
    { staleTime: 5 * 60 * 1000 },
  );
};
```

**RealtimeProvider** listens for Socket.io events and patches `queryCache` keys prefixed with `bets-`. **OddsList** applies optimistic vote counts; **BetCard** reconciles via `vote:created` events.

#### 3. Component Composition

**UI Components** are reusable and composable:

```typescript
// Button component with variants
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  children,
  ...props
}) => {
  const className = cn(
    'button',
    `button--${variant}`,
    `button--${size}`,
    props.className
  );

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};
```

**Feature Components** combine UI components:

```typescript
export const CreateBetModal: React.FC<CreateBetModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { data: categories, loading: categoriesLoading } = useCategories();
  const createBet = useCreateBet();

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {/* Form fields using UI components */}
        <Button type="submit" loading={createBet.loading}>
          Create Bet
        </Button>
      </form>
    </Modal>
  );
};
```

## Data Flow

### Backend Data Flow

```
Request → Middleware → Controller → Service → Repository → Database
   ↓
Response ← Middleware ← Controller ← Service ← Repository ← Database
```

1. **Request arrives** at route handler
2. **Middleware** processes (validation, security, logging)
3. **Controller** parses request and validates input
4. **Service** executes business logic and validation
5. **Repository** performs database operations
6. **Response** flows back through the layers

### Frontend Data Flow

```
User Action → Component → Hook → Service → API → Backend
   ↓
UI Update ← Component ← Hook ← Service ← API ← Backend
```

1. **User action** triggers component event
2. **Component** calls custom hook
3. **Hook** calls service method
4. **Service** makes HTTP request
5. **API** returns data
6. **Hook** updates state
7. **Component** re-renders with new data

## Error Handling

### Backend Error Handling

**Error Hierarchy:**

```typescript
AppError (base class)
├── ValidationError (400)
├── NotFoundError (404)
├── ConflictError (409)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── TooManyRequestsError (429)
├── InternalServerError (500)
└── DatabaseError (500)
```

**Error Flow:**

1. Service throws `AppError` or system error
2. Controller catches and passes to middleware
3. `ErrorHandler` middleware processes error
4. Formatted error response sent to client

### Frontend Error Handling

**Error Types:**

```typescript
interface ApiError {
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  requestId?: string;
  timestamp?: string;
}
```

**Error Flow:**

1. API returns error response
2. Service transforms to `ApiError`
3. Hook catches and sets error state
4. Component displays error message

## Validation System

### Backend Validation

**Zod Schemas:**

```typescript
export const CreateBetSchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(255, "Title cannot exceed 255 characters"),
  odds: z
    .array(OddSchema)
    .min(2, "At least 2 odds are required")
    .refine(validateUniqueTitles, "Odd titles must be unique"),
});
```

**Validation Middleware:**

```typescript
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(new ValidationError(error));
    }
  };
};
```

### Frontend Validation

**Form Validation:**

```typescript
const validateBetForm = (data: CreateBetDto) => {
  const errors: Record<string, string> = {};

  if (!data.title || data.title.length < 2) {
    errors.title = "Title must be at least 2 characters";
  }

  if (!data.odds || data.odds.length < 2) {
    errors.odds = "At least 2 odds are required";
  }

  return errors;
};
```

## Security Architecture

### Backend Security

**Security Middleware Stack:**

1. **Helmet.js** - Security headers
2. **Rate Limiting** - Request throttling
3. **CORS** - Cross-origin protection
4. **Request Sanitization** - Input cleaning
5. **Validation** - Input validation

**Security Features:**

- API key authentication
- Request size limiting
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection

### Frontend Security

**Security Measures:**

- Input validation
- XSS prevention
- Secure HTTP requests
- Error message sanitization

## Testing Architecture

### Backend Testing

**Test Structure:**

```
__tests__/
├── unit/                    # Unit tests
│   ├── services/           # Service tests
│   ├── repositories/       # Repository tests
│   └── utils/              # Utility tests
├── integration/            # Integration tests
│   └── routes/             # API route tests
└── e2e/                    # End-to-end tests
```

**Testing Tools:**

- **Jest** - Test framework
- **Supertest** - HTTP assertions
- **Prisma Test Client** - Database testing

### Frontend Testing

**Test Structure:**

```
__tests__/
├── components/             # Component tests
├── hooks/                  # Hook tests
├── services/               # Service tests
└── utils/                  # Utility tests
```

**Testing Tools:**

- **Vitest** - Test framework
- **React Testing Library** - Component testing
- **MSW** - API mocking

## Performance Considerations

### Backend Performance

**Optimization Strategies:**

- Database indexing
- Query optimization
- Connection pooling
- Caching strategies
- Rate limiting

### Frontend Performance

**Optimization Strategies:**

- Component memoization
- Lazy loading
- Code splitting
- Image optimization
- Bundle optimization

## Deployment Architecture

### Development Environment

```
Developer Machine
├── API (Express + Socket.io) — localhost:8000
├── Vite dev server — localhost:3002
└── Docker db (Postgres) — localhost:5433
```

### Production Environment

```
Production Server
├── Nginx (Reverse Proxy + WebSocket upgrade for /socket.io)
├── Node.js (Backend API + Socket.io)
├── React static files (Vite build)
└── PostgreSQL (Supabase or self-hosted)
```

Alternative cloud hosting: see [DEPLOYMENT.md](./DEPLOYMENT.md#alternative-vercel--render) (Vercel for web + API, or Render for API).

## Monitoring and Observability

### Logging

**Structured Logging:**

```typescript
logger.info("Request processed", {
  requestId: "req_123",
  method: "POST",
  path: "/api/v1/bets",
  duration: 150,
  statusCode: 201,
});
```

### Metrics

**Key Metrics:**

- Request duration
- Error rates
- Database query performance
- Memory usage
- CPU usage

### Health Checks

**Health Endpoints:**

- `/health` - API health
- Database connectivity
- External service availability

## Future Architecture Considerations

### Scalability

**Horizontal Scaling:**

- Load balancing
- Database replication
- Microservices migration
- Container orchestration

### Performance

**Optimization:**

- Redis caching
- CDN integration
- Database optimization
- API response caching

### Security

**Enhancement:**

- JWT authentication
- Role-based access control
- API versioning
- Audit logging

---

This architecture provides a solid foundation for building scalable, maintainable, and secure applications while following industry best practices and clean architecture principles.
