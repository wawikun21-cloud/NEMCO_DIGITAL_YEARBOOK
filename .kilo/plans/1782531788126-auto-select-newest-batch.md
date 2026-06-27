# Plan: Auto-select newest batch, remove "All batches" option

## Goal
In `Yearbook3DPage.jsx`, the Batch filter dropdown should no longer offer an "All batches" option. Instead it auto-selects the newest batch from the catalog on load. The clear button resets to the newest batch rather than clearing to null. Apply the same behavior to both students and admins.

## Current behavior (verified in code)
- `Yearbook3DPage.jsx:1121-1131` — Batch `<Select>` has `<SelectItem value="">All Batches</SelectItem>` and `value={selectedBatch || ""}`.
- `Yearbook3DPage.jsx:469` — `selectedBatch` initial state is `null`.
- `Yearbook3DPage.jsx:536-540` — For student view, `setSelectedDepartment(courseStrand)` is called on load but `selectedBatch` is left `null`.
- `Yearbook3DPage.jsx:1133-1141` — XCircle clear button calls `setSelectedDepartment(null); setSelectedBatch(null)`.
- `client/src/utils/yearbookEditionHelpers.js:12-21` — `dedupeBatchLabels()` returns a sorted array (ascending). Newest batch is the **last** element.
- `client/src/services/flipbookService.js:41-52` — `getPublicFlipbook(department, batch)` passes `batch` as a query param; `null` means "all batches" server-side.
- `server/src/services/flipbookService.js:381-405` — `getPublicFlipbook` returns empty profiles/pdfPages when `settings.enabled` is false; otherwise calls `fetchActivePdfPages(dept, bat)`.

## Implementation steps

### 1. Add helper to derive newest batch
In `client/src/utils/yearbookEditionHelpers.js`, add:
```js
export function newestBatchLabel(values) {
  const deduped = dedupeBatchLabels(values)
  return deduped.length > 0 ? deduped[deduped.length - 1] : null
}
```
(`dedupeBatchLabels` already sorts ascending, so the last element is the newest.)

### 2. Update `selectedBatch` initialization logic in `Yearbook3DPage.jsx`
In `loadProfileAndCatalog` (around line 496-545), after `setAvailableBatches(catalog.batches || [])`:
- Compute `const autoBatch = newestBatchLabel(catalog.batches || [])`.
- Replace the existing `if (isStudentView) { setSelectedDepartment(courseStrand) }` block with logic that calls:
  - `setSelectedDepartment(isStudentView ? courseStrand : null)` (unchanged for students; null for admins — admins see all courses by default unless they pick one).
  - `setSelectedBatch(autoBatch)` for **both** students and admins.

### 3. Update the clear-filters handler
Change the XCircle button `onClick` (line 1134-1135) from:
```js
setSelectedDepartment(null); setSelectedBatch(null)
```
to:
```js
setSelectedDepartment(null); setSelectedBatch(newestBatchLabel(availableBatches))
```
Import `newestBatchLabel` at the top of the file.

### 4. Remove "All Batches" from the Batch dropdown
In `Yearbook3DPage.jsx:1125-1126`, remove the `<SelectItem value="">All Batches</SelectItem>` line. The dropdown now only lists real batch values. Keep the `placeholder="Batch"` on the trigger — it is shown only when `selectedBatch` is null, which now only happens if the catalog has no batches.

### 5. Guard against null batch in the clear-button visibility
The existing condition `{(selectedDepartment || selectedBatch) && ...}` (line 1133) already handles visibility correctly: if `selectedBatch` is null (no batches in catalog), the clear button is hidden. No change needed.

### 6. "My Yearbook" button behavior (line 1143-1153)
This button already calls `setSelectedBatch(null)`. After this change, that would set batch to null, which contradicts the new UX. Update its handler to reset batch to the newest batch instead:
```js
onClick={() => {
  setSelectedDepartment(studentProfile.course_or_strand.trim())
  setSelectedBatch(newestBatchLabel(availableBatches))
}}
```

### 7. Server-side consideration (verify, likely no change needed)
`server/src/services/flipbookService.js:381-405` — `getPublicFlipbook` already handles `batch=null` by returning all batches. Since the client will now always send a concrete batch (newest), the server simply filters to that batch. The fallback at line 394-396 ("same course/strand, any batch") still works as a safety net if the newest batch has no PDFs.

## Files to edit
1. `client/src/utils/yearbookEditionHelpers.js` — add `newestBatchLabel`.
2. `client/src/pages/student/Yearbook3DPage.jsx` — import helper, update `loadProfileAndCatalog`, update clear button, remove "All Batches" item, update "My Yearbook" button.

## Files to verify (read-only, no edits expected)
- `client/src/services/flipbookService.js` — confirm `getPublicFlipbook` still works when batch is always set.
- `server/src/services/flipbookService.js` — confirm `fetchActivePdfPages` filters correctly.

## Risks / edge cases
- **Empty catalog**: If `catalog.batches` is empty, `autoBatch` is `null`, `selectedBatch` stays `null`, dropdown has no items, placeholder "Batch" shows, clear button is hidden. Yearbook loads unfiltered (same as today's "All Batches"). This matches the user's instruction: "if that batch is null, it should not appear in filter dropdown to avoid selected null filter".
- **Admin view**: Admins also get auto-selected newest batch. They can still pick a different batch from the dropdown or clear to reset to newest. No "All Batches" option is available to them either, per the user's choice.
- **Sort order assumption**: `dedupeBatchLabels` uses default string sort (ascending). For year-like batch labels (e.g., "2024-2025", "2025-2026"), ascending sort puts the newest last. If batch labels are non-year strings, "newest" becomes "lexicographically last" — this is a reasonable interpretation and matches the user's request.

## Validation plan
1. Start the dev server. Log in as a student with a `course_or_strand` and `year_graduated` set.
2. Open the yearbook page. Confirm:
   - Batch dropdown has no "All Batches" item.
   - Newest batch is auto-selected on load.
   - Clear button resets batch to newest (not null).
   - "My Yearbook" button resets batch to newest.
   - Yearbook content loads filtered to that batch.
3. Log in as an admin. Confirm the same behavior (no "All Batches", newest auto-selected).
4. Test with a catalog that has zero batches: confirm dropdown shows placeholder, no null filter is applied, clear button is hidden.
5. Run `npm run lint` (or the project's lint command) and `npm run build` to verify no compile errors.
