# Action Plan 06 — Supabase Image Upload

## 1. Goal

Configure Supabase Storage with RLS policies and implement admin image upload (drag-and-drop or file input) for reward images, replacing manual URL entry with validated, compressed uploads.

## 2. Market Research / Requirements

Not applicable — infrastructure feature. Current state:

- Supabase is used as **hosted Postgres only** (`DATABASE_URL` / `DIRECT_URL`) — no `@supabase/supabase-js` client.
- Reward `imageUrl` is a plain string field; admin enters URL manually in [`EditRewardModal.tsx`](../../apps/web/src/components/admin/EditRewardModal.tsx).
- API already uses `sharp` for ticket PNG generation ([`TicketImageService.ts`](../../apps/api/src/modules/ticket/services/TicketImageService.ts)).

**First consumer:** admin reward image upload. Pattern can extend to bet/category images later.

## 3. Tech Stack & Dependencies

| Package | Workspace | Purpose |
|---------|-----------|---------|
| `@supabase/supabase-js` | `apps/api` (service role) | Server-side upload / signed URLs |
| `@supabase/supabase-js` | `apps/web` (anon key) | Optional direct upload with RLS |
| `browser-image-compression` | `apps/web` | Client-side resize before upload |
| `sharp` | `apps/api` | Server-side validation/recompress (already installed) |
| `multer` or `busboy` | `apps/api` | Multipart form parsing (if API-mediated upload) |
| Supabase Storage | Cloud | Bucket `reward-images` |

**Environment variables:**

```env
# apps/api/.env.example
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=          # server only — never expose to web
SUPABASE_STORAGE_BUCKET=reward-images
UPLOAD_MAX_BYTES=2097152            # 2MB

# apps/web/.env.example (if client direct upload)
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=             # publishable/anon key only
```

## 4. MCPs to Utilize

| MCP | Cursor mapping | When to use |
|-----|----------------|-------------|
| `@modelcontextprotocol/server-filesystem` | Built-in Read/Write | Client factory, API route, UI, tests |
| `@modelcontextprotocol/server-git` | Shell `git` | Branch `feature/supabase-image-upload` |
| `@modelcontextprotocol/server-supabase` | `plugin-supabase-supabase` | `search_docs`, bucket/RLS setup, `get_advisors` |
| `@modelcontextprotocol/server-postgres` | Supabase SQL / Prisma | Verify no schema change needed (URL stays string) |
| `@modelcontextprotocol/server-browser` | `cursor-ide-browser` | Test drag-drop upload in admin rewards |

### Supabase MCP workflow

1. `list_projects` → identify project ID
2. `search_docs` → "storage RLS authenticated upload"
3. Create bucket + policies via Supabase dashboard or SQL migration
4. `get_advisors` → verify no storage security warnings

## 5. Engineering Rules

### TDD

- Write failing unit tests for `validateImageFile(mime, size)` before upload route.
- Write failing integration test: non-admin upload → 403.
- Write failing test: oversize file → 413/400.
- Mock Supabase Storage client in API tests.

### Clean Code

- **Factory**: `createSupabaseAdminClient()` — single place for service role client.
- **Validate-then-upload pipeline**: validate MIME/size → compress → upload → return public URL.
- Keep `imageUrl` as string in DB — no binary in Postgres.

### Design Patterns

- **Adapter**: `StorageService` wraps Supabase SDK (swappable for S3 later).
- **Controller → Service** for upload endpoint.
- Presentational `ImageUploadField` in admin modals.

### Best Practices

- **Never** commit or expose `SUPABASE_SERVICE_ROLE_KEY` to frontend.
- MIME allowlist: `image/jpeg`, `image/png`, `image/webp` only.
- Max size: 2MB after compression.
- Filename: UUID + extension — no user-supplied paths (path traversal prevention).
- RLS: authenticated admins write; public read for reward display URLs.
- Run `npm run lint`, `npm run check-types`, targeted tests.

## 6. Step-by-Step Implementation Checklist

### Phase A — Supabase Storage setup

- [x] **MCP: supabase** — `list_projects` to confirm project.
- [x] **MCP: supabase** — `search_docs` for Storage bucket creation and RLS.
- [x] Create bucket `reward-images` (public read for objects, or signed URLs — prefer public read for reward thumbnails).
- [x] Apply RLS policies via SQL (service-role writes only; no anon/authenticated INSERT — public bucket CDN read):

```sql
-- Shipped: public bucket + service-role uploads via API (no client write policy)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reward-images', 'reward-images', true, 2097152,
  ARRAY['image/jpeg','image/png','image/webp']::text[])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
```

- [x] **MCP: supabase** — `get_advisors` for storage security review.

### Phase B — API upload route (TDD)

