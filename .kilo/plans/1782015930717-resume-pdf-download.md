# Resume Builder PDF Download Feature

## Goal
Add PDF download functionality to the student resume builder, allowing students to export their completed resume as a PDF file.

## Decisions

### Library Choice
- **Use**: `html2canvas` + `jsPDF` combination
- **Rationale**: Captures exact visual output, works client-side, reusable pattern

### Bundle Strategy
- **Dynamic import**: Load libraries only when download is initiated
- **Impact**: ~260KB additional bundle, loaded on-demand

## Implementation Tasks

### 1. Dependencies
```bash
npm install html2canvas jspdf
```

### 2. Create Hook (`client/src/hooks/usePdfExport.js`)
- `exportToPdf(elementRef, filename)` function
- Uses dynamic import for libraries
- Handles multi-page content splitting
- Error handling and loading state

### 3. Add PDF Hook (`client/src/components/resume/ResumePrintView.jsx`)
- Add `data-pdf-export` attribute to root div
- Ensure all content is within print-friendly container

### 4. Add UI (`client/src/pages/student/ResumeBuilderPage.jsx`)
- Add Download icon to ResumeEditor toolbar
- Button triggers `usePdfExport` with print view ref
- Show loading state during generation

### 5. Styling Updates
- Hide `GripVertical` icon during PDF export
- Use `html2canvas` `backgroundColor: '#ffffff'`
- Ensure images load before capture (check photo_url)

### 6. Testing Checklist
- [ ] All 3 templates (simple, modern, classic)
- [ ] Resumes with/without photos
- [ ] Short and long content (multi-page)
- [ ] Empty sections handled gracefully
- [ ] Error states tested

## Risks
1. **CORS images**: Remote photos may fail to render - handle gracefully
2. **Memory**: Large resumes may cause browser tab freeze - show loading indicator
3. **Fonts**: Web fonts may not load - fallback to system fonts

## Validation
- PDF opens in Adobe Reader and browser viewers
- Text is selectable/copiable
- Layout matches on-screen preview
- File size reasonable (<5MB for typical resume)