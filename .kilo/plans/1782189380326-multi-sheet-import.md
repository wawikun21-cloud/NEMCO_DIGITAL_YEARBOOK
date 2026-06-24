# Multi-Sheet Import Plan

## Goal
Allow admins to select which sheet(s) to import from multi-sheet Excel files. Sheet selection appears inside the ImportPreviewModal as checkboxes (first sheet checked by default).

## Context
- Client currently parses only `workbook.SheetNames[0]` (first sheet) in `ImportUsersPage.jsx:76`
- Server `parseExcelFile` in `server/src/services/importService.js:28` also hardcodes first sheet
- Both client and server use `{ raw: false }` in SheetJS to preserve formatted strings (e.g. leading zeros in student numbers)

## Architecture Decision
**Sheet selection lives inside `ImportPreviewModal`** — the modal receives all sheet names, renders checkboxes, and the admin confirms which sheet to import. Only one sheet can be selected at a time (radio behavior via single-selection checkbox list). The selected sheet name is passed back to the parent and sent to the server.

## Affected Files

### 1. `client/src/pages/admin/ImportUsersPage.jsx`
**Changes:**
- Add `sheetNames` state (`string[]`) and `selectedSheet` state (`string`)
- In `parseAndValidate`, extract `workbook.SheetNames` and store in `sheetNames`
- Set `selectedSheet` to first sheet name by default
- Pass `sheetNames`, `selectedSheet`, and `onSheetChange` callback to `ImportPreviewModal`
- In `handleImport`, pass `selectedSheet` to `uploadImport`

### 2. `client/src/components/admin/ImportPreviewModal.jsx`
**Changes:**
- Add props: `sheetNames`, `selectedSheet`, `onSheetChange`
- Add checkbox list UI at the top of the modal body (before valid rows section)
- Each sheet name gets a checkbox; first sheet checked by default
- Only one sheet can be selected at a time (selecting one deselects others)
- On confirm, call `onConfirm(selectedSheet)`

### 3. `client/src/services/importService.js`
**Changes:**
- Modify `uploadImport(file)` to `uploadImport(file, sheetName)`
- Append `sheetName` to FormData as `formData.append("sheetName", sheetName)`

### 4. `server/src/services/importService.js`
**Changes:**
- Modify `parseExcelFile(buffer)` to `parseExcelFile(buffer, sheetName)`
- Use provided `sheetName` instead of `workbook.SheetNames[0]`
- Validate that `sheetName` exists in `workbook.SheetNames`; throw if not found

### 5. `server/src/controllers/importController.js`
**Changes:**
- Extract `sheetName` from `req.body` in `uploadImport` handler
- Pass `sheetName` to `parseExcelFile`

## Data Flow
1. Admin uploads Excel file → client extracts all sheet names
2. Client opens preview modal with checkboxes for each sheet
3. Admin selects a sheet → client re-parses data from that sheet for preview
4. Admin clicks "Import" → client sends file + `sheetName` to server
5. Server parses only the specified sheet and processes rows

## Edge Cases
- **Single sheet file**: Checkboxes still shown but only one option; auto-selected
- **Empty sheet**: Validation catches "no data rows" error
- **Invalid sheet name from client**: Server validates and returns 400 error
- **File with no sheets**: Caught by SheetJS parse error

## Validation
1. Upload multi-sheet Excel → verify checkboxes appear with correct sheet names
2. Select different sheet → verify preview updates with that sheet's data
3. Import → verify server processes correct sheet
4. Upload single-sheet Excel → verify checkbox still shown, works normally
5. Verify existing single-sheet imports still work

## Open Questions
None — design is finalized.
