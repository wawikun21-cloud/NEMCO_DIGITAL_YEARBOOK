# Resume Templates - Hardcoded Layout Components Plan

## Current System Analysis

### Existing Files (Data Only - No Visual Layouts)
| File | Purpose | Has Visual Layout? |
|------|---------|-------------------|
| `ResumeSectionRenderer.jsx` | Form inputs for editing | ❌ Single shared styling |
| `ResumeBuilderPage.jsx` | Template gallery + editor | ❌ No preview functionality |
| `TemplatePreviewModal.jsx` | Basic section preview | ❌ No actual layout preview |
| `004_resume_templates.sql` | DB seed data | ❌ No layout_config column |

### Database Templates (Seeded)
```sql
1. Simple (slug: 'simple')   - minimal, clean sections
2. Modern (slug: 'modern')   - contemporary, projects section  
3. Classic (slug: 'classic') - traditional, all sections
```

---

## Missing Components - What We Need to Build

### Component 1: ResumePrintView.jsx
**Purpose:** Render the final resume for screen viewing/printing with template-specific layouts.

**Hardcoded Elements:**
- Name positioning (center, sidebar, top)
- Column layout (single vs two-column)
- Section ordering and display rules
- Color schemes and typography per template
- Spacing and dividers

### Component 2: ResumePDFTemplate.jsx  
**Purpose:** Generate downloadable PDF with proper styling.

**Hardcoded Elements:**
- Page margins per template
- Font families (Helvetica, Inter, Times)
- Header styles and section dividers
- Color definitions for PDF output

### Component 3: ResumeTemplateSelector.jsx
**Purpose:** Visual selector showing layout differences.

**Hardcoded Elements:**
- Layout icons (1-col vs 2-col vs sidebar)
- Mock preview thumbnails
- Section visualization differences

---

## Detailed JSX Structure - Template-by-Template

### Simple (Minimal) Template - Single Column
```jsx
<div className="max-w-3xl mx-auto p-8 print:p-0">
  {/* Name - Center Top */}
  <h1 className="text-center text-3xl font-bold">{data.personal?.name}</h1>
  
  {/* Contact - Inline on same line */}
  <p className="text-center text-sm text-muted">{data.personal?.email} • {data.personal?.phone}</p>
  
  {/* Objective - Italic below contact */}
  {data.objective && (
    <div className="mt-2 italic text-sm">{data.objective}</div>
  )}
  
  {/* Sections in order */}
  {sections.map(section => (
    <section key={section.key} className="mt-4">
      <h2 className="text-sm font-bold uppercase border-b pb-1">{section.label}</h2>
      <div className="mt-2 text-xs">{renderSection(section)}</div>
    </section>
  ))}
</div>
```

### Modern Template - Two Column
```jsx
<div className="flex gap-6 print:gap-4">
  {/* Sidebar - 30% */}
  <aside className="w-[30%] print:w-[35%]">
    <h1 className="text-xl font-semibold mb-2">{data.personal?.name}</h1>
    <div className="text-xs space-y-2">
      <div>{data.personal?.email}</div>
      <div>{data.personal?.phone}</div>
    </div>
    {/* Skills in sidebar */}
    <h3 className="text-xs font-bold mt-4 mb-1">Skills</h3>
    {renderSkills(data.skills)}
  </aside>
  
  {/* Main Content - 70% */}
  <main className="flex-1">
    {sections.filter(s => !['personal', 'skills'].includes(s.key)).map(...)}
  </main>
</div>
```

### Classic Template - Single Column Traditional
```jsx
<div className="max-w-4xl mx-auto p-10 font-serif">
  {/* Name - Large Center */}
  <h1 className="text-center text-4xl font-bold mb-1">{data.personal?.name}</h1>
  
  {/* Contact - Center below name */}
  <p className="text-center text-sm mb-4">{data.personal?.email} | {data.personal?.phone}</p>
  
  {/* Objective - Dedicated section with underline */}
  <h2 className="text-base font-bold underline mb-2">Career Objective</h2>
  <p className="text-sm mb-4">{data.objective}</p>
  
  {/* Traditional sections */}
  {sections.map(section => (
    <div key={section.key} className="mb-4">
      <h2 className="text-base font-bold mb-1">{section.label}</h2>
      <div className="text-sm border-b border-black mb-1 pb-1" />
      <div className="text-sm">{renderSection(section)}</div>
    </div>
  ))}
</div>
```

---

## Hardcoded Design Specifications

### Colors & CSS Variables Needed
```css
/* Simple */
--resume-simple-name: var(--text-primary);
--resume-simple-accent: var(--navy);

/* Modern */  
--resume-modern-primary: var(--sidebar-primary);
--resume-modern-sidebar-bg: var(--bg-subtle);

/* Classic */
--resume-classic-text: #1a1a1a;
--resume-classic-header-underline: #333;
```

### Typography Classes
| Template | Name Class | Header Class | Body Class |
|----------|------------|--------------|------------|
| Simple | `text-3xl font-bold` | `text-sm font-bold uppercase` | `text-xs` |
| Modern | `text-xl font-semibold` | `text-xs font-bold` | `text-xs` |
| Classic | `text-4xl font-bold` | `text-base font-bold underline` | `text-sm font-serif` |

---

## Files to Create

| File | Type | Hardcoded Elements |
|------|------|-------------------|
| `client/src/components/resume/ResumePrintView.jsx` | NEW | All template layouts |
| `client/src/components/resume/ResumePDFTemplate.jsx` | NEW | PDF styling |
| `client/src/services/resumeExportService.js` | NEW | API for export |
| `client/src/components/resume/index.js` | NEW | Exports |

---

## Files to Modify

| File | Changes |
|------|---------|
| `ResumeBuilderPage.jsx` | Add "Preview Resume" button, render `ResumePrintView` |
| `studentResumeService.js` | Add `exportResume()` method |
| `index.css` | Add print media queries, template CSS vars |

---

## Implementation Steps

1. Create `ResumePrintView.jsx` with 3 hardcoded template layouts
2. Add CSS variables to `index.css`
3. Integrate preview in `ResumeBuilderPage.jsx`
4. Create PDF export component
5. Add export functionality

---

## Questions for User

1. Where should the "Preview" button appear? (Editor header or separate tab?)
2. Should Simple use navy accent color or theme primary?
3. Classic template: Georgia or Times New Roman font?
4. PDF library preference? (jsPDF or @react-pdf/renderer)
5. Should Modern use sidebar for skills only or other sections too?