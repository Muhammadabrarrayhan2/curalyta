# Curalyta App Stability And Integrations Design

## Goal

Stabilize the current prototype so the main patient, doctor, and admin flows no longer feel misleading, then add a clean configuration foundation for payment, push notification, storage, and AI integrations without storing secrets in the UI.

## Context

The current app is visually strong but several core actions stop at local component state or static mock constants:

- Patient booking succeeds in a modal but does not appear as a new booking across the app.
- Doctor chat and consultation views are not scoped to the selected patient.
- Many admin and doctor actions are button-only affordances with no shared state behind them.
- Mobile navigation is incomplete because the sidebar disappears without a replacement path.
- External integrations are mentioned in product copy, but there is no single, safe place to define provider configuration.

This pass intentionally improves trustworthiness and readiness without pretending a backend already exists.

## In Scope

- Replace disconnected screen-level state with a shared front-end data layer.
- Make booking, consultation, patient chat, doctor booking actions, and selected admin actions stateful across screens.
- Persist demo session data in local storage so behavior survives refresh.
- Add an integration configuration module backed by Vite env values.
- Add a clear admin-facing surface that shows integration status and tells the operator which env keys are required.
- Add a `.env.example` contract and README guidance for Midtrans, Firebase Cloud Messaging, S3-compatible storage, and an OpenAI-compatible API.
- Improve mobile navigation and mobile chat usability enough for the prototype to remain navigable on smaller screens.

## Out Of Scope

- No real backend, database, or server-side auth.
- No real payment charge flow, push delivery, file upload, or AI inference request.
- No secret entry or secret persistence in the admin UI.
- No claim of real-time synchronization between users or devices.
- No migration to production-grade RBAC or audit storage.

## Product Principles For This Pass

1. A visible action must update a shared state or clearly say it is unavailable.
2. Demo behavior should be consistent, even if still local-only.
3. Secret values must remain in `.env` and never render in full in the browser.
4. Integration readiness should be observable by non-developers from the admin area.
5. New code should reduce coupling, not add more mock duplication.

## Proposed Architecture

### 1. Shared App Session Store

Add a new front-end state layer that seeds its initial values from the existing mock data, then owns all runtime mutations for:

- bookings
- conversation threads
- consultation note drafts
- notifications
- doctor verifications
- admin user statuses
- audit log events

This store should live in a dedicated context provider, separate from `AuthContext`, because authentication and mutable product data have different responsibilities.

The store should:

- initialize from a deterministic seed derived from `mockData.js`
- restore from local storage if a prior session exists
- expose read selectors plus explicit action functions
- keep action names domain-oriented, such as `createBooking`, `updateBookingStatus`, `sendPatientMessage`, `openConsultationForPatient`, `approveVerification`, `suspendUser`, and `appendAuditEvent`
- write updates back to local storage after each state change

This keeps the app honest without introducing fake network layers or pretending data is server-backed.

### 2. Integration Configuration Module

Add a dedicated configuration module that reads from `import.meta.env`, normalizes provider settings, validates required fields, and returns masked display data for the UI.

The module should be responsible for:

- selecting the configured provider for each integration domain
- validating required env keys for the selected provider
- classifying each integration as `disabled`, `partial`, `configured`, or `invalid`
- masking secrets before data reaches any component
- generating operator-facing messages such as "Missing VITE_MIDTRANS_CLIENT_KEY"

The initial supported providers are:

- Payment: Midtrans
- Push notification: Firebase Cloud Messaging
- Storage: S3-compatible storage
- AI API: OpenAI-compatible API

This module should be read-only from the browser. The admin area may display provider, mode, endpoint, bucket, model, and readiness, but never edit or persist secret values.

### 3. Admin Integration Surface

Use the existing admin settings route as the home for integration readiness instead of creating a new product area. This keeps the prototype smaller and avoids unnecessary navigation growth.

The admin surface should include:

- a new "Integrations and API Config" section
- one card per integration domain
- provider label, mode, non-secret public metadata, readiness badge, and missing env checklist
- helper text that points the operator to the exact env variable names
- clear copy that configuration is sourced from environment variables, not stored in the browser

This gives the user a real "place" to manage awareness of integrations while keeping secrets in the correct place: `.env`.

### 4. Mobile Navigation And Chat Fallback

Because the desktop sidebar disappears on mobile, the prototype needs a lightweight alternative. Add a mobile-safe navigation pattern tied to the current role so users can still move between primary screens.

For chat pages, avoid a desktop-only two-pane requirement. On mobile:

- the conversation list must still be usable
- selecting a thread must reveal the thread content
- there must be an obvious way to return to the thread list

This does not require a full redesign. It only needs to restore basic usability.

## Behavioral Design

### Booking Lifecycle

Patient booking should become the canonical driver for several screens.

New behavior:

- completing the patient booking modal creates a new booking record in the shared store
- the booking appears in the patient bookings page immediately
- the same booking appears in doctor incoming bookings when the selected doctor matches
- a notification is created for the patient and doctor demo session
- doctor actions change the same record:
  - `accept` -> `confirmed`
  - `reject` -> `rejected`
  - `reschedule` -> `rescheduled` plus replacement slot metadata
