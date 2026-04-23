# Public AI Image Upload And Light-Symptom Response Design

**Problem**

Public `Tanya AI` already works for text chat, but it still pushes users toward medical escalation too early for mild complaints and it cannot accept images. The product needs a safer and more useful public AI flow that:
- keeps mild-symptom responses practical and calming,
- only escalates to doctor care for clearly serious cases,
- accepts optional images for analysis,
- uses uploaded images only temporarily and discards them after processing,
- and remains stable without breaking the existing text-only path.

**Goals**

- Keep text-only `Tanya AI` working as it does today, with better answer quality
- Add optional image upload to public AI chat
- Use the uploaded image only in-memory for one request, then discard it
- Support image-assisted answers for visible complaints and general complaints
- Make responses more aligned with likely patient needs and self-care first
- Reduce unnecessary “go to doctor” guidance for genuinely mild complaints
- Preserve hard red-flag escalation for severe or dangerous symptoms
- Avoid introducing brittle request flows or server crashes

**Non-Goals**

- Persistent image storage
- Saving uploaded images to disk or database
- Full medical diagnosis from photos
- Replacing doctor workflows or clinical AI
- Advanced multi-image case management

**Recommendation**

Use a single public AI endpoint with two request modes:

1. JSON text-only requests for the existing fast path
2. `multipart/form-data` requests when the user includes an image

For image requests, the backend should process the uploaded file in memory only, choose a vision-capable Gemini model automatically, call the provider once, and then discard the image buffer immediately after the request completes.

This is the best tradeoff because it:
- preserves the stable text-only path,
- keeps privacy simple,
- avoids storing sensitive images,
- gives the frontend a predictable user experience,
- and isolates image-specific failure modes from the standard chat flow.

## 1. Public AI Backend Flow

The public route remains under `POST /api/public/ai-chat`, but the handler accepts both:
- `application/json` for text-only chat
- `multipart/form-data` for text plus optional image

The backend will:
- detect content type,
- validate message and optional history,
- validate optional image type and size,
- keep the image in memory only,
- map the request to the correct Gemini request body,
- select the appropriate model automatically,
- and return a plain text reply exactly as the current frontend expects.

### Request handling rules

- Text-only requests stay on the current text model path
- Requests with one image switch to a vision-capable Gemini model
- Only one image is allowed per message for this version
- Allowed mime types: `image/jpeg`, `image/png`, `image/webp`
- Disallowed files fail with a friendly validation error
- Oversized files fail with a friendly validation error
- The uploaded image must never be written to disk

### Stability rules

- If the image-analysis provider call fails, the endpoint returns a friendly message instead of crashing
- If the provider rejects the image, the error returned to the UI should explain that the image could not be analyzed and suggest retrying with a clearer image
- Text-only mode must remain fully functional even if the image path has an issue
- Provider-specific model capability checks live in one backend helper so model switching is explicit and testable

## 2. Model Selection Strategy

The system should separate:
- text model for normal chat
- vision-capable model for image requests

The backend config should add a dedicated `GEMINI_VISION_MODEL` environment variable rather than overloading the current text model. This keeps the routing explicit and reduces hidden capability mismatches.

Selection rules:
- no image -> use `GEMINI_MODEL`
- with image -> use `GEMINI_VISION_MODEL`

This prevents repeating the recent failure mode where a model accepted text but rejected a specific request format.

## 3. Prompt And Response Policy

The public AI response policy should be adjusted to make the assistant more useful for mild complaints.

### Response priorities

For mild complaints, the assistant should answer in this order:
- what is most likely going on,
- what the user can do right now,
- what safe non-prescription options may help,
- what to monitor next,
- and only then whether doctor care is needed

### Escalation policy

The assistant should avoid recommending doctor visits for very mild symptoms that are still reasonable to observe at home. It should mention doctor evaluation only when there are clear red flags such as:
- breathing difficulty
- chest pain
- confusion or reduced consciousness
- seizures
- significant bleeding
- severe dehydration
- fast worsening
- severe pain
- extensive swelling
- serious allergic reaction signs
- persistent symptoms beyond a reasonable time window

For mild complaints, the preferred language should be:
- “belum perlu ke dokter dulu”,
- “cukup dipantau dulu di rumah”,
- “baru perlu diperiksa bila…”

### Image-assisted answers

When an image is included, the assistant should:
- combine what it sees with the user’s text,
- be honest when the image is blurry or insufficient,
- avoid false certainty,
- describe the most likely visible pattern in simple language,
- keep treatment suggestions limited to safe first-step care and non-prescription options,
- and escalate only if the image or text suggests serious risk.

### Medication policy

The assistant may suggest only general over-the-counter options that match the symptom, without exact dosing:
- parasetamol for demam or nyeri ringan
- saline for hidung tersumbat
- antihistamin for mild allergy symptoms
- oralit for diarrhea
- pelembap or kalamin for mild skin irritation

The assistant must not provide:
- antibiotics,
- prescription-only medicines,
- steroid tablets,
- injections,
- or exact dosing instructions.

## 4. Frontend Chat UX

The public chat UI should remain familiar and lightweight.

### Changes

- Add an image attachment button near the input
- Show a small local preview before send
- Allow removing or replacing the selected image before submission
- Send text-only requests exactly as before when there is no image
- Send `multipart/form-data` when there is an image
- Show an analyzing/loading state that accounts for image processing
- Keep the preview visible in the browser chat history for that session only

### Privacy messaging

The UI should explicitly say:
- the image is used temporarily to help answer the question
- the image is not stored on the server
- the image is discarded after processing

### Error handling

The UI should gracefully handle:
- unsupported file type
- image too large
- provider image-analysis failure
- network timeout

Each error should produce a clear toast and preserve the current chat session without forcing a reload.

## 5. API Contract

### Text-only request

Keep the existing JSON body:
- `message`
- `history`

### Text plus image request

Use `multipart/form-data` with:
- `message`
- `history` serialized as JSON string
- `image` as a single file

The response shape remains:

```json
{ "reply": "..." }
```

This keeps the frontend rendering path simple.

## 6. Validation And Safety

Backend validation should cover:
- message required and length-limited
- history role and content validation
- image mime type whitelist
- image size limit
- one-file limit

Additional safety guardrails:
- the backend must reject empty requests with neither text nor image
- if the user uploads an image without useful text, the prompt should still ask the model to focus on visible findings and safe first steps
- if the image is not interpretable, the assistant should say so clearly instead of guessing

## 7. Files Expected To Change

- `backend/src/config/index.ts`
- `backend/src/modules/public/public-ai.ts`
- `backend/src/modules/public/public.module.ts`
- `frontend/src/components/public/PublicAISection.tsx`
- `frontend/src/components/public/public-ai-messages.ts`
- `frontend/src/components/ui/Icon.tsx`
- new backend tests for multipart/image validation and model routing
- new frontend tests for attachment state and error behavior

## 8. Validation

- Text-only public AI still works
- Mild symptom questions are less likely to be escalated unnecessarily
- Image requests succeed without writing files to disk
- Uploaded image is handled in-memory only
- Unsupported image files show a friendly error
- Existing landing page chat remains usable without login
- Existing doctor-only AI flows remain unchanged

## 9. Open Decision Resolved

The uploaded image will be:
- usable for general complaints as well as visible complaints
- processed temporarily
- not stored on disk
- not saved in the database
- shown only as local preview/chat context in the browser session
