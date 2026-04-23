# Neon + R2 + Render + Vercel Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move production deployment from Supabase assumptions to Neon Postgres and Cloudflare R2 while keeping existing app behavior stable and keeping document access private.

**Architecture:** Keep the current Express + Prisma + React structure intact. Add additive Prisma metadata for document storage, introduce a provider-based document storage layer with local and R2 implementations, and keep normal JSON API traffic on relative `/api` while document binary traffic uses a document-specific frontend client pointed at the backend origin. Downloads stay authorization-first on the backend, then either stream locally or follow a short-lived R2 redirect.

**Tech Stack:** TypeScript, Express, Prisma, PostgreSQL, Neon, Cloudflare R2, AWS SDK v3 for S3-compatible access, React, Axios, Vercel rewrites

---

## File Map

- Modify `backend/package.json`
  - Add the AWS SDK packages required for Cloudflare R2 uploads and presigned downloads.
- Modify `backend/.env.example`
  - Add `DIRECT_URL`, storage provider variables, and hosted CORS guidance.
- Modify `backend/prisma/schema.prisma`
  - Add `directUrl` to Prisma datasource plus additive document storage metadata fields.
- Create `frontend/.env.example`
  - Add the safe browser-side backend origin used by document-specific requests.
- Create `backend/src/modules/documents/document-storage.ts`
  - Shared types and pure helper functions for document key generation and filename sanitizing.
- Create `backend/src/modules/documents/document-local-storage.ts`
  - Local filesystem implementation for development and fallback.
- Create `backend/src/modules/documents/document-r2-storage.ts`
  - Cloudflare R2 implementation using the AWS SDK S3 client.
- Create `backend/src/modules/documents/document-storage-service.ts`
  - Provider registry used for new uploads and mixed-state record reads.
- Modify `backend/src/config/index.ts`
  - Parse Neon, R2, and hosted-origin environment variables safely.
- Modify `backend/src/server.ts`
  - Move CORS handling to exact-origin plus suffix matching for Vercel preview safety.
- Modify `backend/src/modules/documents/documents.module.ts`
  - Replace disk-first route behavior with provider-backed upload, download, and delete flows.
- Create `backend/test/documents.storage.test.cjs`
  - Node test coverage for helper and provider-selection logic.
- Create `frontend/src/lib/documentApi.ts`
  - Dedicated axios client for upload and download traffic that must bypass Vercel rewrite.
- Create `frontend/vercel.json`
  - External rewrite for `/api/:path*` and SPA fallback for the Vite app.
- Modify `README.md`
  - Add Neon, R2, Render, and Vercel deployment steps plus verification guidance.

### Task 1: Add Neon, R2, and hosted deployment config contracts

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/.env.example`
- Modify: `backend/prisma/schema.prisma`
- Create: `frontend/.env.example`

- [ ] **Step 1: Install the backend packages needed for R2**

Run:

```bash
npm install --workspace=backend @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Expected: `package.json` and `package-lock.json` record the two new AWS SDK dependencies under the backend workspace.

- [ ] **Step 2: Update the Prisma datasource and additive `Document` metadata**

Add the direct migration URL and new storage fields in `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum DocumentStorageProvider {
  LOCAL
  R2
}

model Document {
  id              String                  @id @default(cuid())
  patientId       String?
  doctorId        String?
  name            String
  type            String
  size            Int
  path            String
  storageProvider DocumentStorageProvider @default(LOCAL)
  storageBucket   String?
  storageKey      String?
  category        String?
  notes           String?
  createdAt       DateTime                @default(now())

  patient Patient? @relation(fields: [patientId], references: [id], onDelete: Cascade)
  doctor  Doctor?  @relation(fields: [doctorId], references: [id], onDelete: SetNull)

  @@index([patientId])
  @@index([doctorId])
  @@index([storageProvider])
}
```

- [ ] **Step 3: Generate the Prisma migration and regenerate the client**

Run:

```bash
npm --prefix backend exec prisma migrate dev --name add_document_storage_metadata
npm --prefix backend exec prisma generate
```