- patient views reflect the new status without needing separate mock lists

Status vocabulary for this pass:

- `pending`
- `confirmed`
- `rescheduled`
- `rejected`
- `completed`
- `cancelled`

### Chat And Consultation Scoping

Doctor chat and doctor consultation must be patient-scoped rather than screen-scoped.

New behavior:

- each patient has an independent thread
- selecting a patient in doctor chat or doctor consultation updates the active patient context
- message history belongs to that patient only
- AI support data is selected per active patient
- note drafts are stored per patient instead of one global draft

Patient chat should also consume the same thread model so recent messages and timestamps stay consistent within the prototype.

### Admin Stateful Actions

The following actions should stop being no-ops and instead update shared session state plus audit entries:

- approve or request revision on doctor verification
- reject verification
- suspend or reactivate user
- force logout user

The result is not security enforcement in a backend sense. It is a truthful demo where state changes are visible in the UI and traceable through audit events.

## Data Model Shape

The shared store does not need production completeness, but it should be normalized enough to avoid duplicated truth.

Recommended entities:

- `bookingsById`
- `bookingIds`
- `threadsByPatientId`
- `notesByPatientId`
- `notificationsByRole`
- `verificationQueue`
- `adminUsers`
- `auditEvents`

Derived views should be computed in selectors rather than stored as separate duplicated arrays whenever possible.

## Integration Env Contract

The app should document and read a minimal env contract such as:

```env
# Payment
VITE_PAYMENT_PROVIDER=midtrans
VITE_MIDTRANS_MODE=sandbox
VITE_MIDTRANS_CLIENT_KEY=
VITE_MIDTRANS_MERCHANT_ID=
VITE_MIDTRANS_SNAP_BASE_URL=
VITE_MIDTRANS_WEBHOOK_URL=

# Push notification
VITE_PUSH_PROVIDER=fcm
VITE_FCM_PROJECT_ID=
VITE_FCM_APP_ID=
VITE_FCM_VAPID_KEY=
VITE_FCM_SENDER_ID=

# Storage
VITE_STORAGE_PROVIDER=s3
VITE_S3_BUCKET=
VITE_S3_REGION=
VITE_S3_ENDPOINT=
VITE_S3_PUBLIC_BASE_URL=

# AI API
VITE_AI_PROVIDER=openai-compatible
VITE_AI_BASE_URL=
VITE_AI_MODEL=
VITE_AI_PROJECT_LABEL=
VITE_AI_FEATURES=triage,note-draft,patient-education
```

If future providers are added, they should slot into the same normalization layer instead of spreading raw env lookups through components.

## Error Handling And UX Rules

- If an integration is not configured, show a clear readiness warning instead of implying it works.
- If a shared-state action cannot proceed because required fields are missing, keep the UI blocked with an explicit explanation.
- If local storage restore fails, fall back to seeded demo data and log a warning without crashing the app.
- If environment values are malformed, mark the integration as `invalid` and explain the expected format.
- If a mobile thread is opened with no matching conversation, show an empty state instead of a broken pane.

## Testing Strategy

Implementation should add regression coverage around the new shared-state behavior and integration validation logic.

Priority test areas:

- booking creation updates all dependent views
- doctor status actions update the same booking record
- chat threads remain isolated per patient
- note drafts remain isolated per patient
- admin actions mutate shared state and append audit events
- env parsing returns the correct readiness status for complete and incomplete configurations

Because the current repo has no test harness, the implementation plan should explicitly include setup for a lightweight front-end test stack before behavior changes are added.

## File Structure Direction

The implementation should prefer small, focused additions over expanding already large page files.

Expected additions:

- a shared app data context or store module
- an integration config module
- one or more helper modules for env parsing, local storage persistence, and seed generation
- small presentational admin settings components for integration cards and readiness items

Existing large page files may be updated to consume the new store, but new domain logic should not be buried directly inside those page components if it can live in a reusable layer.

## Risks And Mitigations

### Risk: More complexity in an already mock-heavy app

Mitigation:
Keep the shared store intentionally small, seeded from existing mock data, and centered on the few flows that are currently misleading.

### Risk: The admin integration panel could imply secrets are editable there

Mitigation:
Use explicit copy and visual treatment that marks the panel as "Environment-backed" and never show editable secret fields.

### Risk: Mobile changes create layout regressions on desktop

Mitigation:
Implement mobile fallback as additive behavior with clear breakpoints instead of replacing the desktop layout pattern.

### Risk: Demo persistence becomes inconsistent across roles

Mitigation:
Use one canonical data source for mutable entities and derive role-specific views from that source instead of maintaining separate arrays.

## Success Criteria

This pass is successful when:

- a patient-created booking appears consistently across patient and doctor surfaces
- doctor chat and consultation are scoped to the selected patient
- the most visible admin actions mutate state and create audit entries
- mobile users retain a usable navigation path and can open chat content
- the project contains a documented env contract plus an admin-readable integration readiness surface
- no secret key is stored or editable in the browser

## Implementation Boundary

This design intentionally stops short of backend integration. The result should feel coherent, honest, and ready for a backend handoff rather than pretending production features already exist.
