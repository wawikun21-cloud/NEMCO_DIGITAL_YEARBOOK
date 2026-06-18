# Bulk Excel User Import Implementation Plan

## Overview
Implement Excel file upload and processing to bulk create users in Supabase Auth with corresponding profile records.

## Phase 1: Backend Dependencies & Configuration

### 1.1 Install Required Packages
- Add `xlsx` (Excel parsing) to server `package.json`
- Add `multer` (file upload handling) to server `package.json`

### 1.2 Create Import Validator
- File: `server/src/validators/importValidator.js`
- Validate Excel columns: student_number, email, full_name, role, year_level, course_or_strand, section
- Validate optional columns: display_name, bio, quote
- Validate file type (must be .xlsx or .xls)
- Validate file size (max 5MB)

## Phase 2: Backend API Endpoints

### 2.1 Create Import Routes
- File: `server/src/routes/importRoutes.js`
- Routes:
  - `POST /api/admin/import/users` - Upload and process Excel file
  - `GET /api/admin/import/batches` - List import batches
  - `GET /api/admin/import/batches/:id` - Get specific batch details
  - `GET /api/admin/import/batches/:id/errors` - Get error report

### 2.2 Create Import Controller
- File: `server/src/controllers/importController.js`
- Functions:
  - `uploadImport` - Handle file upload, parse Excel, validate rows, create users
  - `listBatches` - List all import batches with status
  - `getBatch` - Get specific import batch
  - `getBatchErrors` - Get errors for a specific batch

### 2.3 Create Import Service
- File: `server/src/services/importService.js`
- Functions:
  - `parseExcelFile` - Parse Excel buffer and extract rows
  - `validateRow` - Validate single row data
  - `createUserFromRow` - Create Supabase Auth user and profile
  - `createImportBatch` - Create import batch record
  - `recordError` - Record validation or creation errors

## Phase 3: Database Tables (via Supabase)

### 3.1 import_batches table
```
id (uuid, primary key)
file_name (text)
status (text: pending, processing, completed, failed)
total_rows (integer)
success_count (integer)
error_count (integer)
created_by (uuid, admin user id)
created_at (timestamp)
completed_at (timestamp, nullable)
error_summary (jsonb, nullable)
```

### 3.2 import_errors table
```
id (uuid, primary key)
batch_id (uuid, foreign key to import_batches)
row_number (integer)
field (text)
error_message (text)
raw_data (jsonb)
created_at (timestamp)
```

## Phase 4: Frontend Implementation

### 4.1 Create Import Page
- File: `client/src/pages/admin/ImportUsersPage.jsx`
- Features:
  - File upload input (accept only .xlsx, .xls)
  - Import button with loading state
  - Preview modal showing valid/invalid rows
  - Confirmation step before actual import
  - Progress indicator during import
  - Results summary (success count, error count)
  - Error download link

### 4.2 Create Import Components
- `client/src/components/admin/ImportPreviewModal.jsx` - Preview valid/invalid rows before import
- `client/src/components/admin/ImportProgress.jsx` - Progress indicator during import
- `client/src/components/admin/ImportResults.jsx` - Display import results

### 4.3 Create Import Service Hook
- File: `client/src/services/importService.js`
- Functions:
  - `uploadImport` - POST file to backend
  - `getBatches` - GET batches list
  - `getBatch` - GET specific batch
  - `getBatchErrors` - GET errors for download

## Phase 5: Routing & Navigation

### 5.1 Update App.jsx
- Add route for `/admin/import` when role is admin
- Ensure import page is accessible only to admins

### 5.2 Update AppSidebar.jsx
- Sidebar already has `admin-import` navigation item pointing to `/admin/import`
- No changes needed (already configured)

## Phase 6: Implementation Order

1. Add xlsx and multer dependencies to server
2. Create import validator (backend)
3. Create import service (backend)
4. Create import controller (backend)
5. Create import routes (backend)
6. Register routes in app.js
7. Create frontend import service hooks
8. Create frontend components
9. Create frontend import page
10. Update App.jsx for routing
11. Test end-to-end flow

## Validation Rules (per SYSTEM_PLAN.md)

### Required Field Checks
- student_number not empty and unique
- email not empty, valid format, unique
- full_name not empty
- role must be "admin" or "user"
- year_level must be valid (1-12 or similar)
- course_or_strand not empty

### Optional Fields
- display_name
- bio
- quote

## Error Handling

- Invalid file type → 400 error
- Missing required columns → 400 error
- Row validation errors → Record in import_errors, continue processing
- Supabase creation errors → Record in import_errors, continue processing