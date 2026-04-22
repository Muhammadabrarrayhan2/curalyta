# Public Auth Cleanup Design

**Problem**

Landing page public UI still exposes demo/admin-only affordances that should not be shown to normal users:
- Doctor marketing hero shows a fake patient card (`Pasien: Ibu Siti`)
- Auth modal shows seeded administrator credentials
- Footer exposes a public admin login entry point

Patient registration also stops after account creation, forcing a second manual login even though the intended experience is immediate entry into the patient menu after sign-up.

**Goals**

- Remove public-facing demo/admin credential content without deleting the actual admin account in the database
- Keep administrator access working safely
- Change patient registration so a successful registration also creates an authenticated session and redirects to `/patient`
- Preserve existing doctor registration/login flow
- Preserve logout/login behavior so returning patients log back in normally without re-registering

**Non-Goals**

- No database deletion of the default admin account
- No change to doctor verification flow
- No redesign of patient dashboard structure

**Design**

## 1. Public UI cleanup

Update the landing page so the doctor promo area no longer references a named demo patient. Replace it with neutral clinical summary copy that still demonstrates product capability without implying live patient data.

Remove the administrator section from public footer navigation and remove the seeded credential hint from the auth modal. Public users should not see admin credentials or a dedicated admin CTA.

## 2. Admin access preservation

Keep `/admin` routing and backend admin authentication unchanged. The admin account stays in the database exactly as-is. Admin users can still access the existing admin login flow through route-driven access rather than public marketing links.

## 3. Patient auto-login after registration

Change patient registration on the backend so a successful registration returns the newly created user plus a JWT token, matching the login contract closely enough for the frontend to establish a session immediately.

On the frontend auth store, update `registerPatient` to:
- call the register endpoint
- store the returned token
- fetch `/auth/me`
- hydrate Zustand auth state with `user`, `patient`, and `doctor`

Then update the auth modal so successful patient registration:
- closes the modal
- shows a success toast
- redirects directly to `/patient`

Logout remains unchanged: token is cleared and the user must use normal patient login next time.

**Files Expected To Change**

- `frontend/src/pages/Landing.tsx`
- `frontend/src/pages/auth/AuthModal.tsx`
- `frontend/src/store/auth.ts`
- `frontend/src/types/index.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`

**Validation**

- New patient can register and lands on `/patient`
- Same patient can logout and login again with the same credentials
- Doctor registration still completes and returns to doctor login flow
- Admin account remains usable
- Landing page no longer shows `Ibu Siti`, seeded admin credentials, or public footer admin tab
