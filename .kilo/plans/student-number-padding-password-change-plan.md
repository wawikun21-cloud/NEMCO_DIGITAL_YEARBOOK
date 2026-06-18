# Student Number Padding and Future Password Change Plan

## Goal

Update the Digital Yearbook system so imported student numbers are normalized consistently, default import passwords satisfy Supabase Auth minimum-length requirements, and users can change their password later.

This plan follows `SYSTEM_PLAN.md` sections:

- `3.1 Authentication`
- `3.4 User Account Management`
- `3.5 Bulk Excel User Import`
- `5. Backend API Structure`
- `7. Security Requirements`
- `11. Build Order`

## Key Assumption

The example `26284 -> 0026284` means the required student number length is **7 characters**.

If the real requirement is exactly minimum 6, replace `7` with `6`. Based on the user's example, this plan uses:

```js
padStart(7, "0")
```

## Current Relevant Files

### Server

- `server/src/services/importService.js`
- `server/src/validators/importValidator.js`
- `server/src/services/authService.js`
- `server/src/controllers/authController.js`
- `server/src/validators/authValidator.js`
- `server/src/routes/authRoutes.js`
- `server/src/app.js`

### Client

- `client/src/pages/admin/ImportUsersPage.jsx`
- `client/src/pages/student/LoginPage.jsx`
- `client/src/hooks/useLoginForm.js`
- `client/src/services/authService.js`
- `client/src/contexts/AuthProvider.jsx`
- `client/src/contexts/AuthContext.jsx`

## Implementation Plan

### 1. Add a shared student number normalization rule

Create a single normalization helper for student numbers:

```js
const normalizeStudentNumber = (value) => {
  const normalized = normalizeText(value)
  if (!normalized) return undefined

  return normalized.padStart(7, "0")
}
```

Apply the same behavior on both server and client so import preview and actual import results match.

Expected behavior:

```txt
26284   -> 0026284
026284  -> 0026284
0026284 -> 0026284
```

---

### 2. Update bulk import validation

File:

```txt
server/src/services/importService.js
```

Change student number normalization in `validateRow()` so every validated import row stores the padded student number.

This ensures:

- `profiles.student_number` receives `0026284`
- `auth.user_metadata.student_number` receives `0026284`
- duplicate checks use `0026284`
- default password uses `0026284`

Also update comments that currently describe the old behavior, because the system will no longer rely only on Excel formatting to preserve leading zeros.

---

### 3. Update import preview validation

File:

```txt
client/src/pages/admin/ImportUsersPage.jsx
```

Apply the same student number padding before pushing rows into `validRows`.

This keeps the admin preview consistent with backend validation.

The preview should show:

```txt
student_number: 0026284
default password: 0026284
```

This follows `SYSTEM_PLAN.md` section `3.5 Bulk Excel User Import`, especially the dry-run validation and admin preview flow.

---

### 4. Update login lookup to accept padded and unpadded student IDs

File:

```txt
server/src/services/authService.js
```

When a user logs in, normalize the submitted `studentId` before querying `profiles.student_number`.

Current login flow:

```txt
studentId input -> search profile -> signInWithPassword(email, password)
```

Updated login flow:

```txt
studentId input -> pad to 7 digits -> search profile -> signInWithPassword(email, password)
```

This allows both values to work after import:

```txt
26284
0026284
```

This keeps the login design from `SYSTEM_PLAN.md` section `3.1 Authentication` while supporting the normalized import format.

---

### 5. Add backend password change endpoint

Create a new route:

```txt
POST /api/auth/change-password
```

Add or update files:

```txt
server/src/routes/authRoutes.js
server/src/controllers/authController.js
server/src/validators/authValidator.js
server/src/services/authService.js
```

Request body:

```js
{
  currentPassword: "0026284",
  newPassword: "NewPassword123"
}
```

Server flow:

