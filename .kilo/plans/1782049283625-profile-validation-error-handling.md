# Profile Page Validation and Error Handling Improvement Plan

## Goal
Implement client-side validation and proper error handling for the student profile editing flow in ProfilePage.jsx and its related components.

## Current State Analysis

### ProfilePage.jsx
- Presentational component only
- Handles loading states (skeleton, disabled buttons)
- No error state display or client-side validation

### useProfile.js Hook
- Uses toast for error notifications
- No client-side validation before API calls
- Silent failures in fetch (profile could remain null indefinitely)

### EditProfileDialog.jsx
- Silent rejection of invalid social links (no user feedback)
- No required field validation
- No avatar file validation

### profileService.js
- Basic response parsing with error messages
- URL normalization silently returns empty string on invalid URLs

## Proposed Changes

### 1. Add Error State to useProfile.js
- Add `profileError` state
- Display error in ProfilePage when profile fails to load
- Show retry button

### 2. Add Client-Side Form Validation to EditProfileDialog.jsx
- Required fields validation: `full_name`, `school`, `course_or_strand`, `year_graduated`
- Inline error messages below each invalid field
- Disable Save button when validation errors exist

### 3. Add Social Link Validation Feedback
- Show error message when invalid URL is entered
- Clear message: "Please enter a valid URL (e.g., https://facebook.com/yourname)"

### 4. Add Avatar File Validation
- Validate file type (image/* only) - matches backend: JPEG, PNG, GIF, WebP only
- Validate file size (max 2MB) - matches backend limit
- Show error toast on invalid file

### Backend Constraints Confirmed (from api/index.js)
- **Avatar**: Max 2MB, JPEG/PNG/GIF/WebP only (line 101-111, 129-137)
- **Profile update**: No backend schema validation - accepts any fields (line 906-913)
- **Resume photo**: Max 5MB, JPEG/PNG/WebP only (line 145-159)

### 5. Enhance profileService.js Response Handling
- Consider returning more structured error info from parseResponse

## Implementation Tasks

| Task | File | Changes |
|------|------|---------|
| 1 | `useProfile.js` | Add `profileError` state, expose error in return, add retry capability |
| 2 | `ProfilePage.jsx` | Display error state with retry button when `profileError` exists |
| 3 | `EditProfileDialog.jsx` | Add `validationErrors` state for required fields |
| 4 | `EditProfileDialog.jsx` | Add `validateField` function for required field checks |
| 5 | `EditProfileDialog.jsx` | Display inline error messages below invalid required fields |
| 6 | `EditProfileDialog.jsx` | Add `validateAvatarFile` function matching backend limits |
| 7 | `EditProfileDialog.jsx` | Show toast on invalid avatar file instead of silent failure |
| 8 | `EditProfileDialog.jsx` | Add `disabled={isSaving || hasValidationErrors}` to Save button |
| 9 (optional) | `vitest.config.js` | Add Vitest testing framework setup if tests needed |
| 10 (optional) | `EditProfileDialog.test.jsx` | Add tests for validation logic if testing framework added

## Validation Rules

**No backend required-field validation** - the API accepts any fields. Client-side validation is purely for UX.

### Required Fields (Client-side UX only)
- `full_name`: Required, max 100 chars
- `school`: Required, max 100 chars  
- `course_or_strand`: Required, max 100 chars
- `year_graduated`: Required, format YYYY-YYYY or YYYY

### Optional Fields with Limits
- `home_address`: Max 200 chars (optional)
- `contact_number`: Max 20 chars (optional)
- `website`: Max 200 chars, must be valid URL if provided
- `social_link1-3`: Valid URL format, max 200 chars each (client normalizes to https:// if missing scheme)
- `skills`: Max 12 items, each up to 50 chars
- `quote`: Max 500 chars
- `about_me`: Max 1000 chars
- `avatar`: JPEG/PNG/GIF/WebP only, max 2MB (enforced by backend)

## Test Plan

Tests are **out of scope** - the project has no testing framework configured. Tasks 9-10 are optional and would require adding Vitest or similar.

## Questions to Resolve

1. Should validation happen on save attempt only, or also live on change? (Recommended: on save attempt for required fields, on change for format validation)
2. Should we validate year_graduated format strictly or allow any input? (Recommended: basic pattern validation YYYY-YYYY, no strict enforcement)