Expected:
- the migration directory under `backend/prisma/migrations/` contains the new enum and columns
- Prisma Client regenerates successfully

- [ ] **Step 4: Expand the backend and frontend env examples**

Update `backend/.env.example` with the hosted configuration contract:

```env
DATABASE_URL="postgresql://USER:PASSWORD@EP-POOLER.neon.tech/curalyta?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@EP.neon.tech/curalyta?sslmode=require"
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
CORS_ORIGIN_SUFFIXES=.vercel.app
JWT_SECRET="change-this-to-a-strong-secret-min-32-chars-for-production"
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=medical-documents
R2_ENDPOINT=
R2_SIGNED_URL_TTL_SECONDS=120
```

Create `frontend/.env.example`:

```env
VITE_BACKEND_ORIGIN=http://localhost:4000
```

- [ ] **Step 5: Verify the schema and dependency contract**

Run:

```bash
npm --prefix backend run typecheck
npm --prefix backend exec prisma validate
```

Expected:
- TypeScript completes without new errors
- Prisma prints `The schema at prisma/schema.prisma is valid`

- [ ] **Step 6: Commit the config-contract changes**

Run:

```bash
git add backend/package.json package-lock.json backend/.env.example backend/prisma/schema.prisma backend/prisma/migrations frontend/.env.example
git commit -m "chore: add Neon and R2 deployment config contract"
```

### Task 2: Add document storage helpers with backend tests first

**Files:**
- Create: `backend/src/modules/documents/document-storage.ts`
- Create: `backend/test/documents.storage.test.cjs`

- [ ] **Step 1: Write the failing storage helper tests**

Create `backend/test/documents.storage.test.cjs`:

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

const {
  sanitizeDocumentFilename,
  buildDocumentObjectKey,
} = require('../dist/modules/documents/document-storage.js');

test('sanitizeDocumentFilename replaces unsafe characters deterministically', () => {
  assert.equal(
    sanitizeDocumentFilename('Hasil Lab (Ibu/Siti).pdf'),
    'Hasil_Lab__Ibu_Siti_.pdf'
  );
});

test('buildDocumentObjectKey nests doctor and patient ids predictably', () => {
  const key = buildDocumentObjectKey({
    doctorId: 'doc_123',
    patientId: 'pat_456',
    originalName: 'hasil lab.pdf',
    timestamp: new Date('2026-04-23T10:11:12.000Z'),
    randomSuffix: 'abc123',
  });

  assert.equal(
    key,
    'doctor-doc_123/patient-pat_456/2026/04/23/20260423T101112000Z-abc123-hasil_lab.pdf'
  );
});
```

- [ ] **Step 2: Run the test command to verify it fails**

Run:

```bash
npm --prefix backend run build
node --test backend/test/documents.storage.test.cjs
```

Expected: FAIL because `../dist/modules/documents/document-storage.js` does not exist yet.

- [ ] **Step 3: Implement the shared storage types and pure helpers**

Create `backend/src/modules/documents/document-storage.ts`:

```ts
export type DocumentProviderName = 'LOCAL' | 'R2';

