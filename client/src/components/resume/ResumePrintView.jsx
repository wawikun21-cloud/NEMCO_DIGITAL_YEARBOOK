/**
 * ResumePrintView.jsx
 *
 * Renders the A4 resume content at its NATIVE 794×1123px size.
 * Scaling is handled entirely by the parent (ResumeBuilderPage → ResumeEditor).
 * Do NOT add any transform/scale logic here.
 *
 * Props:
 *   data      — { [section_key]: value }
 *   sections  — section definition array from the template
 *   template  — { slug, name }
 *   resume    — { title }
 */

import { extractPersonal } from "./shared/resumeHelpers"
import { MinimalTemplate } from "./templates/MinimalTemplate"
import { ClassicTemplate } from "./templates/ClassicTemplate"
import { ModernTemplate } from "./templates/ModernTemplate"
import { forwardRef } from "react"

const TEMPLATES = {
  minimal: MinimalTemplate,
  simple: MinimalTemplate,
  classic: ClassicTemplate,
  modern: ModernTemplate,
}

const PAGE_PADDING = {
  minimal: 0,
  simple: 0,
  classic: 0,
  modern: 0,
}

const A4_WIDTH = 794
const A4_HEIGHT = 1123

export const ResumePrintView = forwardRef(function ResumePrintView({ data = {}, sections = [], template, resume }, ref) {
  const slug = template?.slug || "minimal"
  const personal = extractPersonal(data)
  const TemplateComponent = TEMPLATES[slug] || MinimalTemplate

  return (
    <div
      ref={ref}
      data-pdf-export
      className="resume-print-view"
      style={{
        width: A4_WIDTH,
        minHeight: A4_HEIGHT,
        background: "#ffffff",
        boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
        padding: PAGE_PADDING[slug] ?? 0,
        boxSizing: "border-box",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <TemplateComponent
        data={data}
        sections={sections}
        personal={personal}
        resume={resume}
      />
    </div>
  )
})