- [x] **MCP: filesystem** — `npm install @supabase/supabase-js` in `apps/api`.
- [x] **MCP: filesystem** — Add env vars to `apps/api/.env.example` and [`env.ts`](../../apps/api/src/config/env.ts).
- [x] **Write test first**: `apps/api/src/modules/upload/__tests__/validateImage.test.ts`.
- [x] **Write test first**: `apps/api/src/__tests__/integration/admin.upload.test.ts` (403 non-admin, 400 bad mime).
- [x] **MCP: filesystem** — Create `apps/api/src/config/supabase.ts` (admin client factory).
- [x] **MCP: filesystem** — Create `StorageService.uploadRewardImage(file, adminId)`.
- [x] **MCP: filesystem** — Create `POST /api/v1/admin/uploads/reward-image`.
- [x] Mount route in admin routes module.
- [x] Run tests → green.

### Phase C — Frontend upload UI (TDD)

- [x] **MCP: filesystem** — `npm install browser-image-compression` in `apps/web`.
- [x] **Write test first**: `ImageUploadField.test.tsx` — rejects non-image, shows preview.
- [x] **MCP: filesystem** — Create `apps/web/src/components/admin/ImageUploadField.tsx`.
- [x] **MCP: filesystem** — Integrate into [`EditRewardModal.tsx`](../../apps/web/src/components/admin/EditRewardModal.tsx) and create reward form.
- [x] Keep manual URL input as fallback (advanced toggle).

### Phase D — Documentation

- [x] **MCP: filesystem** — Update [`docs/API.md`](../API.md) with upload endpoint.
- [x] **MCP: filesystem** — Update [`docs/DEPLOYMENT.md`](../DEPLOYMENT.md) with Supabase Storage env vars.

## 7. UI/UX Implementation Details

### Upload flow

1. Admin opens Edit Reward modal.
2. Drag image onto drop zone or click to browse.
3. Client compresses → shows preview.
4. On save (or immediate upload on select): POST to API → receive URL → populate `imageUrl`.
5. Existing URL field shows uploaded URL (read-only or editable fallback).

### File limits

| Constraint | Value |
|------------|-------|
| Max file size | 2 MB (after compression) |
| Allowed MIME | `image/jpeg`, `image/png`, `image/webp` |
| Max dimensions | 1920×1920 (resize down) |
| Output format | WebP preferred (via sharp) |

### Error states

- File too large: "Imagem muito grande. Máximo 2 MB."
- Wrong type: "Formato não suportado. Use JPG, PNG ou WebP."
- Upload failed: "Falha no envio. Tente novamente."

## 8. Code Snippets / Pseudo-code

### Supabase admin client

```typescript
// apps/api/src/config/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

export function createSupabaseAdminClient() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}
```

### StorageService

```typescript
// apps/api/src/modules/upload/services/StorageService.ts
export class StorageService {
  async uploadRewardImage(buffer: Buffer, mime: string): Promise<string> {
    validateImageFile(mime, buffer.length);
    const optimized = await sharp(buffer)
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const path = `rewards/${crypto.randomUUID()}.webp`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(path, optimized, { contentType: "image/webp", upsert: false });

    if (error) throw new InternalServerError("Upload failed");

    const { data } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }
}
```

### validateImageFile

```typescript
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validateImageFile(mime: string, size: number): void {
  if (!ALLOWED.has(mime)) throw new BadRequestError("Unsupported image type");
  if (size > env.UPLOAD_MAX_BYTES) throw new BadRequestError("File too large");
}
```

### ImageUploadField (web)

```tsx
import imageCompression from "browser-image-compression";

export function ImageUploadField({ value, onChange }: Props) {
  const onFile = async (file: File) => {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    });
    const form = new FormData();
    form.append("file", compressed);
    const { url } = await adminApi.uploadRewardImage(form);
    onChange(url);
  };

  return (
    <div
      onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
      onDragOver={(e) => e.preventDefault()}
    >
      {value ? <img src={value} alt="Preview" /> : <p>Arraste uma imagem ou clique para selecionar</p>}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(e.target.files![0])} />
    </div>
  );
}
```

## 9. Testing & Success Criteria

### Automated

- [x] `validateImageFile` rejects `application/pdf` and files > 2MB.
- [x] Integration: admin upload returns public URL; mock Supabase client.
- [x] Integration: non-admin → 403.
- [x] RTL: `ImageUploadField` shows preview after mock upload.
- [ ] `npm run lint`, `npm run check-types` clean.

### Manual (MCP: browser + supabase)

- [ ] Upload JPG in admin reward modal → URL populated → image visible on Rewards page.
- [x] Upload oversize file → error message (client + API validation).
- [x] **MCP: supabase** — `get_advisors` shows no critical storage vulnerabilities.
- [ ] Public reward image URL loads without auth.

### Success criteria

Supabase upload complete when bucket/RLS configured, admin can upload compressed reward images via UI, validation enforced, service role key server-only, and tests pass.
