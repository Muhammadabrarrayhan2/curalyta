# Public Auth Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove public demo/admin UI leaks and make patient registration immediately authenticate into the patient area without breaking doctor or admin flows.

**Architecture:** Keep the existing auth structure and route gating in place. Extend only the patient registration contract so it can return a token and hydrate the current auth store just like login, while simplifying the landing and auth modal UI to remove public-only clutter.

**Tech Stack:** React, React Router, Zustand, TypeScript, Express, Prisma, JWT

---

### Task 1: Add backend support for patient auto-login

**Files:**
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Write the failing verification command**

Use the existing frontend behavior as the failing case: patient registration returns only `{ user }`, so the frontend cannot create a session from the response.

- [ ] **Step 2: Update patient registration service to issue a token**

Make `registerPatient` return `{ user, token }` after creating the user and audit log, using the same JWT signer as login.

- [ ] **Step 3: Update the controller response shape**

Return both `user` and `token` from `/auth/register/patient`, while leaving `/auth/register/doctor` unchanged.

- [ ] **Step 4: Verify backend contract shape manually**

Run a local registration request through the UI after rebuilding and confirm a token is present indirectly via immediate authenticated navigation to `/patient`.

### Task 2: Hydrate frontend auth state from patient registration

**Files:**
- Modify: `frontend/src/store/auth.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Adjust frontend auth typings**

Add a response type for patient registration that includes `user` and `token`, or reuse the existing auth response shape where appropriate.

- [ ] **Step 2: Update `registerPatient` in the auth store**

Store the returned token, fetch `/auth/me`, and set `user`, `patient`, and `doctor` state exactly like the login flow.

- [ ] **Step 3: Keep logout semantics unchanged**

Do not alter `logout`; it should still clear the token and auth state so later access requires normal login.

- [ ] **Step 4: Verify store behavior through the UI**

Confirm the newly registered patient remains authenticated until logout, and after logout is redirected back through the normal login experience.

### Task 3: Update auth modal flow for patient registration

**Files:**
- Modify: `frontend/src/pages/auth/AuthModal.tsx`

- [ ] **Step 1: Remove public seeded admin credential hint**

Delete the `Default administrator` helper block from the admin login form.

- [ ] **Step 2: Redirect patient registration to the patient shell**

After successful patient registration, close the modal, show a success toast, and navigate to `/patient` instead of switching to patient login.

- [ ] **Step 3: Leave doctor behavior unchanged**

Doctor registration must still show the pending-verification success message and return to doctor login.

- [ ] **Step 4: Verify login/register transitions**

Check patient login, patient register, doctor login, doctor register, and admin login still render expected forms.

### Task 4: Remove public-facing demo/admin landing elements

**Files:**
- Modify: `frontend/src/pages/Landing.tsx`

- [ ] **Step 1: Replace the named demo patient card**

Swap the `Pasien: Ibu Siti` card for neutral capability-oriented copy that does not expose a fake patient identity.

- [ ] **Step 2: Remove the public admin footer section**

Delete the `Administrator` footer column and its login button from the landing page.

- [ ] **Step 3: Preserve patient and doctor CTAs**

Do not change the existing patient/doctor CTA wiring unless required by the new auth flow.

- [ ] **Step 4: Verify landing page content**

Confirm the page no longer shows `Ibu Siti`, `Default administrator`, or `Login Admin`.

### Task 5: End-to-end verification

**Files:**
- Modify: none

- [ ] **Step 1: Run frontend type/build verification**

Run: `npm --prefix frontend run build`

- [ ] **Step 2: Run backend image rebuild verification**

Run: `docker compose up -d --build backend frontend`

- [ ] **Step 3: Verify patient registration and relogin manually**

Register a fresh patient, confirm redirect to `/patient`, logout, then login again with the same credentials.

- [ ] **Step 4: Verify admin access still works**

Open `/admin`, login with the preserved admin credentials, and confirm admin shell access still works.
