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

- `GET/POST` `/api/v1/bets`, `/api/v1/categories`, `POST /api/v1/votes`
- `GET /health`, `GET /ready`

### Admin endpoints

Routes under `/api/v1/admin/*` require a JWT in the `Authorization: Bearer <token>` header (obtained via `POST /api/v1/admin/login`).

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

Create a new bet.

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

- **Limit**: 100 requests per 15 minutes per IP address
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