export interface DocumentUploadInput {
  doctorId: string;
  patientId: string | null;
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface StoredDocumentObject {
  provider: DocumentProviderName;
  bucket: string | null;
  key: string;
  absolutePath?: string;
}

function compactIso(value: Date): string {
  return value.toISOString().replace(/[-:.TZ]/g, '');
}

export function sanitizeDocumentFilename(originalName: string): string {
  return originalName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
}

export function buildDocumentObjectKey(input: {
  doctorId: string;
  patientId: string | null;
  originalName: string;
  timestamp?: Date;
  randomSuffix?: string;
}): string {
  const timestamp = input.timestamp ?? new Date();
  const randomSuffix = input.randomSuffix ?? Math.random().toString(36).slice(2, 8);
  const safeName = sanitizeDocumentFilename(input.originalName).replace(/ /g, '_');
  const yyyy = timestamp.getUTCFullYear();
  const mm = String(timestamp.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(timestamp.getUTCDate()).padStart(2, '0');

  return [
    `doctor-${input.doctorId}`,
    input.patientId ? `patient-${input.patientId}` : 'patient-unassigned',
    String(yyyy),
    mm,
    dd,
    `${compactIso(timestamp)}-${randomSuffix}-${safeName}`,
  ].join('/');
}
```

- [ ] **Step 4: Re-run build and helper tests**

Run:

```bash
npm --prefix backend run build
node --test backend/test/documents.storage.test.cjs
```

Expected: PASS for both helper tests.

- [ ] **Step 5: Commit the helper layer**

Run:

```bash
git add backend/src/modules/documents/document-storage.ts backend/test/documents.storage.test.cjs
git commit -m "test: cover document storage helpers"
```

### Task 3: Add local and R2 providers plus provider selection

**Files:**
- Create: `backend/src/modules/documents/document-local-storage.ts`
- Create: `backend/src/modules/documents/document-r2-storage.ts`
- Create: `backend/src/modules/documents/document-storage-service.ts`
- Modify: `backend/src/config/index.ts`
- Modify: `backend/test/documents.storage.test.cjs`

- [ ] **Step 1: Extend the test file with provider registry expectations**

Append these tests to `backend/test/documents.storage.test.cjs`:

```javascript
const { createDocumentStorageRegistry } = require('../dist/modules/documents/document-storage-service.js');

test('registry uses R2 for new uploads when storage provider is r2', () => {
  const registry = createDocumentStorageRegistry({
    provider: 'r2',
    uploadDir: './uploads',
    r2: {
      bucket: 'medical-documents',
      endpoint: 'https://example.r2.cloudflarestorage.com',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      signedUrlTtlSeconds: 120,
    },
  });

  assert.equal(registry.active.provider, 'R2');
});

test('registry still resolves legacy local documents when active provider is r2', () => {
  const registry = createDocumentStorageRegistry({
    provider: 'r2',
    uploadDir: './uploads',
    r2: {
      bucket: 'medical-documents',
      endpoint: 'https://example.r2.cloudflarestorage.com',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      signedUrlTtlSeconds: 120,
    },
  });

  assert.equal(registry.forRecord('LOCAL').provider, 'LOCAL');
  assert.equal(registry.forRecord('R2').provider, 'R2');
});
```

- [ ] **Step 2: Run the tests to verify the provider layer is still missing**

Run:

```bash
npm --prefix backend run build
node --test backend/test/documents.storage.test.cjs
```

Expected: FAIL because `document-storage-service.js` does not exist yet.

- [ ] **Step 3: Implement the local filesystem provider**

Create `backend/src/modules/documents/document-local-storage.ts`:

```ts
import fs from 'fs/promises';
import path from 'path';
import {
  buildDocumentObjectKey,
  type DocumentUploadInput,
  type StoredDocumentObject,
} from './document-storage';

export class LocalDocumentStorage {
  readonly provider = 'LOCAL' as const;

  constructor(private readonly uploadDir: string) {}

  async save(input: DocumentUploadInput): Promise<StoredDocumentObject> {
    const key = buildDocumentObjectKey(input);
    const absolutePath = path.join(this.uploadDir, key);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, input.buffer);
    return { provider: 'LOCAL', bucket: null, key, absolutePath };
  }

  async delete(key: string): Promise<void> {
    const absolutePath = path.join(this.uploadDir, key);
    await fs.unlink(absolutePath).catch(() => {});
  }

  getAbsolutePath(key: string): string {
    return path.join(this.uploadDir, key);
  }
}
```

- [ ] **Step 4: Implement the R2 provider and provider registry**

Create `backend/src/modules/documents/document-r2-storage.ts` and `backend/src/modules/documents/document-storage-service.ts`:

```ts
// backend/src/modules/documents/document-r2-storage.ts
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { DocumentUploadInput, StoredDocumentObject } from './document-storage';

export class R2DocumentStorage {
  readonly provider = 'R2' as const;
  private readonly client: S3Client;

