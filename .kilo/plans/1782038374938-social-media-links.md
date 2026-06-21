# Plan: Add Social Media Links + Fix Avatar Upload for Serverless

## Problem Analysis

### 1. Avatar Upload Issue (Broken Image)
- **Root Cause**: In serverless environments, the `avatars` storage bucket may not be public or may not exist at deployment time
- **Evidence**: `api/index.js` uploads to `avatars` bucket and calls `getPublicUrl()` but there's no bucket initialization code (unlike `flipbook-pdfs` and `resume-photos` which have `ensureFlipbookBucket` and `ensureResumePhotoBucket`)
- **Secondary Issue**: The avatar URL returned may need proper URL handling for serverless deployment (query params may interfere with caching)

### 2. Social Media Links Implementation
- **Current State**: No social media fields exist in the profile schema
- **Required**: Add up to 3 social media links to the profile system

## Decisions

### Social Media Fields Strategy
**Recommended**: Use individual columns (`social_link1`, `social_link2`, `social_link3`) storing the full URL
- Simpler querying (no JSON parsing)
- Enforces max 3 links at DB level
- Compatible with existing string-based profile fields

### Social Media Platforms
Support common platforms with icons:
1. Facebook
2. Twitter/X
3. Instagram
4. LinkedIn
5. Personal Website (existing)

## Implementation Plan

### Phase 1: Backend - Database & API
- [ ] Create migration for social media columns: `social_link1`, `social_link2`, `social_link3` (text, nullable)
- [ ] Update `server/src/validators/profileValidator.js` - add social_link1-3 to Zod schema (max 200 chars each)
- [ ] Update `server/src/services/profileService.js` - add social columns to PROFILE_COLUMNS
- [ ] Update `api/index.js`:
  - Add bucket initialization for `avatars` bucket on cold start
  - Add social_link fields to profile select statements

### Phase 2: Frontend - Hook & State
- [ ] Update `client/src/hooks/useProfile.js`:
  - Add `social_link1`, `social_link2`, `social_link3` to `emptyEditable`
  - Add social links to `hydrateEditable` function

### Phase 3: Frontend - Edit Dialog
- [ ] Update `client/src/components/profile/EditProfileDialog.jsx`:
  - Add SocialMediaInput component (similar to SkillsInput pattern)
  - Support adding/removing links up to max 3
  - Show platform icon based on URL detection

### Phase 4: Frontend - Profile Card Display
- [ ] Update `client/src/components/profile/ProfileCardFront.jsx`:
  - Add social links display section with icons
  - Show clickable links with platform colors

### Phase 5: Avatar Fix - Serverless
- [ ] Create `ensureAvatarBucket()` in `server/src/config/supabase.js`
- [ ] Call `ensureAvatarBucket()` during server initialization
- [ ] For serverless (`api/index.js`): Add bucket creation check on first request

## Validation Steps
1. Upload avatar → Verify image displays correctly on profile card
2. Add social links → Save profile → Verify links persist and display
3. Generate QR code → Verify social links are included in QR payload
4. Deploy to Vercel → Test both avatar and social links in production

## Risks & Mitigations
- **Risk**: Existing profiles without social fields will have null values
  - **Mitigation**: Default to empty string in frontend
- **Risk**: Avatar bucket doesn't exist in production Supabase
  - **Mitigation**: Add automatic bucket creation with public access