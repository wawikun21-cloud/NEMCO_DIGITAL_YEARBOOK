/**
 * ResumeSectionRenderer.jsx  (refactored)
 *
 * Renders a single editable section card in the resume editor.
 * Field input components are imported from FieldInputs.jsx — this file
 * only owns the card shell (header, collapse, required state).
 */

import { useState } from "react"
import { GripVertical, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { FIELD_RENDERERS, TextInput } from "./sections/FieldInputs"

function hasContent(value) {
  if (value === undefined || value === null || value === "") return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === "object") return Object.keys(value).length > 0
  return true
}

export function ResumeSectionRenderer({ section, value, onChange, onPhotoUpload, isExporting }) {
  const [collapsed, setCollapsed] = useState(false)
  const Renderer = FIELD_RENDERERS[section.field_type] || TextInput
  const filled = hasContent(value)
  const requiredEmpty = section.is_required && !filled

  return (
    <div className={cn(
      "rounded-lg border transition-all duration-150",
      requiredEmpty
        ? "border-amber-300 bg-amber-50/40 dark:border-amber-700 dark:bg-amber-950/10"
        : filled
          ? "border-emerald-200 bg-[var(--bg-surface)] dark:border-emerald-800"
          : "border-[var(--border-light)] bg-[var(--bg-surface)]"
    )}>
      {/* Section header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 cursor-pointer select-none"
        onClick={() => setCollapsed(!collapsed)}
        role="button"
        aria-expanded={!collapsed}
      >
        {!isExporting && (
          <GripVertical
            size={14}
            className="text-[var(--text-muted)] shrink-0 cursor-grab"
            onClick={(e) => e.stopPropagation()}
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{section.label}</h4>
            {section.is_required && (
              <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Required</span>
            )}
          </div>
          {section.description && !collapsed && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{section.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {filled && (
            <CheckCircle2 size={13} className="text-emerald-500 dark:text-emerald-400" />
          )}
          {collapsed
            ? <ChevronDown size={14} className="text-[var(--text-muted)]" />
            : <ChevronUp size={14} className="text-[var(--text-muted)]" />
          }
        </div>
      </div>

      {/* Field input area */}
      {!collapsed && (
        <div className="border-t border-[var(--border-light)] px-4 py-3">
          <Renderer
            value={value}
            onChange={onChange}
            placeholder={section.description}
            config={section.config}
            onPhotoUpload={onPhotoUpload}
          />
        </div>
      )}
    </div>
  )
}