  constructor(
    private readonly options: {
      bucket: string;
      endpoint: string;
      accessKeyId: string;
      secretAccessKey: string;
      signedUrlTtlSeconds: number;
    }
  ) {
    this.client = new S3Client({
      region: 'auto',
      endpoint: options.endpoint,
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async save(input: DocumentUploadInput): Promise<StoredDocumentObject> {
    const { buildDocumentObjectKey } = await import('./document-storage');
    const key = buildDocumentObjectKey(input);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      })
    );

    return { provider: 'R2', bucket: this.options.bucket, key };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
      })
    );
  }

  async getSignedDownloadUrl(key: string, fileName: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.options.bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, '')}"`,
      }),
      { expiresIn: this.options.signedUrlTtlSeconds }
    );
  }
}

// backend/src/modules/documents/document-storage-service.ts
import { LocalDocumentStorage } from './document-local-storage';
import { R2DocumentStorage } from './document-r2-storage';

export function createDocumentStorageRegistry(options: {
  provider: 'local' | 'r2';
  uploadDir: string;
  r2: {
    bucket: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    signedUrlTtlSeconds: number;
  };
}) {
  const local = new LocalDocumentStorage(options.uploadDir);
  let r2: R2DocumentStorage | null = null;

  function getR2() {
    if (!r2) {
      r2 = new R2DocumentStorage(options.r2);
    }
    return r2;
  }

  return {
    get active() {
      return options.provider === 'r2' ? getR2() : local;
    },
    forRecord(provider: 'LOCAL' | 'R2') {
      return provider === 'R2' ? getR2() : local;
    },
  };
}
```

- [ ] **Step 5: Parse the new storage config in `backend/src/config/index.ts`**

Add a storage section:

```ts
  storage: {
    provider: optional('STORAGE_PROVIDER', 'local').toLowerCase() === 'r2' ? 'r2' : 'local',
    uploadDir: optional('UPLOAD_DIR', './uploads'),
    r2: {
      bucket: optional('R2_BUCKET', 'medical-documents'),
      endpoint: optional('R2_ENDPOINT', ''),
      accessKeyId: optional('R2_ACCESS_KEY_ID', ''),
      secretAccessKey: optional('R2_SECRET_ACCESS_KEY', ''),
      signedUrlTtlSeconds: asNumber('R2_SIGNED_URL_TTL_SECONDS', 120),
    },
  },
```

Keep the existing `upload.maxMB` config because the upload limit is still enforced in the document route.

- [ ] **Step 6: Re-run build and tests**

Run:

```bash
npm --prefix backend run build
node --test backend/test/documents.storage.test.cjs
```

Expected: PASS for helper and provider-registry tests.

- [ ] **Step 7: Commit the provider layer**

Run:

```bash
git add backend/src/modules/documents/document-local-storage.ts backend/src/modules/documents/document-r2-storage.ts backend/src/modules/documents/document-storage-service.ts backend/src/config/index.ts backend/test/documents.storage.test.cjs
git commit -m "feat: add local and R2 document storage providers"
```

### Task 4: Rewire document routes to use provider-backed storage safely

**Files:**
- Modify: `backend/src/modules/documents/documents.module.ts`

- [ ] **Step 1: Switch document uploads from disk storage to memory storage**

Replace the multer setup in `backend/src/modules/documents/documents.module.ts`:

```ts
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.upload.maxMB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`));
  },
});
```

Delete the eager upload-directory creation block at the top of the file because local directories now belong inside the local provider implementation.

- [ ] **Step 2: Save uploads through the active storage provider and persist additive metadata**

At module scope, instantiate the provider registry:

```ts
const documentStorage = createDocumentStorageRegistry({
  provider: config.storage.provider,
  uploadDir: config.storage.uploadDir,
  r2: config.storage.r2,
});
```

In the `POST /documents` handler, replace the local-disk write assumption:

