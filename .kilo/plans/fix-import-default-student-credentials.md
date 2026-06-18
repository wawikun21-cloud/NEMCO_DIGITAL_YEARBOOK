# Fix Bulk Import Default Student Credentials

## Goal
Fix bulk user import so imported student accounts are actually created and can log in using the expected default credentials, without changing unrelated code.

## Root Cause Hypotheses
1. `server/src/services/importService.js` currently creates Supabase Auth users with a fixed `TEMP_PASSWORD = "TempPassword123!"`. If the expected default credential is the student's `student_number`, login will fail because the imported account password is not the student number.
2. `server/src/validators/importValidator.js` only allows roles `admin` and `user`. If the Excel file uses `student` as the role, those rows are rejected server-side even though the frontend preview may show them as valid.
3. The frontend preview validation is weaker than the backend validation, so rows can appear valid but fail during import.
4. Error reporting is incomplete: validation errors pass `data.student_number` instead of the normalized value, and the UI does not clearly distinguish completed-with-errors from fully successful imports.

## Assumption
The desired default credential for imported students is:
- Student ID / username: `student_number`
- Default password: the same row `student_number` value

If the desired password is a single shared default password instead, adjust the implementation to use that constant.

## Files to Change
1. `server/src/services/importService.js`
2. `server/src/validators/importValidator.js`
3. `client/src/pages/admin/ImportUsersPage.jsx`
4. `client/src/components/admin/ImportPreviewModal.jsx`
5. `client/src/components/admin/ImportResults.jsx`
6. `client/src/components/admin/ImportProgress.jsx`

## Implementation Plan

### 1. Normalize imported roles
- In `server/src/validators/importValidator.js`, add a role normalization helper:
  - `admin` stays `admin`
  - `user` stays `user`
  - `student` normalizes to `user`
  - invalid values still fail validation
- This keeps the database schema unchanged because `profiles.role` is constrained to `admin` or `user`.

### 2. Use `student_number` as default password
- In `server/src/services/importService.js`, replace the fixed `TEMP_PASSWORD` usage with the normalized `rowData.student_number` when creating Supabase Auth users.
- Keep a constant like `DEFAULT_IMPORT_PASSWORD_FROM_STUDENT_NUMBER` or a helper function to make the behavior explicit.
- This makes imported students able to log in with:
  - Student ID: their `student_number`
  - Password: their `student_number`

### 3. Improve validation consistency
- In `client/src/pages/admin/ImportUsersPage.jsx`, normalize `student` to `user` in the preview so the preview matches backend behavior.
- Add basic email format validation in the frontend preview to prevent rows from appearing valid if they will fail server-side.
- Keep backend validation as the source of truth.

### 4. Improve error reporting
- In `server/src/services/importService.js`, pass normalized `validation.data.email` and `validation.data.student_number` when recording validation errors, instead of raw `data.email` / `data.student_number`.
- In `client/src/components/admin/ImportResults.jsx`, show inline errors when `errorCount > 0`, not only through CSV download.
- In `client/src/pages/admin/ImportUsersPage.jsx`, if `results.errorCount > 0`, display a clearer status such as `completed_with_errors` instead of plain `completed`.
- In `client/src/components/admin/ImportProgress.jsx`, handle `completed_with_errors` so the progress bar says "Import completed with errors" instead of "Import complete!".

### 5. Validate
- Run backend lint: `npm run lint` in `server`
- Run frontend lint: `npm run lint` in `client`
- Manual test:
  1. Log in as admin.
  2. Import an `.xlsx` file with role values `student` and `user`.
  3. Confirm imported users appear in Supabase Auth and `profiles`.
  4. Confirm login works with `student_number` as both Student ID and password.
  5. Confirm invalid rows are shown in the import error report.

## Scope Guard
Do not change unrelated authentication flows, Supabase schema, storage policies, or the whole import system. Only adjust the minimum code required for default student credentials, role normalization, and clear error reporting.
