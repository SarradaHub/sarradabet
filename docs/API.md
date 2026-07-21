# 📚 SarradaBet API Documentation

## Overview

The SarradaBet API is a RESTful API built with Express.js and TypeScript, with a **Socket.io** realtime layer for live odds and bet updates. Types are shared via `@sarradabet/types` in `packages/types`.

## Base Information

- **REST base URL**: `http://localhost:8000/api/v1`
- **Socket.io URL**: `http://localhost:8000` (path: `/socket.io`)
- **Protocol**: HTTP/HTTPS + WebSocket (via Socket.io)
- **Content Type**: `application/json`
- **Compression**: gzip for responses above ~1KB (when client sends `Accept-Encoding: gzip`)

## Authentication

### Public endpoints

No authentication required:

- `GET` `/api/v1/bets`, `/api/v1/categories`, `/api/v1/coins/packages`
- `POST` `/api/v1/votes`
- `POST` `/api/v1/auth/register`, `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`
- `GET /health`, `GET /ready`

### User authentication

User routes use a **short-lived access token** (JWT in `Authorization: Bearer <token>`) and a **refresh token** stored in an HttpOnly cookie.

| Setting | Default |
|---------|---------|
| Access token TTL | `15m` (`JWT_ACCESS_EXPIRES_IN`) |
| Refresh token TTL | `7d` (`JWT_REFRESH_EXPIRES_IN`) |
| Cookie name | `refreshToken` (`REFRESH_TOKEN_COOKIE_NAME`) |
| Cookie path | `/api/v1/auth` |

**Frontend clients** must send `credentials: 'include'` on auth requests so the refresh cookie is stored and sent back.

#### POST /auth/register

Creates a user with role `USER`.

