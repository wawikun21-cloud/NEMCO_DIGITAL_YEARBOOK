# Resume Template Text Sizing & Photo Update Plan

## Objective
Adjust text sizing and photo styling in ModernTemplate.jsx for improved readability and professional appearance.

## Decisions

### 1. Photo Style Changes (ModernTemplate.jsx, lines 76-106)
- **Remove circular border** → `borderRadius: 4` (small rounded corners for professional look)
- **Size** → `width: 110px, height: 110px` (larger square format)
- **Border** → `2px solid ${GOLD}` (from 3px to reduce visual weight)

### 2. Text Sizing Changes (ModernTemplate.jsx)

| Element | Current | New | Lines |
|---------|---------|-----|-------|
| `sidebarTokens.bodySize` | 9 | 10 | Line 33 |
| `mainTokens.bodySize` | 10 | 11 | Line 43 |
| Header name | 22 | 24 | Line 121 |
| Header title | 10 | 11 | Line 134 |
| Contact items | 8 | 9 | Line 150 |
| Sidebar heading (h3) | 8.5 | 10 | Line 186 |
| Main heading (h2) | 10 | 11 | Line 222 |

### 3. SectionContent.jsx Typography Scale
Add consistent scale helper to replace magic numbers:
```javascript
const createTypographyScale = (bodySize) => ({
  caption: Math.max(6, bodySize - 2),   // dates, smallest
  small: Math.max(7, bodySize - 1),     // muted descriptions  
  body: bodySize,                       // default text
  heading: bodySize + 1,                // entry titles
})
```

## Implementation Tasks

### Task 1: Update ModernTemplate.jsx - Photo styling
**File**: `client/src/components/resume/templates/ModernTemplate.jsx`
- Lines 76-106: Replace circular photo styling with rectangular
- Change `width: 80` → `width: 110`
- Change `height: 80` → `height: 110`
- Change `borderRadius: "50%"` → `borderRadius: 4`
- Change `border: "3px solid ${GOLD}"` → `border: "2px solid ${GOLD}"`

### Task 2: Update ModernTemplate.jsx - Token sizes
**File**: `client/src/components/resume/templates/ModernTemplate.jsx`
- Line 33: `bodySize: 10` (was 9)
- Line 43: `bodySize: 11` (was 10)
- Line 121: `fontSize: 24` (was 22)
- Line 134: `fontSize: 11` (was 10)
- Line 150: `fontSize: 9` (was 8)
- Line 186: `fontSize: 10` (was 8.5)
- Line 222: `fontSize: 11` (was 10)

### Task 3: Update SectionContent.jsx - Add typography scale
**File**: `client/src/components/resume/shared/SectionContent.jsx`
- Add `createTypographyScale()` helper function after imports
- Replace all `bodySize - 1` → `scale.small`
- Replace all `bodySize + 0.5` → `scale.heading`
- Replace hardcoded values in skills (line 56) and other field types

### Task 4: Create component tests
**File**: `client/src/components/resume/templates/ModernTemplate.test.jsx` (create)
**File**: `client/src/components/resume/shared/SectionContent.test.jsx` (create)

Verify:
- Photo dimensions and border radius
- Font sizes match expected values
- No regressions in template rendering

### Task 5: Validation
- `cd client && npm run lint`
- `npm run dev` - visual inspection
- Test with sample resume data

## Files Affected
1. `client/src/components/resume/templates/ModernTemplate.jsx`
2. `client/src/components/resume/shared/SectionContent.jsx`

## Risks
- **Low**: Styling-only changes, no logic modifications
- **Mitigation**: Typography scale centralizes sizing logic

## Validation Plan
1. `npm run lint` in client directory
2. Visual verification in browser at `/resume/preview/[id]`
3. Compare before/after screenshots for consistency