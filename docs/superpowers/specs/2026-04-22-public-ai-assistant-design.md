# Public AI Assistant Design

**Problem**

Public visitors currently cannot try any AI capability without authentication. The product needs a `Tanya AI` feature that is directly usable from the public site without login or registration first.

**Goals**

- Add a public `Tanya AI` entry point on the landing page navigation
- Provide a public AI chat experience that works without authentication
- Use a free-tier AI provider for now
- Keep existing doctor-only AI workflows unchanged
- Avoid breaking auth, doctor flows, or admin flows

**Recommendation**

Use a separate public AI route powered by Gemini API free tier. This is the cleanest option because:
- Gemini still offers an official free tier
- REST integration is straightforward from the backend
- Public chat can be rate-limited and isolated from the clinical AI stack
- Existing Anthropic-based doctor AI can remain untouched

**Design**

## 1. Public route and UI

Add a new public navigation item `Tanya AI` to the landing page. It should scroll to or open a dedicated public AI section on the landing page rather than requiring authentication.

The section will include:
- brief capability explanation
- clear safety note that this is informational, not a medical diagnosis
- suggested prompt chips
- simple chat interface with message history only in-memory on the client

## 2. Backend integration

Add a public backend endpoint under the existing public module, for example `POST /api/public/ai-chat`.

The endpoint should:
- accept a short conversation history and latest user message
- apply a dedicated public-safe system prompt
- call Gemini `generateContent` using the official REST API with `x-goog-api-key`
- return plain text response

If `GEMINI_API_KEY` is missing, return a graceful `503` with a friendly message instead of crashing.

## 3. Configuration

Add new config fields for public AI:
- `GEMINI_API_KEY`
- `GEMINI_MODEL` defaulting to a free-tier-friendly text model

This config is separate from the existing clinical Anthropic config so current doctor AI remains stable.

## 4. Safety and resilience

Public AI prompt should:
- answer in Indonesian by default
- provide general health information only
- avoid diagnosis certainty
- advise seeking professional care for urgent symptoms

Keep payloads small and enforce message length limits. Use existing API error handling so the UI shows a friendly toast/message when the provider is unavailable.

**Files Expected To Change**

- `backend/src/config/index.ts`
- `backend/src/modules/public/public.module.ts`
- `frontend/src/pages/Landing.tsx`
- `frontend/src/components/ui/Icon.tsx`
- optional shared frontend type file if needed

**Validation**

- Landing page shows `Tanya AI` in public nav
- Public user can chat without login
- Backend returns a friendly config message when Gemini key is absent
- Existing patient/doctor/admin auth still works
- Existing doctor AI endpoints remain unchanged
