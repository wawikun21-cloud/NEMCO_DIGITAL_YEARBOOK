# Plan: Fix Auto-filter Yearbook + Remove Profiles/Sections (PDF-only)

## Root Cause Analysis

The auto-filter doesn't work because `getPublicFlipbook()` never queries `flipbook_profiles` or `flipbook_sections` — it always returns `profiles: []`, `sections: []`, `sourceType: "pdfs"`. The client expects profile data but gets nothing, causing an empty yearbook.

Additionally, the user wants to **completely remove** the profiles/sections content system and make the yearbook **PDF-only**. This eliminates the dead code paths and simplifies the architecture.

---

## Implementation Plan

### Step 1: Server — Simplify `getPublicFlipbook` to PDF-only

**File**: `server/src/services/flipbookService.js`

Remove the `sourceType` logic. The function should only return PDF pages. Remove any references to profiles/sections in the return value.

```js
export async function getPublicFlipbook(department = null, batch = null) {
  const settings = await getFlipbookSettings()

  if (!settings.enabled) {
    return { settings, pdfPages: [] }
  }

  const hasCols = await columnsExist()

  let query = supabaseAdmin
    .from("flipbook_pdf_pages")
    .select(
      hasCols
        ? "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active, department, batch"
        : "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (department && hasCols) {
    query = query.eq("department", department)
  }
  if (batch && hasCols) {
    query = query.eq("batch", batch)
  }

  const { data, error: pdfError } = await query

  if (pdfError) {
    throw new Error(`Failed to fetch PDF pages: ${pdfError.message}`)
  }

  return {
    settings,
    pdfPages: data || [],
  }
}
```

### Step 2: Server — Simplify `getYearbookCatalog` to PDF-only

**File**: `server/src/services/flipbookService.js`

Remove the profiles-based fallback. Only query `flipbook_pdf_pages` for departments/batches.

```js
export async function getYearbookCatalog() {
  const hasCols = await columnsExist()

  if (!hasCols) {
    // If department column doesn't exist, return empty catalog
    // The client will hide the filter dropdown
    return { departments: [], batches: [] }
  }

  const { data: deptData, error: deptError } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .select("department")
    .eq("is_active", true)
    .not("department", "is", null)

  if (deptError) {
    throw new Error(`Failed to fetch departments: ${deptError.message}`)
  }

  const { data: batchData, error: batchError } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .select("batch")
    .eq("is_active", true)
    .not("batch", "is", null)

  if (batchError) {
    throw new Error(`Failed to fetch batches: ${batchError.message}`)
  }

  const departments = [...new Set((deptData || []).map((d) => d.department).filter(Boolean))].sort()
  const batches = [...new Set((batchData || []).map((b) => b.batch).filter(Boolean))].sort()

  return { departments, batches }
}
```

### Step 3: Client — Remove profiles/sections logic from `bookPageList`

**File**: `client/src/pages/student/Yearbook3DPage.jsx`

Simplify the `bookPageList` useMemo to only handle PDF pages:

```js
const bookPageList = useMemo(() => {
  const contentPages = []
  for (const pdf of pdfPages) {
    const count = pdfPageCounts[pdf.id] || pdf.page_count || 1
    for (let i = 1; i <= count; i++) {
      contentPages.push({ type: "pdf", data: pdf, pageNum: i })
    }
  }
  const firstPdfPage = pdfPages.length > 0 ? { type: "pdf", data: pdfPages[0], pageNum: 1 } : null
  if (firstPdfPage) {
    const firstKey = `${firstPdfPage.data.id}-${firstPdfPage.pageNum}`
    const filteredContent = contentPages.filter((p) => `${p.data?.id}-${p.pageNum}` !== firstKey)
    return [{ type: "cover", _designPage: firstPdfPage }, { type: "inside-cover" }, ...filteredContent, { type: "back-cover" }]
  }
  return [{ type: "cover", _designPage: null }, { type: "inside-cover" }, ...contentPages, { type: "back-cover" }]
}, [pdfPages, pdfPageCounts])
```

### Step 4: Client — Remove unused state and logic

**File**: `client/src/pages/student/Yearbook3DPage.jsx`

Remove or simplify:
- The `profiles` variable (line 635) — no longer needed
- The `sections` variable (line 636) — no longer needed
- The `filtered` / `filteredIdSet` / `bookToFilteredIndex` / `filteredToBookIndex` logic — only relevant for profile filtering
- The `displayPageList` useMemo — simplify to just `bookPageList`
- The `studentParam` useEffect (lines 556-595) — no profiles to jump to
- The "My Yearbook" button can stay but only sets department/batch filters
- The `sourceType === "pdfs"` check at line 971 — simplify

### Step 5: Client — Remove unused imports/components

Remove unused imports:
- `StudentPage`, `StudentBackPage`, `SectionPage` components — no longer needed
- `GraduationCap` from lucide-react — only used in removed components

### Step 6: Client — Remove the "No content yet" empty state for profiles

The empty state at line 965 checks `profiles.length === 0 && pdfPages.length === 0`. Simplify to just check `pdfPages.length === 0`.

---

## Affected Files

| File | Change |
|------|--------|
| `server/src/services/flipbookService.js` | Simplify `getPublicFlipbook` to PDF-only; simplify `getYearbookCatalog` to PDF-only |
| `client/src/pages/student/Yearbook3DPage.jsx` | Remove profiles/sections logic; simplify `bookPageList` to PDF-only; remove unused components/state |

---

## Risks / Edge Cases

1. **Student has no `course_or_strand`**: Filter is `null`, all PDFs shown. Correct fallback.
2. **Admin hasn't tagged PDFs with department**: PDFs have `null` department → they won't match any filter. Admin must tag content.
3. **Existing profile data in `flipbook_profiles`**: Will no longer be queried or displayed. This is intentional per user request.
4. **The `flipbook_profiles` and `flipbook_sections` tables**: Will become orphaned. Not deleted, just unused.

---

## Validation Plan

1. Log in as a student with `course_or_strand = "BSIT"` and `year_graduated = "2025-2026"`
2. Verify only PDF pages tagged "BSIT" / "2025-2026" appear
3. Switch department dropdown to "All Departments" → verify all PDFs appear
4. Click "My Yearbook" → verify filter resets to student's department
5. Log in as student with no `course_or_strand` → verify all PDFs load
6. Verify no "sections" or student profile pages appear anywhere
7. Test in both light and dark themes