**Request:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": {
      "token": "eyJ...",
      "expiresIn": "15m"
    }
  }
}
```

Sets `Set-Cookie: refreshToken=...; HttpOnly; Path=/api/v1/auth; SameSite=Lax`.

#### POST /auth/login

Same body as register (username or email in `username` field). Returns the same shape as register.

#### POST /auth/refresh

No body required. Reads the refresh cookie, rotates it (OWASP-style), and returns a new access token.

#### POST /auth/logout

Revokes the current refresh token, clears the cookie, and **blacklists the access token** when `Authorization: Bearer <accessToken>` is sent. Blacklisted tokens are rejected until their original expiry (stored in Redis with key `auth:blacklist:{jti}`).

#### GET /auth/me

Returns the authenticated user's profile. Requires `Authorization: Bearer <accessToken>`.

### Protected endpoints

Require `Authorization: Bearer <accessToken>`:

| Route | Permission |
|-------|------------|
| `GET /api/v1/auth/me` | Any authenticated user |
| `POST /api/v1/bets` | Any authenticated user |
| `PUT/DELETE/PATCH /api/v1/bets/*` | User with `role: ADMIN` |
| `POST/PUT/DELETE /api/v1/categories/*` | User with `role: ADMIN` |
| `GET /api/v1/users` | Admin only (`role: ADMIN`) |
| `GET /api/v1/users/:id` | Self or admin |
| `PUT /api/v1/users/:id` | Self or admin |
| `DELETE /api/v1/users/:id` | Admin only (cannot delete self) |
| `GET /api/v1/coins/balance`, `GET /api/v1/coins/transactions` | Any authenticated user |
| `POST /api/v1/payments/pix`, `GET /api/v1/payments/pix/:id` | Any authenticated user |
| `GET/POST/PUT/DELETE /api/v1/admin/coin-packages` | Admin only |

The admin dashboard uses the same auth flow: login via `POST /auth/login` with a user that has `role: ADMIN`.

### Webhook endpoints

Mercado Pago webhooks use **HMAC signature validation** (`x-signature`, `x-request-id` headers). No JWT. Invalid signatures return **401**.

| Route | Auth |
|-------|------|
| `POST /api/v1/webhooks/mercadopago` | Mercado Pago HMAC signature |

### API key (optional, not mounted)

An `X-API-Key` middleware exists in code but is **not applied** to routes today. Do not rely on API key auth for public betting endpoints.

## Response Format

### Success Response

All successful API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response

All error responses follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Field-specific error message",
      "code": "ERROR_CODE"
    }
  ],
  "requestId": "unique-request-id",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Data Models

Types are defined in [`packages/types`](../packages/types/src/index.ts). List and mutation responses use **slim DTOs**; detail endpoints return full **`BetDetail`**.

### BetListItem (list, create, update, close)

Used in `GET /bets`, `bet:created`, and `bet:updated` events.

```typescript
interface BetListItem {
  id: number;
  title: string;
  description?: string | null;
  status: "open" | "closed" | "resolved";
  categoryId: number;
  category?: { id: number; title: string };
  totalVotes: number;
  createdAt: string; // ISO 8601
  odds: OddWithVotes[];
}

interface OddWithVotes {
  id: number;
  title: string;
  value: number;
  totalVotes: number;
}
```

### BetDetail (GET /bets/:id, resolve)

Extends list shape with timestamps and full odd fields:

```typescript
interface BetDetail extends BetListItem {
  updatedAt: string;
  resolvedAt?: string | null;
  odds: OddDetail[];
}

interface OddDetail extends OddWithVotes {
  result?: "pending" | "won" | "lost";
  betId?: number;
}
```

### Category

```typescript
interface Category {
  id: number;
  title: string;
  createdAt: string; // ISO 8601 date
  updatedAt: string; // ISO 8601 date
  _count?: {
    bet: number;
  };
}
```

### Vote (create response)

```typescript
interface VoteCreateResponse {
  vote: {
    id: number;
    oddId: number;
    createdAt: string;
  };
  betId: number;
  odds: { id: number; totalVotes: number }[];
  totalVotes: number;
}
```

## Realtime API (Socket.io)

Connect to the same host as REST. Event names and payloads match [`packages/types/src/realtime.ts`](../packages/types/src/realtime.ts).

| Field | Value |
|-------|-------|
| URL | `http://localhost:8000` (production: your API host) |
| Path | `/socket.io` |
| Transport | WebSocket with polling fallback |

### Events

| Event | Payload | Trigger |
|-------|---------|---------|
| `vote:created` | `{ betId, oddId, odds[{id,totalVotes}], totalVotes }` | `POST /votes` |
| `bet:created` | `BetListItem` | `POST /bets` |
| `bet:updated` | `BetListItem` | bet update, close, resolve |
| `payment:confirmed` | `{ paymentId, coinsAmount, newBalance, paidAt }` | Pix payment approved (webhook) |

Authenticated sockets join room `user:{userId}` and receive `payment:confirmed` after a successful Pix purchase.

### Listener example (Node.js)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:8000", { path: "/socket.io" });

socket.on("vote:created", (payload) => {
  console.log("vote:created", payload);
});

socket.on("bet:created", (bet) => console.log("bet:created", bet.id));
socket.on("bet:updated", (bet) => console.log("bet:updated", bet.id));
```

Clients should prefer Socket.io push over polling `GET /bets/:id` after votes.

## Endpoints

### Health Check

#### GET /health

Check API health status.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

---

## Bet Endpoints

### List Bets

#### GET /bets

Retrieve all bets with optional filtering and pagination.

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `status` (string, optional): Filter by status (`open`, `closed`, `resolved`)
- `categoryId` (number, optional): Filter by category ID
- `search` (string, optional): Search in title and description
- `sortBy` (string, optional): Sort field (default: `createdAt`)
- `sortOrder` (string, optional): Sort order (`asc` or `desc`, default: `desc`)

**Example Request:**

```http
GET /api/v1/bets?page=1&limit=10&status=open&sortBy=createdAt&sortOrder=desc
```

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "title": "Will Team A win?",
        "description": "Championship final match",
        "status": "open",
        "categoryId": 1,
        "category": { "id": 1, "title": "Sports" },
        "createdAt": "2024-01-01T00:00:00.000Z",
        "odds": [
          {
            "id": 1,
            "title": "Yes",
            "value": 2.5,
            "totalVotes": 45
          },
          {
            "id": 2,
            "title": "No",
            "value": 1.67,
            "totalVotes": 67
          }
        ],
        "totalVotes": 112
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Single Bet

#### GET /bets/:id

Retrieve a specific bet by ID.

**Path Parameters:**

- `id` (number, required): Bet ID

**Response:**

```json
{
  "success": true,
  "data": {
    "bet": {
      "id": 1,
      "title": "Will Team A win?",
      "description": "Championship final match",
      "status": "open",
      "categoryId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "resolvedAt": null,
      "odds": [
        {
          "id": 1,
          "title": "Yes",
          "value": 2.5,
          "totalVotes": 45,
          "result": "pending"
        }
      ]
    }
  }
}
```

### Create Bet

#### POST /bets

Create a new bet. **Requires user authentication** (`Authorization: Bearer <accessToken>`).

**Headers:**

```http
Authorization: Bearer <accessToken>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Will Team A win?",
  "description": "Championship final match",
  "categoryId": 1,
  "odds": [
    {
      "title": "Yes",
      "value": 2.5
    },
    {
      "title": "No",
      "value": 1.67
    }
  ]
}
```

**Validation Rules:**

- `title`: Required, 2-255 characters, valid characters only
- `description`: Optional, max 1000 characters
- `categoryId`: Optional, must exist in database
- `odds`: Required, 2-10 odds, unique titles, values between 1.01-1000

**Response:**

```json
{
  "success": true,
  "data": {
    "bet": {
      "id": 1,
      "title": "Will Team A win?",
      "description": "Championship final match",
      "status": "open",
      "categoryId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "resolvedAt": null,
      "odds": [
        {
          "id": 1,
          "title": "Yes",
          "value": 2.5,
          "totalVotes": 0,
          "result": "pending"
        }
      ]
    }
  },
  "message": "Bet created successfully"
}
```

### Update Bet

#### PUT /bets/:id

Update an existing bet.

**Path Parameters:**

- `id` (number, required): Bet ID

**Request Body:**

```json
{
  "title": "Updated bet title",
  "description": "Updated description",
  "status": "closed"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bet": {
      "id": 1,
      "title": "Updated bet title",
      "description": "Updated description",
      "status": "closed",
      "categoryId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "resolvedAt": null,
      "odds": []
    }
  },
  "message": "Bet updated successfully"
}
```

### Delete Bet

#### DELETE /bets/:id

Delete a bet (only if it has no votes).

**Path Parameters:**

- `id` (number, required): Bet ID

**Response:**

```json
{
  "success": true,
  "message": "Bet deleted successfully"
}
```

### Close Bet

#### PATCH /bets/:id/close

Close a bet to prevent new votes.

**Path Parameters:**

- `id` (number, required): Bet ID

**Response:**

```json
{
  "success": true,
  "data": {
    "bet": {
      "id": 1,
      "title": "Will Team A win?",
      "status": "closed",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Bet closed successfully"
}
```

### Resolve Bet

#### PATCH /bets/:id/resolve

Resolve a bet by specifying the winning odd.

**Path Parameters:**

- `id` (number, required): Bet ID

**Request Body:**

```json
{
  "winningOddId": 1
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "bet": {
      "id": 1,
      "title": "Will Team A win?",
      "status": "resolved",
      "resolvedAt": "2024-01-01T00:00:00.000Z",
      "odds": [
        {
          "id": 1,
          "title": "Yes",
          "result": "won"
        },
        {
          "id": 2,
          "title": "No",
          "result": "lost"
        }
      ]
    }
  },
  "message": "Bet resolved successfully"
}
```

---

## Category Endpoints

### List Categories

#### GET /categories

Retrieve all categories with optional filtering and pagination.

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `search` (string, optional): Search in title
- `sortBy` (string, optional): Sort field (default: `createdAt`)
- `sortOrder` (string, optional): Sort order (`asc` or `desc`, default: `desc`)

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "title": "Sports",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "_count": {
          "bet": 15
        }
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### Get Single Category

#### GET /categories/:id

Retrieve a specific category by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "title": "Sports",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Create Category

#### POST /categories

Create a new category.

**Request Body:**

```json
{
  "title": "Entertainment"
}
```

**Validation Rules:**

- `title`: Required, 2-50 characters, valid characters only

**Response:**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": 2,
      "title": "Entertainment",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Category created successfully"
}
```

### Update Category

#### PUT /categories/:id

Update an existing category.

**Request Body:**

```json
{
  "title": "Updated Category Name"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "category": {
      "id": 1,
      "title": "Updated Category Name",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "message": "Category updated successfully"
}
```

### Delete Category

#### DELETE /categories/:id

Delete a category (only if it has no associated bets).

**Response:**

```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## Vote Endpoints

### List Votes

#### GET /votes

Retrieve all votes with optional filtering and pagination.

**Query Parameters:**

- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 10, max: 100)
- `betId` (number, optional): Filter by bet ID
- `oddId` (number, optional): Filter by odd ID

**Response:**

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "oddId": 1,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### Get Single Vote

#### GET /votes/:id

Retrieve a specific vote by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "vote": {
      "id": 1,
      "oddId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "odd": {
        "id": 1,
        "title": "Yes",
        "value": 2.5,
        "betId": 1
      }
    }
  }
}
```

### Create Vote

#### POST /votes

Create a new vote.

**Request Body:**

```json
{
  "oddId": 1
}
```

**Validation Rules:**

- `oddId`: Required, must exist and belong to an open bet

**Response:**

```json
{
  "success": true,
  "data": {
    "vote": {
      "id": 1,
      "oddId": 1,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "betId": 1,
    "odds": [
      { "id": 1, "totalVotes": 46 },
      { "id": 2, "totalVotes": 67 }
    ],
    "totalVotes": 113
  },
  "message": "Vote created successfully"
}
```

Also emits **`vote:created`** on Socket.io with the same aggregate counts.

## Coin Endpoints

Coin balance and ledger for authenticated users. Package listing is public.

### List Coin Packages

**GET** `/coins/packages`

Public. Returns active purchasable packages sorted by `sortOrder`.

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Pacote Básico",
      "amountCents": 500,
      "coinsAmount": 100,
      "isActive": true,
      "sortOrder": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Coin Balance

**GET** `/coins/balance`

Requires user JWT.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "balance": 150
  }
}
```

### List Coin Transactions

**GET** `/coins/transactions`

Requires user JWT. Paginated ledger of credits and debits.

**Query parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `page` | `1` | Page number |
| `limit` | `10` | Items per page |
| `sortBy` | `createdAt` | Sort field |
| `sortOrder` | `desc` | `asc` or `desc` |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "userId": 1,
        "type": "CREDIT",
        "amount": 100,
        "balanceAfter": 100,
        "source": "PIX_PURCHASE",
        "referenceId": 1,
        "externalId": "mp_payment_123456",
        "description": "Pix purchase mp_123456",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

**Transaction sources:** `PIX_PURCHASE`, `BET_COST`, `ADMIN_ADJUSTMENT`, `REFUND`.

## Payment Endpoints

Pix purchases via Mercado Pago. Requires user JWT.

### Create Pix Purchase

**POST** `/payments/pix`

**Request:**

```json
{
  "coinPackageId": 1
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "paymentId": 1,
    "externalId": "123456789",
    "qrCode": "00020126...",
    "qrCodeBase64": "iVBORw0KGgo...",
    "copyPaste": "00020126...",
    "ticketUrl": "https://www.mercadopago.com.br/...",
    "expiresAt": "2024-01-01T00:30:00.000Z",
    "coinsAmount": 100,
    "amountCents": 500,
    "packageName": "Pacote Básico",
    "status": "PENDING"
  }
}
```

Display `qrCodeBase64` as a PNG data URL or use `copyPaste` for Pix copia-e-cola. Poll status or listen for Socket.io `payment:confirmed`.

### Get Pix Payment Status

**GET** `/payments/pix/:id`

Returns the current status for the authenticated user's payment. Pending payments past `expiresAt` are marked `EXPIRED` on read.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "externalId": "123456789",
    "status": "PENDING",
    "coinsAmount": 100,
    "amountCents": 500,
    "packageName": "Pacote Básico",
    "expiresAt": "2024-01-01T00:30:00.000Z",
    "paidAt": null,
    "qrCode": "00020126...",
    "qrCodeBase64": "iVBORw0KGgo...",
    "copyPaste": "00020126..."
  }
}
```

**Status values:** `PENDING`, `APPROVED`, `EXPIRED`, `CANCELLED`, `FAILED`.

## Webhook Endpoints

### Mercado Pago Payment Notification

**POST** `/webhooks/mercadopago`

Called by Mercado Pago when a payment status changes. Uses raw JSON body (not the global JSON parser).

**Headers:**

| Header | Required | Description |
|--------|----------|-------------|
| `x-signature` | Yes (production) | HMAC SHA256 signature |
| `x-request-id` | Yes (production) | Request ID for manifest |

**Query:** `data.id` or body `data.id` — Mercado Pago payment ID.

**Response (200):**

```json
{
  "received": true
}
```

On valid payment notifications, the API verifies status with Mercado Pago, credits coins idempotently (`externalId`: `mp_payment_{id}`), updates `PixPayment` to `APPROVED`, and emits `payment:confirmed` to the user's Socket.io room.

Invalid signatures return **401**. Non-payment webhook types return `{ "received": true, "ignored": true }`.

## Admin Coin Package Endpoints

Require admin JWT (`role: ADMIN`).

### List All Coin Packages

**GET** `/admin/coin-packages`

Returns all packages including inactive.

### Create Coin Package

**POST** `/admin/coin-packages`

**Request:**

```json
{
  "name": "Pacote Básico",
  "amountCents": 500,
  "coinsAmount": 100,
  "isActive": true,
  "sortOrder": 0
}
```

### Update Coin Package

**PUT** `/admin/coin-packages/:id`

Partial update — same fields as create, all optional.

### Deactivate Coin Package

**DELETE** `/admin/coin-packages/:id`

Soft-deactivates the package (`isActive: false`). Does not delete historical payments.

## Error Codes

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate or business rule violation)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `DUPLICATE` - Duplicate entry
- `CONFLICT` - Business rule violation
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Access denied
- `RATE_LIMIT` - Too many requests
- `DATABASE_ERROR` - Database operation failed

## HTTP Caching and Compression

### Category list cache headers

`GET /api/v1/categories` responses include:

```http
Cache-Control: public, max-age=300, stale-while-revalidate=60
```

### Compression

JSON responses larger than ~1KB may include `Content-Encoding: gzip` when the client accepts gzip.

See [Performance Guide](./PERFORMANCE.md) for backend `node-cache` TTLs and Supabase pooling.

## Rate Limiting

- **Global limit**: 100 requests per 15 minutes per IP address
- **Auth login** (`POST /api/v1/auth/login`): 10 requests per 15 minutes per IP (`AUTH_LOGIN_RATE_LIMIT_MAX`)
- **Auth register** (`POST /api/v1/auth/register`): 5 requests per 15 minutes per IP (`AUTH_REGISTER_RATE_LIMIT_MAX`)
- **Headers**: Rate limit information included in response headers
- **Error**: 429 status code when limit exceeded

## Security

### Security Headers

The API includes comprehensive security headers:

- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`

### Input Validation

All inputs are validated and sanitized:

- String sanitization (trimming, character filtering)
- Type validation and coercion
- Length and format validation
- Business logic validation

### CORS

Cross-Origin Resource Sharing is configured with:

- Origin whitelist support
- Credential support
- Configurable allowed methods and headers

## Examples

### Complete Betting Flow

0. **Optional — listen for realtime events** (see Realtime API section above).

1. **Create a category:**

   ```bash
   curl -X POST http://localhost:8000/api/v1/categories \
     -H "Content-Type: application/json" \
     -d '{"title": "Sports"}'
   ```

2. **Create a bet:**

   ```bash
   curl -X POST http://localhost:8000/api/v1/bets \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Will Team A win?",
       "categoryId": 1,
       "odds": [
         {"title": "Yes", "value": 2.50},
         {"title": "No", "value": 1.67}
       ]
     }'
   ```

3. **Vote on an odd:**

   ```bash
   curl -X POST http://localhost:8000/api/v1/votes \
     -H "Content-Type: application/json" \
     -d '{"oddId": 1}'
   ```

4. **Close the bet:**

   ```bash
   curl -X PATCH http://localhost:8000/api/v1/bets/1/close
   ```

5. **Resolve the bet:**

   ```bash
   curl -X PATCH http://localhost:8000/api/v1/bets/1/resolve \
     -H "Content-Type: application/json" \
     -d '{"winningOddId": 1}'
   ```

## SDKs and Libraries

### JavaScript/TypeScript

```typescript
import {
  BetService,
  CategoryService,
  VoteService,
} from "@sarradabet/api-client";

const betService = new BetService({
  baseURL: "http://localhost:8000/api/v1",
});

// Create a bet
const bet = await betService.create({
  title: "Will Team A win?",
  categoryId: 1,
  odds: [
    { title: "Yes", value: 2.5 },
    { title: "No", value: 1.67 },
  ],
});
```

### Python

```python
import requests

class SarradaBetClient:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }

    def create_bet(self, bet_data):
        response = requests.post(
            f'{self.base_url}/bets',
            json=bet_data,
            headers=self.headers
        )
        return response.json()

client = SarradaBetClient('http://localhost:8000/api/v1')
```

## Support

For API support:

- Check the health endpoint: `GET /health`
- Review error responses for debugging
- Check request/response formats
- Verify authentication headers
- Ensure proper content types

For additional help, please refer to the main project documentation or create an issue in the repository.
