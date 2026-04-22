# Vercel + Render + Supabase Deployment Design

**Problem**

The application currently runs locally and in Docker, but it is not prepared for the target production setup:
- frontend on Vercel
- backend API on Render
- PostgreSQL on Supabase
- private medical document storage on Supabase Storage
- source control and deployment source from a new GitHub repository under `Muhammadabrarrayhan2/curalyta`

The current codebase still assumes local disk storage for uploaded files and a simpler local/development deployment model.

**Goals**

- Deploy the frontend to Vercel using the existing `frontend` app
- Deploy the backend to Render using the existing `backend` app
- Move production database traffic to Supabase Postgres
- Move uploaded document storage to a private Supabase Storage bucket
- Keep the frontend API contract simple by preserving relative `/api` requests
- Keep document access private and enforced by backend authorization checks
- Ensure secrets are not exposed in GitHub or frontend bundles
- Keep the rollout practical for default hosted plans and manual dashboard-based deployment

**Non-Goals**

- Adding custom production domains in the first rollout
- Moving authentication to Supabase Auth
- Letting the frontend upload directly to Supabase Storage
- Making document buckets public
- Refactoring unrelated product features during deployment work

**Recommendation**

Use Vercel external rewrites so the frontend continues calling `/api`, while Vercel proxies those requests to the Render backend. This is the smallest migration from the current frontend behavior and avoids pushing cross-origin complexity into the app layer.

Use Supabase Postgres for production data and a private Supabase Storage bucket for documents. Keep all upload and download operations on the backend so authorization stays centralized in the Express API.

**Design**

## 1. Platform topology

The deployed system will use one GitHub repository and three hosted services:

- GitHub repository: `Muhammadabrarrayhan2/curalyta`
- Vercel project for `frontend`
- Render web service for `backend`
- Supabase project for Postgres and Storage

The frontend remains a static SPA built from the `frontend` workspace. The backend remains an Express API built from the `backend` workspace. Supabase stores production relational data and document files.

The first rollout will use platform default hostnames:
- frontend: `*.vercel.app`
- backend: `*.onrender.com`
- database and storage: Supabase-managed hostnames

## 2. Frontend deployment on Vercel

The Vercel project will target the `frontend` directory as the root directory for the monorepo deployment.

Frontend API calls will continue to use the existing relative `/api` base URL. A `vercel.json` file will be added in `frontend` so production behavior matches the current app assumptions:

- SPA deep links rewrite to `index.html`
- `/api/:path*` rewrites to the Render backend origin

This approach keeps browser-visible URLs clean and minimizes frontend code changes. The frontend does not need Supabase credentials for this rollout.

## 3. Backend deployment on Render

The Render service will target the `backend` directory as its root directory. It will run as a public web service with:

- build command for dependency install and TypeScript build
- start command for `dist/server.js`
- health check path using `/api/health`

The backend must remain the only component that knows:
- database credentials
- Supabase storage service credentials
- JWT secret
- AI provider credentials when AI features remain enabled in production

Backend CORS will be narrowed for hosted environments. It must allow:
- the Vercel production URL
- Vercel preview URLs if preview deployments are desired
- local development origins as needed

The backend startup path should also be made Render-safe by respecting the injected `PORT` and binding in a hosted environment reliably.

## 4. Production database on Supabase Postgres

Production database traffic will move from local/Docker Postgres to Supabase Postgres.

The backend will use two production connection strings:

- `DATABASE_URL` for application runtime
- `DIRECT_URL` for Prisma CLI operations such as migrations

Prisma configuration will be updated to support the Supabase-recommended split between pooled runtime access and direct migration access. This reduces connection risk in hosted environments while keeping migrations predictable.

The production migration strategy for the first rollout is:

1. provision Supabase project
2. configure Render environment variables
3. deploy backend
4. run `prisma migrate deploy` against production with `DIRECT_URL`
5. verify application health and seeded admin behavior

If a Render plan later supports automatic pre-deploy migrations for this service configuration, that can be adopted as a follow-up improvement. It is not required for the first rollout.

## 5. Private document storage on Supabase Storage

The current document module writes uploads to local disk using `multer.diskStorage`. This is not appropriate for Render because local filesystem changes are not durable across deploys and instance replacement.

Document storage will move to a private Supabase bucket, for example `medical-documents`.

