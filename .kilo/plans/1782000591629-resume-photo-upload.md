# Resume Photo Upload Implementation Plan

## Goal
Allow users to upload a professional headshot for their resume, stored separately from their profile avatar.

## Data Model
- Store photo URL in `data.personal.photo_url` (JSON column in `resumes` table)
- No database schema changes required — uses existing JSON `data` column

## Storage
- New Supabase Storage bucket: `resume-photos`
- Path pattern: `resume-{resumeId}/photo.{ext}`
- Public bucket (like `avatars`) so templates can render with `<img src="...">`

## Backend Changes (`api/index.js`)

### 1. New multipart route handler
Add route: `POST /api/my/resumes/:id/photo` (authenticated, owns resume)

**Logic:**
1. Authenticate user, verify resume belongs to user (`user_id = auth.uid`)
2. Parse multipart form data (reuse same raw buffer approach as avatar upload)
3. Validate file: `image/*`, max 5MB, allowed types `jpg/jpeg/png/webp`
4. Generate storage path: `resume-{resumeId}/photo.{ext}` (overwrite on re-upload)
5. Upload to `resume-photos` bucket with `upsert: true`
6. Get public URL via `supabaseAdmin.storage.from("resume-photos").getPublicUrl(path)`
7. Update resume JSON: `UPDATE resumes SET data = jsonb_set(data, '{personal,photo_url}', '"url"') WHERE id = :id AND user_id = :uid`
   - Alternative: fetch full resume, set `data.personal.photo_url = url`, update whole JSON
8. Return `{ resume, photoUrl }`

### 2. Route registration
Add to router (after existing resume routes, around line 1119):
```
if (pathname.match(/^\/api\/my\/resumes\/[^/]+\/photo$/) && req.method === "POST") return handleUploadResumePhoto(req, res)
```

### 3. Multipart parsing (reuse existing pattern)
Add to the raw multipart handling block (around line 1035):
```
const isResumePhotoUpload = pathname.match(/^\/api\/my\/resumes\/[^/]+\/photo$/) && req.method === "POST"
if (isResumePhotoUpload) { ... parse multipart buffer ... return handleUploadResumePhoto(req, res) }
```

## Frontend Changes

### 1. `client/src/services/studentResumeService.js`
Add:
```javascript
export async function uploadResumePhoto(resumeId, file) {
  const authHeaders = await getAuthHeaders()
  const formData = new FormData()
  formData.append("photo", file)
  const response = await fetch(`${API_BASE_URL}/my/resumes/${resumeId}/photo`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to upload photo")
  return data
}
```

### 2. `client/src/components/resume/sections/FieldInputs.jsx`
Update `PersonalInput` component:
- Add state: `const [photoPreview, setPhotoPreview] = useState(null)`
- Add photo upload UI after the Website field:
  - Show circular preview (120px) if `personal.photo_url` exists
  - Show upload button (camera icon) overlay on hover
  - Hidden `<input type="file" accept="image/*">` triggered by label click
  - On file select: create `URL.createObjectURL(file)` for preview, store file for upload
  - On upload success: `onChange({ ...personal, photo_url: photoUrl })`, revoke blob URL
  - Remove photo button (X icon) when photo exists
- Pass `onPhotoUpload` prop or handle inline with `onChange`

**UI Layout:**
```
┌──────────────────────────────────────┐
│  [Photo Upload Area]                 │
│  ┌────┐                              │
│  │ 📷 │  or  │ img │   [✕ Remove]   │
│  └────┘                              │
│  "Upload a professional headshot"    │
├──────────────────────────────────────┤
│  Full Name *                         │
│  Job Title / Headline                │
│  Email        │  Phone               │
│  Location     │  LinkedIn            │
│  Website / Portfolio                 │
└──────────────────────────────────────┘
```

### 3. `client/src/components/resume/shared/resumeHelpers.js`
Update `extractPersonal` to include `photo_url`:
```javascript
export function extractPersonal(data) {
  const personal = data?.personal || {}
  return {
    name: personal.name || data?.name || "",
    title: personal.title || personal.headline || data?.title || "",
    email: personal.email || data?.email || "",
    phone: personal.phone || data?.phone || "",
    location: personal.location || data?.location || "",
    linkedin: personal.linkedin || data?.linkedin || "",
    website: personal.website || data?.website || "",
    photo_url: personal.photo_url || data?.photo_url || "",
  }
}
```

### 4. Template Rendering

**`ModernTemplate.jsx`** (`ModernHeaderBand`):
- Add circular photo (80px) to the left of the name block
- Position: top-left of the header band, overlapping sidebar edge
- Style: `borderRadius: "50%"`, `border: "2px solid white"`, `objectFit: "cover"`
- Hide if no `personal.photo_url`

**`ClassicTemplate.jsx`** (`ClassicHeader`):
- Add circular photo (100px) centered above the name
- Style: `borderRadius: "50%"`, `objectFit: "cover"`, `marginBottom: 12`

**`MinimalTemplate.jsx`** (`MinimalHeader`):
- Add circular photo (72px) inline with the name, left side
- Style: `borderRadius: "50%"`, `objectFit: "cover"`, `marginRight: 16`, `flexShrink: 0`

### 5. `ResumeBuilderPage.jsx` — No changes needed
- `PersonalInput` handles its own photo state and calls `onChange` to update the resume data
- Photo URL is saved as part of the resume JSON on normal save

## Edge Cases
- **No photo**: Templates render without photo (existing behavior preserved)
- **Invalid file type**: Backend rejects with 400 error, frontend shows error message
- **Upload failure**: Frontend keeps local preview, shows error, retry available
- **Resume deletion**: Photos remain in storage (orphaned) — acceptable for MVP, can add cleanup later
- **Template switch**: Photo appears in all templates consistently
- **Large files**: Backend enforces 5MB limit

## Validation
1. Upload valid JPG → photo appears in preview and in saved resume
2. Upload invalid file (PDF) → backend rejects with error
3. Remove photo → photo disappears from preview and templates
4. Switch templates → photo renders correctly in all 3 templates
5. Edit resume, don't save → photo preview persists in editor
6. Save resume, reload → photo still renders from saved `photo_url`

## Open Questions (resolved)
- Storage bucket: `resume-photos` (new, separate from `avatars`) ✅
- Photo location in data: `personal.photo_url` ✅
- Upload trigger: Inside `PersonalInput` form ✅
- Endpoint: `POST /api/my/resumes/:id/photo` ✅