```ts
const stored = await documentStorage.active.save({
  doctorId: req.doctor!.id,
  patientId: parsed.data.patientId ?? null,
  originalName: req.file.originalname,
  mimeType: req.file.mimetype,
  size: req.file.size,
  buffer: req.file.buffer,
});

try {
  const doc = await prisma.document.create({
    data: {
      doctorId: req.doctor!.id,
      patientId: parsed.data.patientId || null,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      path: stored.key,
      storageProvider: stored.provider,
      storageBucket: stored.bucket,
      storageKey: stored.key,
      category: parsed.data.category || null,
      notes: parsed.data.notes || null,
    },
  });

  res.status(201).json({ document: doc });
} catch (error) {
  await documentStorage.active.delete(stored.key).catch(() => {});
  throw error;
}
```

- [ ] **Step 3: Download via provider-aware fallback instead of assuming local disk**

Replace the download branch:

```ts
const storageKey = doc.storageKey ?? doc.path;

if (doc.storageProvider === 'R2') {
  const provider = documentStorage.forRecord('R2');
  const signedUrl = await provider.getSignedDownloadUrl(storageKey, doc.name);
  return res.redirect(signedUrl);
}

const provider = documentStorage.forRecord('LOCAL');
const fullPath = provider.getAbsolutePath(storageKey);
if (!fs.existsSync(fullPath)) {
  throw new NotFoundError('File tidak ditemukan di server');
}

return res.download(fullPath, doc.name);
```

This keeps legacy local documents readable while new R2 documents use short-lived signed access.

- [ ] **Step 4: Delete storage first, then metadata**

Replace the delete handler:

```ts
const storageKey = doc.storageKey ?? doc.path;

if (doc.storageProvider === 'R2') {
  await documentStorage.forRecord('R2').delete(storageKey);
} else {
  await documentStorage.forRecord('LOCAL').delete(storageKey);
}

await prisma.document.delete({ where: { id: req.params.id } });

res.json({ success: true });
```

If `provider.delete` throws, let the request fail so the metadata row is not removed while the object still exists.

- [ ] **Step 5: Verify local fallback behavior before touching hosted deployment**

Run:

```bash
npm --prefix backend run build
npm --prefix backend run typecheck
```

Then manually verify in local development with `STORAGE_PROVIDER=local`:
- doctor upload still returns `201`
- doctor list still shows the created document
- patient cannot access another patient's document
- delete removes the document record and local file

- [ ] **Step 6: Commit the route migration**

Run:

```bash
git add backend/src/modules/documents/documents.module.ts
git commit -m "feat: migrate document routes to provider-backed storage"
```

### Task 5: Add hosted-origin document client and Vercel routing

**Files:**
- Modify: `backend/src/config/index.ts`
- Modify: `backend/src/server.ts`
- Create: `frontend/src/lib/documentApi.ts`
- Create: `frontend/vercel.json`
- Modify: `frontend/.env.example`

- [ ] **Step 1: Parse exact and suffix-based CORS settings**

Add helpers to `backend/src/config/index.ts`:

```ts
function asCsv(name: string, fallback: string[] = []): string[] {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(',').map((value) => value.trim()).filter(Boolean);
}
```

Then replace the old single-string CORS config with:

```ts
  cors: {
    origins: asCsv('CORS_ORIGIN', ['http://localhost:5173']),
    originSuffixes: asCsv('CORS_ORIGIN_SUFFIXES', []),
  },
```

- [ ] **Step 2: Update Express CORS to allow Vercel previews safely**

Replace the `cors()` block in `backend/src/server.ts`:

```ts
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (config.cors.origins.includes(origin)) return callback(null, true);
      if (config.cors.originSuffixes.some((suffix) => origin.endsWith(suffix))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin tidak diizinkan: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
```

- [ ] **Step 3: Add a dedicated frontend client for document traffic**

Create `frontend/src/lib/documentApi.ts`:

```ts
import axios from 'axios';
import { tokenStorage } from '@/lib/api';

function getDocumentApiBaseUrl() {
  const configured = import.meta.env.VITE_BACKEND_ORIGIN?.trim();
  const base = configured ? configured.replace(/\/$/, '') : '';
  return base ? `${base}/api` : '/api';
}

export const documentApi = axios.create({
  baseURL: getDocumentApiBaseUrl(),
  timeout: 60_000,
});

documentApi.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function downloadDocument(documentId: string) {
  return documentApi.get(`/documents/${documentId}/download`, {
    responseType: 'blob',
  });
}

export async function uploadDocument(formData: FormData) {
  return documentApi.post('/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}
```