The upload flow will be:

1. authenticated browser sends multipart upload to backend
2. backend validates role, patient ownership, file type, and file size
3. backend uploads the binary to Supabase Storage using server-side credentials
4. backend stores document metadata and storage object path in Postgres

The download flow will be:

1. authenticated browser requests download from backend
2. backend validates access rights for doctor, patient, or admin
3. backend fetches or streams the object from private Supabase Storage
4. backend returns the file response to the browser

This preserves strict access control for medical documents. No permanent public URL will be generated. The frontend will not download directly from Supabase in the first rollout.

The delete flow must remove both:
- the metadata row in Postgres
- the underlying object in Supabase Storage

Failure handling must avoid half-complete states as much as practical:
- failed upload must not leave a database record behind
- failed object deletion after metadata deletion must be logged clearly for later cleanup

## 6. Secret management and repository hygiene

The repository pushed to GitHub must never contain real production secrets.

Required backend-only secrets include:
- `JWT_SECRET`
- `DATABASE_URL`
- `DIRECT_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` when clinical AI is enabled in production
- `GEMINI_API_KEY` when public AI is enabled in production

Frontend environment variables should remain browser-safe only. For the recommended architecture, the frontend likely needs no secret environment variables.

The repository should include:
- safe example environment files
- updated deployment documentation
- `.gitignore` coverage for local env files and generated secrets

The first rollout will use manual dashboard configuration in GitHub, Vercel, Render, and Supabase rather than introducing extra infrastructure-as-code tooling during the same change set.

## 7. GitHub publishing

The project will be published to a new GitHub repository:
- owner: `Muhammadabrarrayhan2`
- repository: `curalyta`

The local repository currently has no configured remote, so the rollout must include:
- creating the GitHub repository
- adding the remote
- pushing the working branch

After GitHub is connected:
- Vercel will import the repo and use `frontend` as root directory
- Render will import the same repo and use `backend` as root directory

## 8. Rollout sequence

The recommended rollout order is:

1. prepare repository hygiene and example env files
2. add code changes for Vercel, Render, Supabase database, and Supabase Storage
3. verify local build and key flows
4. create and push the GitHub repository
5. provision Supabase project, database credentials, and private bucket
6. create Render backend service and configure secrets
7. deploy backend and run production migrations
8. verify backend health and document operations
9. create Vercel frontend project and configure API rewrite target
10. verify SPA routing, auth, CRUD flows, and document download behavior

## 9. Validation

Deployment is considered successful when all of the following are true:

- GitHub repository exists at `Muhammadabrarrayhan2/curalyta`
- Vercel serves the frontend correctly from `*.vercel.app`
- frontend deep links work after refresh
- frontend `/api/*` calls succeed through Vercel rewrite to Render
- Render backend passes `/api/health`
- backend reads and writes production data in Supabase Postgres
- default admin creation or seed behavior remains functional
- document upload stores files in a private Supabase bucket
- authorized users can download documents
- unauthorized users receive access denial
- no production secret is committed to Git or exposed in frontend assets

**Files Expected To Change**

- `frontend/vercel.json`
- `backend/package.json`
- `backend/src/config/index.ts`
- `backend/src/lib/prisma.ts`
- `backend/src/modules/documents/documents.module.ts`
- `backend/src/server.ts`
- `backend/.env.example`
- `backend/prisma.config.ts`
- root `.env.docker.example` or related examples if production guidance is updated
- `README.md`

**Risks and Mitigations**

- Render local disk is non-durable
  - Mitigation: move all document persistence to Supabase Storage
- Connection exhaustion against hosted Postgres
  - Mitigation: separate runtime and migration connection settings for Supabase
- Misconfigured CORS blocking frontend traffic
  - Mitigation: make production origin configuration explicit and documented
- Secret leakage through repo or client bundle
  - Mitigation: keep Supabase service key and database URLs server-only, verify ignored files before push
- Broken deep links on Vercel SPA deployment
  - Mitigation: add explicit SPA fallback rewrite in `vercel.json`

**Validation Commands**

- `npm run build --workspace=backend`
- `npm run build --workspace=frontend`
- `npm run typecheck --workspace=backend`
- `npm run typecheck --workspace=frontend`
- targeted manual verification for document upload and download after hosted deployment
