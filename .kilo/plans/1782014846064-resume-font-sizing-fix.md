# Resume Font Sizing Compliance Plan

## Objective
Update all three resume templates (Modern, Minimal, Classic) to comply with specified typography requirements while addressing excessive whitespace in ModernTemplate.

## Current State Analysis

Based on code inspection, the current implementation does NOT fully comply:

| Element | Required | ModernTemplate | MinimalTemplate | ClassicTemplate |
|---------|----------|---------------|---------------|---------------|
| Full Name | 18-24pt Bold | ✅ 24pt Bold | ❌ 34pt (300 weight) | ✅ 30pt Bold |
| Section Headings | 14-16pt Bold | ❌ 10pt/11pt | ❌ 8.5pt | ❌ 10pt |
| Job Titles/Degrees | 12-14pt Bold | ⚠️ 11pt-12pt | ❌ 11pt | ❌ 11.5pt |
| Body Text/Bullets | 10-12pt | ⚠️ 10pt-11pt | ✅ 10pt | ✅ 10.5pt |
| Dates/Location | 10-11pt | ⚠️ 9pt-11pt | ❌ 9pt | ❌ 9pt |

## Decisions

### 1. Typography Scale Standardization
Unify the typography scale in `SectionContent.jsx` to ensure consistent hierarchy:

```javascript
const createTypographyScale = (bodySize) => ({
  caption: Math.max(9, bodySize - 1),   // dates/location: 9-10pt
  small: Math.max(10, bodySize),       // body text: 10-11pt
  body: bodySize + 1,                  // slightly larger body: 11-12pt  
  heading: bodySize + 3,                // job titles: 13-14pt
})
```

### 2. ModernTemplate Changes (Primary focus for spacing)
**File**: `client/src/components/resume/templates/ModernTemplate.jsx`

| Element | Current | New | Purpose |
|---------|---------|-----|---------|
| Name | 24pt | 24pt | ✅ Already compliant |
| Title | 11pt | 12pt | Match 12-14pt range |
| Contact items | 9pt | 10pt | Comply with 10-11pt |
| Sidebar h3 | 10pt | 14pt | Section headings spec |
| Main h2 | 11pt | 15pt | Section headings spec |
| sidebarTokens.bodySize | 10 | 11 | Increase for less whitespace |
| mainTokens.bodySize | 11 | 12 | Increase for less whitespace |
| Section entries (job titles) | bodySize+1 | scale.heading | 14pt for prominence |

### 3. MinimalTemplate Changes
**File**: `client/src/components/resume/templates/MinimalTemplate.jsx`

| Element | Current | New |
|---------|---------|-----|
| Name | 34pt (300) | 24pt Bold |
| Section Headings (h2) | 8.5pt | 14pt Bold |
| Body text | 10pt | 11pt |

### 4. ClassicTemplate Changes
**File**: `client/src/components/resume/templates/ClassicTemplate.jsx`

| Element | Current | New |
|---------|---------|-----|
| Section Headings (h2) | 10pt | 14pt Bold |
| Body size | 10.5pt | 12pt |

## Implementation Tasks

### Task 1: Update SectionContent.jsx Typography Scale
**File**: `client/src/components/resume/shared/SectionContent.jsx`
- Modify `createTypographyScale()` function to use proper hierarchy
- Replace all hardcoded font sizes with scale values
- Ensure job titles/degrees use `scale.heading` (12-14pt)
- Ensure dates use `scale.caption` (10-11pt)

### Task 2: Update ModernTemplate.jsx
**File**: `client/src/components/resume/templates/ModernTemplate.jsx`
- Line 33: `bodySize: 11` (increase from 10)
- Line 43: `bodySize: 12` (increase from 11)
- Line 134: `fontSize: 12` (increase title from 11)
- Line 150: `fontSize: 10` (increase contacts from 9)
- Line 186: `fontSize: 14` (section heading, from 10)
- Line 222: `fontSize: 15` (main section heading, from 11)

### Task 3: Update MinimalTemplate.jsx
**File**: `client/src/components/resume/templates/MinimalTemplate.jsx`
- Line 43: `fontSize: 24, fontWeight: 700` (name, from 34/300)
- Line 100: `fontSize: 14, fontWeight: 700` (section heading, from 8.5)

### Task 4: Update ClassicTemplate.jsx
**File**: `client/src/components/resume/templates/ClassicTemplate.jsx`
- Line 27: `bodySize: 12` (from 10.5)
- Line 108: `fontSize: 14, fontWeight: 700` (section heading, already 700)

### Task 5: Validation
1. Run `npm run lint` in client directory
2. Visual inspection at `/resume/preview/[id]`
3. Compare before/after screenshots for spacing improvement

## Files Affected
1. `client/src/components/resume/shared/SectionContent.jsx`
2. `client/src/components/resume/templates/ModernTemplate.jsx`
3. `client/src/components/resume/templates/MinimalTemplate.jsx`
4. `client/src/components/resume/templates/ClassicTemplate.jsx`

## Risks
- **Medium**: Large font size increases may cause text overflow in tight spaces
- **Mitigation**: Test with realistic resume data, adjust padding/margins if needed

## Validation Plan
1. `npm run lint` in client directory - ensure no errors
2. Visual verification with browser - check A4 spacing and hierarchy
3. Verify all three templates render correctly with sample data