Do not wire this helper into pages yet; there is no current frontend document screen in the repo, and introducing one now would expand scope beyond the deployment migration.

- [ ] **Step 4: Add Vercel project routing for the frontend workspace**

Create `frontend/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://curalyta-api.onrender.com/api/:path*"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

Set the Render service name to `curalyta-api` so the hostname matches this committed config.

- [ ] **Step 5: Verify frontend build and non-document auth flows still work**

Run:

```bash
npm --prefix frontend run build
npm --prefix frontend run typecheck
```

Expected:
- Vite builds successfully with the new `documentApi` helper
- existing login and dashboard flows remain untouched because `api.ts` still owns normal JSON traffic

- [ ] **Step 6: Commit the hosted frontend/backend wiring**

Run:

```bash
git add backend/src/config/index.ts backend/src/server.ts frontend/src/lib/documentApi.ts frontend/vercel.json frontend/.env.example
git commit -m "feat: add hosted document client and Vercel routing"
```

### Task 6: Update deployment docs and run the full verification pass

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add Neon and R2 deployment guidance to the README**

Append a deployment section to `README.md` covering:

```md
## Hosted Deployment

### Backend on Render
- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Health check path: `/api/health`

### Database on Neon
- `DATABASE_URL` uses the pooled connection string
- `DIRECT_URL` uses the direct connection string
- Run `npm --prefix backend run db:migrate:deploy` after the first hosted deploy

### Document Storage on Cloudflare R2
- Create a private bucket named `medical-documents`
- Set `STORAGE_PROVIDER=r2`
- Set `R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- Set `R2_SIGNED_URL_TTL_SECONDS=120`

### Frontend on Vercel
- Root directory: `frontend`
- `VITE_BACKEND_ORIGIN=https://curalyta-api.onrender.com`
- `vercel.json` keeps `/api/*` traffic proxied to Render
```

- [ ] **Step 2: Run the final local verification commands**

Run:

```bash
npm --prefix backend run build
npm --prefix backend run typecheck
node --test backend/test/documents.storage.test.cjs
npm --prefix frontend run build
npm --prefix frontend run typecheck
```

Expected: every command exits with code `0`.

- [ ] **Step 3: Run the hosted smoke checklist after deployment**

Verify these behaviors in the deployed environments:
- `GET https://curalyta-api.onrender.com/api/health` returns `status: ok`
- standard frontend API traffic still works through `/api`
- doctor upload works with `STORAGE_PROVIDER=r2`
- doctor download follows backend auth and succeeds
- patient can access only their own documents
- deleting a document removes both the R2 object and the database row
- Vercel preview URLs pass CORS because of `.vercel.app` suffix matching

- [ ] **Step 4: Commit the deployment runbook**

Run:

```bash
git add README.md
git commit -m "docs: add Neon and R2 deployment runbook"
```

## Self-Review Notes

- Spec coverage:
  - Neon database split is covered in Task 1 and Task 6.
  - R2 private storage is covered in Tasks 2, 3, and 4.
  - additive schema migration is covered in Task 1 and respected in Task 4.
  - direct backend-origin document traffic is covered in Task 5.
  - Vercel SPA and `/api` rewrite behavior is covered in Task 5.
  - deployment docs and validation are covered in Task 6.
- Placeholder scan:
  - No `TODO`, `TBD`, or deferred “implement later” markers remain.
  - Render service name is fixed as `curalyta-api` so `frontend/vercel.json` is concrete.
- Type consistency:
  - `DocumentStorageProvider` uses `LOCAL | R2` in Prisma and the provider registry uses the same pair.
  - the frontend keeps `api.ts` for standard JSON calls and `documentApi.ts` for document-specific binary traffic.