```txt
1. Require an authenticated session.
2. Load the current user's profile.
3. Verify currentPassword by signing in with the user's email and currentPassword.
4. If verification succeeds, update the Supabase Auth password.
5. Return success without exposing tokens or password data.
```

Recommended Supabase Admin API call:

```js
supabaseAdmin.auth.admin.updateUserById(profile.id, {
  password: newPassword
})
```

This follows `SYSTEM_PLAN.md` section `3.4 User Account Management` and recommended backend API structure for auth-related endpoints.

---

### 6. Add frontend change password UI

Recommended location:

```txt
client/src/pages/settings/ChangePasswordPage.jsx
```

Or add a modal/component if the app already has a settings area.

UI fields:

```txt
Current Password
New Password
Confirm New Password
Change Password button
```

Validation rules:

```txt
Current password is required
New password minimum 6 characters
New password must match confirmation
```

After success:

```txt
1. Show success message.
2. Clear password fields.
3. Optionally redirect to login or ask the user to sign in again.
```

Recommended behavior:

```txt
User logs in with student ID and default password 0026284
User opens Change Password
User enters current password 0026284
User enters a new password
Password is updated in Supabase Auth
User logs in next time using student ID and the new password
```

---

### 7. Optional: add forgot/reset password flow

This is not required for the immediate padding fix, but it is recommended by `SYSTEM_PLAN.md` section `3.1 Authentication`.

Possible Supabase Auth flow:

```txt
1. User enters email.
2. App calls supabase.auth.resetPasswordForEmail(email).
3. Supabase sends reset link.
4. User opens link.
5. User enters new password.
```

This is useful for users who forget their password and cannot provide `currentPassword`.

---

### 8. Security requirements

Follow `SYSTEM_PLAN.md` section `7. Security Requirements`.

Implementation must ensure:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` to frontend.
- Never log passwords.
- Never store passwords in `profiles`, `user_metadata`, or response bodies.
- Require current password for normal password changes.
- Validate all request bodies with Zod.
- Return generic login/change-password errors to avoid revealing whether an email or password is correct.
- Use HTTPS in production.
- Restrict CORS to allowed frontend origins.
- Consider rate limiting login and password-change endpoints.
- Record sensitive admin actions in `audit_logs` if audit logging is available.

---

## Validation Checklist

### Import normalization

Test an Excel file containing:

```txt
student_number: 26284
email: test@example.com
full_name: Test User
role: user
year_level: 1
course_or_strand: Test Course
```

Expected:

```txt
Preview shows student_number: 0026284
Import stores student_number: 0026284
Default password is: 0026284
```

### Login normalization

Test login with:

```txt
Student ID: 26284
Password: 0026284
```

Expected:

```txt
Login succeeds
```

Also test:

```txt
Student ID: 0026284
Password: 0026284
```

Expected:

```txt
Login succeeds
```

### Password change

Test:

```txt
Current password: 0026284
New password: NewPassword123
```

Expected:

```txt
Password changes successfully
Login with old password fails
Login with new password succeeds
```

### Validation failures

Test invalid cases:

```txt
New password shorter than 6 characters
New password and confirmation do not match
Current password is incorrect
Student number is empty
Email is invalid
```

Expected:

```txt
Clear validation errors are shown
No password is changed
No invalid import row is accepted
```

## Recommended Implementation Order

1. Add student number padding to server import validation.
2. Add student number padding to client import preview.
3. Add student number padding to login lookup.
4. Add backend `/api/auth/change-password` endpoint.
5. Add frontend change password form.
6. Add tests/manual validation for import, login, and password change.
7. Add optional forgot-password/reset-password flow if needed.

## Scope Guard

This plan should not change unrelated modules such as:

- Profile editing
- Resume builder
- Storage buckets
- Deployment setup
- Admin dashboard
- Supabase schema
- Row Level Security policies

Only authentication, import normalization, login normalization, and password-change functionality should be changed.
