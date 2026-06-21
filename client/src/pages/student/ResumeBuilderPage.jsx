import { useState, useEffect, useCallback, useRef } from "react"
import {
  FileText,
  Plus,
  Trash2,
  Eye,
  Globe,
  GlobeLock,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  Layout,
  Check,
  Pencil,
  Save,
  X,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ResumeSectionRenderer } from "@/components/resume/ResumeSectionRenderer"
import { ResumePrintView } from "@/components/resume/ResumePrintView"
import {
  getMyResumes,
  getMyResumeDetail,
  createMyResume,
  updateMyResume,
  uploadResumePhoto,
  deleteMyResume,
  getPublicTemplates,
  getPublicTemplateDetail,
} from "@/services/studentResumeService"

// ─── Template Gallery ────────────────────────────────────────────────────────

function TemplateGallery({ templates, onSelect, onPreview }) {
  if (!templates || templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-light)] p-16 text-center">
        <Layout size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-40" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">No templates available</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Check back later for resume templates</p>
      </div>
    )
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group relative rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-[var(--navy)]/30 hover:-translate-y-0.5"
        >
          {/* Preview thumbnail — A4 ratio (1:1.414) */}
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900" style={{ paddingBottom: "141.4%" }}>
            <div className="absolute inset-3 rounded-lg overflow-hidden shadow-md">
              <TemplateThumbnail slug={template.slug} name={template.name} thumbnailUrl={template.thumbnail_url} />
            </div>
            {template.is_default && (
              <div className="absolute top-2.5 right-2.5">
                <Badge variant="approved" className="text-[10px] gap-1 shadow-sm">
                  <Check size={9} /> Default
                </Badge>
              </div>
            )}
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-[var(--navy)]/0 group-hover:bg-[var(--navy)]/10 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              <Button
                size="sm"
                className="gap-1.5 text-xs shadow-lg"
                onClick={() => onSelect(template)}
              >
                <Plus size={12} /> Use Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs bg-white/90 shadow-lg"
                onClick={() => onPreview(template)}
              >
                <Eye size={12} /> Preview
              </Button>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{template.name}</h3>
                {template.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-2">{template.description}</p>
                )}
              </div>
              <span className="text-[10px] text-[var(--text-muted)] shrink-0 pt-0.5">
                {Array.isArray(template.default_sections) ? template.default_sections.length : 0} sections
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => onSelect(template)}>
                <Plus size={12} /> Use Template
              </Button>
              <Button variant="outline" size="icon-sm" className="h-8 w-8" onClick={() => onPreview(template)}>
                <Eye size={12} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Mini template preview thumbnails — rendered as actual mini resume
function TemplateThumbnail({ slug, name, thumbnailUrl }) {
  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover object-top" />
  }

  const colors = {
    simple: { bg: "#ffffff", accent: "#132F45", bar: "#132F45" },
    modern: { bg: "#ffffff", accent: "#d9a300", bar: "#132F45" },
    classic: { bg: "#ffffff", accent: "#1a1a1a", bar: "#1a1a1a" },
  }
  const c = colors[slug] || colors.simple

  return (
    <div className="w-full h-full text-[2.5px]" style={{ background: c.bg, fontFamily: "sans-serif", padding: "6px" }}>
      {/* Name block */}
      {slug === "modern" ? (
        <div className="flex gap-1.5 h-full">
          {/* Sidebar */}
          <div className="w-[30%] rounded-sm" style={{ background: c.bar, padding: "3px" }}>
            <div className="rounded-sm mb-1" style={{ background: "rgba(255,255,255,0.9)", height: "6px", width: "80%" }} />
            <div className="rounded-sm mb-2" style={{ background: "rgba(255,255,255,0.5)", height: "2px", width: "90%" }} />
            {[12, 10, 14, 8].map((w, i) => (
              <div key={i} className="rounded-sm mb-0.5" style={{ background: "rgba(255,255,255,0.3)", height: "1.5px", width: `${w * 4}%` }} />
            ))}
          </div>
          {/* Main */}
          <div className="flex-1" style={{ padding: "2px" }}>
            {["Experience", "Education"].map((label) => (
              <div key={label} className="mb-2">
                <div className="rounded-sm mb-1" style={{ background: c.accent, height: "1.5px", width: "40%" }} />
                {[90, 70, 80].map((w, i) => (
                  <div key={i} className="rounded-sm mb-0.5" style={{ background: "#d1d5db", height: "1px", width: `${w}%` }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="text-center mb-2">
            <div className="mx-auto rounded-sm mb-0.5" style={{ background: c.bar, height: "4px", width: "50%" }} />
            <div className="mx-auto rounded-sm" style={{ background: "#9ca3af", height: "1.5px", width: "60%" }} />
          </div>
          {slug === "classic" && <div style={{ borderBottom: `0.5px solid ${c.accent}`, marginBottom: "2px" }} />}
          {["Experience", "Education", "Skills"].map((label, si) => (
            <div key={label} className="mb-1.5">
              <div
                className="rounded-sm mb-0.5"
                style={{
                  background: c.accent,
                  height: "1.5px",
                  width: "35%",
                  borderBottom: slug === "classic" ? `0.3px solid ${c.accent}` : undefined,
                }}
              />
              {[90, 70 + si * 5, 80].map((w, i) => (
                <div key={i} className="rounded-sm mb-0.5" style={{ background: "#d1d5db", height: "1px", width: `${w}%` }} />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Template Preview Modal ───────────────────────────────────────────────────

function TemplatePreviewModal({ template, sections, open, onClose, onUse }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout size={18} />
            {template?.name} Template
          </DialogTitle>
          <DialogDescription>
            {template?.description || "Preview this template's sections and layout"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Thumbnail */}
          <div
            className="relative rounded-lg overflow-hidden border border-[var(--border-light)] bg-slate-50 dark:bg-slate-800"
            style={{ paddingBottom: "141.4%" }}
          >
            <div className="absolute inset-0 p-4 flex items-center justify-center">
              <div className="w-full h-full rounded-md overflow-hidden shadow-md">
                <TemplateThumbnail slug={template?.slug} name={template?.name} thumbnailUrl={template?.thumbnail_url} />
              </div>
            </div>
          </div>

          {/* Section list */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Included Sections ({sections?.length || 0})
            </h4>
            {sections && sections.length > 0 ? (
              <div className="space-y-1.5">
                {sections.map((section, i) => (
                  <div
                    key={section.id || i}
                    className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 px-3 py-2"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--navy)]/10 text-[9px] font-bold text-[var(--navy)]">
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[var(--text-primary)]">{section.label}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        {section.field_type?.replace(/_/g, " ")}
                        {section.is_required ? " · Required" : " · Optional"}
                      </p>
                    </div>
                    {section.is_required && (
                      <span className="text-[9px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic">No sections defined</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onUse(template); onClose() }} className="gap-2">
            <Plus size={14} /> Use This Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── My Resumes List ─────────────────────────────────────────────────────────

function MyResumesList({ resumes, loading, onEdit, onDelete, onNew }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!resumes || resumes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border-light)] p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--navy)]/5">
          <FileText size={28} className="text-[var(--navy)]/40" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">No resumes yet</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Create your first resume to get started</p>
        <Button size="sm" className="mt-5 gap-2" onClick={onNew}>
          <Plus size={14} /> Create Resume
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {resumes.map((resume) => (
        <div
          key={resume.id}
          className="flex items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4 transition-all hover:border-[var(--navy)]/25 hover:shadow-sm cursor-pointer"
          onClick={() => onEdit(resume)}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--navy)]/8">
            <FileText size={20} className="text-[var(--navy)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{resume.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="pending" className="text-[10px] capitalize">{resume.template || "simple"}</Badge>
              <span className="text-[10px] text-[var(--text-muted)]">
                {resume.is_public ? "Public" : "Private"}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                · Updated {new Date(resume.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => onEdit(resume)}>
              <Pencil size={12} /> Edit
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => onDelete(resume)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Split-Screen Resume Editor (resume.io style) ────────────────────────────

function ResumeEditor({ resume, template, sections, onBack, onSave, saving, allTemplates, onSwitchTemplate }) {
   const [data, setData] = useState(resume?.data || {})
   const [title, setTitle] = useState(resume?.title || "My Resume")
   const [isPublic, setIsPublic] = useState(resume?.is_public || false)
   const [editingTitle, setEditingTitle] = useState(false)
   const [hasChanges, setHasChanges] = useState(false)
   const [activeSection, setActiveSection] = useState(sections?.[0]?.section_key || null)
   const [previewScale, setPreviewScale] = useState(0)
   const [showMobilePreview, setShowMobilePreview] = useState(false)
   const [confirmExit, setConfirmExit] = useState(false)
   const previewContainerRef = useRef(null)

   useEffect(() => {
    const el = previewContainerRef.current
    if (!el) return
    const calcScale = (w) => Math.max(0.2, Math.min(1, (w - 64) / 794))
    setPreviewScale(calcScale(el.getBoundingClientRect().width))
    const obs = new ResizeObserver(([entry]) => {
      setPreviewScale(calcScale(entry.contentRect.width))
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const handlePhotoUpload = async (file) => {
    if (!resume?.id) throw new Error("Resume is not ready for photo upload")
    return uploadResumePhoto(resume.id, file)
  }

  const updateSection = useCallback((sectionKey, value) => {
    setData((prev) => ({ ...prev, [sectionKey]: value }))
    setHasChanges(true)
  }, [])

  const handleSave = () => {
    onSave({ title, data, isPublic })
    setHasChanges(false)
  }

  const filledSections = sections.filter((s) => {
    const val = data[s.section_key]
    if (val === undefined || val === null || val === "") return false
    if (Array.isArray(val) && val.length === 0) return false
    return true
  }).length

  const requiredSections = sections.filter((s) => s.is_required)
  const filledRequired = requiredSections.filter((s) => {
    const val = data[s.section_key]
    if (val === undefined || val === null || val === "") return false
    if (Array.isArray(val) && val.length === 0) return false
    return true
  }).length

  const completionPct = sections.length > 0 ? Math.round((filledSections / sections.length) * 100) : 0

  return (
     <div className="flex flex-col h-full">
       {/* ── Top bar ── */}
       <div className="flex items-center gap-3 border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-3 sticky top-0 z-20 shadow-sm">
         <Button
           variant="ghost"
           size="icon-sm"
           className="h-8 w-8 shrink-0"
           onClick={() => hasChanges ? setConfirmExit(true) : onBack()}
         >
           <ArrowLeft size={16} />
         </Button>

         {/* Title */}
         <div className="flex-1 min-w-0">
           {editingTitle ? (
             <div className="flex items-center gap-2">
               <Input
                 value={title}
                 onChange={(e) => { setTitle(e.target.value); setHasChanges(true) }}
                 className="h-7 text-sm font-semibold max-w-[240px]"
                 autoFocus
                 onBlur={() => setEditingTitle(false)}
                 onKeyDown={(e) => e.key === "Enter" && setEditingTitle(false)}
               />
            </div>
          ) : (
            <button
              className="flex items-center gap-1.5 group"
              onClick={() => setEditingTitle(true)}
            >
              <span className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[200px]">{title}</span>
              <Pencil size={11} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="pending" className="text-[9px] capitalize">{template?.name || resume?.template}</Badge>
            <div className="flex items-center gap-1">
              <div className="h-1 w-16 rounded-full bg-[var(--border-light)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
              <span className="text-[9px] text-[var(--text-muted)]">{completionPct}%</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile preview toggle */}
          <Button
            variant="outline"
            size="icon-sm"
            className={cn("h-8 w-8 lg:hidden", showMobilePreview && "bg-[var(--navy)] text-white border-[var(--navy)]")}
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            title="Toggle preview"
          >
            <Eye size={14} />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => { setIsPublic(!isPublic); setHasChanges(true) }}
          >
            {isPublic ? <Globe size={12} /> : <GlobeLock size={12} />}
            <span className="hidden sm:inline">{isPublic ? "Public" : "Private"}</span>
          </Button>

          <Button
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            <span className="hidden sm:inline">Save</span>
          </Button>
        </div>
      </div>

      {/* ── Split Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — form editor */}
        <div
          className={cn(
            "flex flex-col w-full lg:w-[420px] xl:w-[460px] shrink-0 border-r border-[var(--border-light)] bg-[var(--bg-page)] overflow-y-auto overflow-x-hidden styled-scroll",
            showMobilePreview && "hidden lg:flex"
          )}
        >
          {/* Section nav */}
          <div className="flex items-center gap-1 border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 overflow-x-auto scrollbar-none">
            {sections.map((section) => {
              const val = data[section.section_key]
              const filled = val !== undefined && val !== null && val !== "" &&
                !(Array.isArray(val) && val.length === 0)
              return (
                <button
                  key={section.section_key}
                  onClick={() => {
                    setActiveSection(section.section_key)
                    document.getElementById(`section-${section.section_key}`)?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors shrink-0",
                    activeSection === section.section_key
                      ? "bg-[var(--navy)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {filled && (
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", activeSection === section.section_key ? "bg-emerald-300" : "bg-emerald-500")} />
                  )}
                  {section.label}
                </button>
              )
            })}
          </div>

          {/* Required warning */}
          {requiredSections.length > 0 && filledRequired < requiredSections.length && (
            <div className="mx-4 mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>
                {filledRequired}/{requiredSections.length} required sections completed.
              </span>
            </div>
          )}

          {/* Form sections */}
          <div className="flex-1 space-y-4 p-4">
            {sections.map((section) => (
              <div
                key={section.id || section.section_key}
                id={`section-${section.section_key}`}
                className="scroll-mt-4"
              >
                <ResumeSectionRenderer
                  section={section}
                  value={data[section.section_key]}
                  onChange={(value) => updateSection(section.section_key, value)}
                  onPhotoUpload={handlePhotoUpload}
                />
              </div>
            ))}
            <div className="pt-4 pb-2">
              <Button size="sm" className="gap-1.5 w-full" onClick={handleSave} disabled={saving || !hasChanges}>
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — live A4 preview */}
        <div
          ref={previewContainerRef}
          className={cn(
            "flex-1 min-w-0 bg-[#e8edf0] dark:bg-[#0d1520] flex flex-col overflow-hidden",
            showMobilePreview ? "flex" : "hidden lg:flex"
          )}
          style={{ minWidth: 0 }}
        >
          {/* Preview toolbar */}
          <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 bg-[var(--bg-surface)]/80 backdrop-blur-sm px-4 py-2">
            <span className="text-[11px] font-medium text-[var(--text-muted)]">Live Preview</span>
            <div className="flex items-center gap-1">
              {/* Template switcher */}
              {allTemplates && allTemplates.length > 1 && (
                <div className="flex items-center gap-0.5 rounded-md border border-[var(--border-light)] p-0.5 bg-[var(--bg-surface)]">
                  {allTemplates.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => !saving && onSwitchTemplate(t)}
                      disabled={saving}
                      className={cn(
                        "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                        (template?.slug === t.slug || template?.id === t.id)
                          ? "bg-[var(--navy)] text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable preview area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden styled-scroll">
            <div className="flex items-start justify-center p-6 min-h-full">
              {/* Outer wrapper: sized to the SCALED dimensions so the scrollbar is accurate */}
              <div
                style={{
                  width: 794 * previewScale,
                  height: 1123 * previewScale,
                  flexShrink: 0,
                  position: "relative",
                  visibility: previewScale === 0 ? "hidden" : "visible",
                }}
              >
                {/* A4 canvas at native size, scaled down via transform */}
                <div
                  style={{
                    transform: `scale(${previewScale})`,
                    transformOrigin: "top left",
                    width: 794,
                    minHeight: 1123,
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <ResumePrintView
                    data={data}
                    sections={sections}
                    template={template}
                    resume={resume}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved changes confirmation */}
      <Dialog open={confirmExit} onOpenChange={setConfirmExit}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Are you sure you want to leave?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmExit(false)}>Stay</Button>
            <Button onClick={() => { setConfirmExit(false); onBack() }}>Leave</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResumeBuilderPage() {
  const [view, setView] = useState("list")
  const [resumes, setResumes] = useState([])
  const [templates, setTemplates] = useState([])
  const [editingResume, setEditingResume] = useState(null)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editingSections, setEditingSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [previewSections, setPreviewSections] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setError(null)
    try {
      const [resumesData, templatesData] = await Promise.all([
        getMyResumes(),
        getPublicTemplates(),
      ])
      setResumes(resumesData || [])
      setTemplates(templatesData || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => fetchData())
  }, [fetchData])

  const getPublicTemplateWithSections = async (slug) => {
    return await getPublicTemplateDetail(slug)
  }

  const handleNewResume = () => setView("gallery")

  const handleSelectTemplate = async (template) => {
    setSaving(true)
    try {
      const newResume = await createMyResume({
        title: `My ${template.name} Resume`,
        template: template.slug,
        data: {},
      })
      const detail = await getPublicTemplateWithSections(template.slug)
      setEditingResume(newResume)
      setEditingTemplate(detail.template)
      setEditingSections(detail.sections || [])
      setView("editor")
      toast.success(`Created new ${template.name} resume`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message || "Failed to create resume")
    } finally {
      setSaving(false)
    }
  }

  const handleEditResume = async (resume) => {
    setSaving(true)
    try {
      const [detail, fullResume] = await Promise.all([
        getPublicTemplateWithSections(resume.template),
        getMyResumeDetail(resume.id),
      ])
      setEditingResume(fullResume)
      setEditingTemplate(detail.template)
      setEditingSections(detail.sections || [])
      setView("editor")
    } catch (err) {
      setError(err.message)
      toast.error(err.message || "Failed to load resume")
    } finally {
      setSaving(false)
    }
  }

  const validateRequiredSections = (sections, data) => {
    const errors = {}
    for (const section of sections) {
      if (!section.is_required) continue
      const value = data[section.section_key]
      let isValid = true
      if (value === undefined || value === null || value === "") {
        isValid = false
      } else if (Array.isArray(value) && value.length === 0) {
        isValid = false
      }
      if (!isValid) {
        errors[section.section_key] = `${section.label} is required`
      }
    }
    return errors
  }

  const handleSaveResume = async ({ title, data, isPublic }) => {
    if (!editingResume) return
    const validationErrors = validateRequiredSections(editingSections, data)
    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0]
      toast.error(firstError)
      return
    }
    setSaving(true)
    try {
      await updateMyResume(editingResume.id, { title, data, isPublic })
      const updated = await getMyResumeDetail(editingResume.id)
      setEditingResume(updated)
      toast.success("Resume saved successfully")
    } catch (err) {
      setError(err.message)
      toast.error(err.message || "Failed to save resume")
    } finally {
      setSaving(false)
    }
  }

  const handleSwitchTemplate = async (newTemplate) => {
    if (!editingResume) return
    setSaving(true)
    try {
      const detail = await getPublicTemplateWithSections(newTemplate.slug)
      await updateMyResume(editingResume.id, { template: newTemplate.slug })
      setEditingTemplate(detail.template)
      setEditingSections(detail.sections || [])
      setEditingResume((prev) => ({ ...prev, template: newTemplate.slug }))
      toast.success(`Switched to ${newTemplate.name} template`)
    } catch (err) {
      setError(err.message)
      toast.error(err.message || "Failed to switch template")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteResume = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteMyResume(deleteConfirm.id)
      setDeleteConfirm(null)
      await fetchData()
      toast.success("Resume deleted successfully")
    } catch (err) {
      setError(err.message)
      toast.error(err.message || "Failed to delete resume")
    } finally {
      setDeleting(false)
    }
  }

  const handlePreviewTemplate = async (template) => {
    setPreviewTemplate(template)
    setPreviewOpen(true)
    try {
      const detail = await getPublicTemplateWithSections(template.slug)
      setPreviewSections(detail.sections || [])
    } catch {
      setPreviewSections([])
    }
  }

  // Full-screen editor mode — no outer padding
  if (view === "editor") {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 px-4 py-2 text-xs text-[var(--status-red)]">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)}><X size={13} /></button>
          </div>
        )}
        <ResumeEditor
          resume={editingResume}
          template={editingTemplate}
          sections={editingSections}
          onBack={() => { setView("list"); setEditingResume(null); fetchData() }}
          onSave={handleSaveResume}
          saving={saving}
          allTemplates={templates}
          onSwitchTemplate={handleSwitchTemplate}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl flex items-center gap-2">
            <FileText size={24} />
            Resume Builder
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {view === "list" && "Your professional resumes, ready to edit anytime"}
            {view === "gallery" && "Choose a template to get started — you can switch it later"}
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          {view !== "list" && (
            <Button variant="outline" size="sm" onClick={() => setView("list")} className="gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
          )}
          {view === "list" && (
            <Button size="sm" onClick={handleNewResume} className="gap-2">
              <Plus size={14} /> New Resume
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-[var(--status-red)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0"><X size={14} /></button>
        </div>
      )}

      {view === "list" && (
        <MyResumesList
          resumes={resumes}
          loading={loading}
          onEdit={handleEditResume}
          onDelete={(resume) => setDeleteConfirm(resume)}
          onNew={handleNewResume}
        />
      )}

      {view === "gallery" && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Sparkles size={14} />
            <span>Pick a template — you can switch it anytime without losing your content</span>
          </div>
          <TemplateGallery
            templates={templates}
            onSelect={handleSelectTemplate}
            onPreview={handlePreviewTemplate}
          />
        </div>
      )}

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        sections={previewSections}
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewTemplate(null) }}
        onUse={handleSelectTemplate}
      />

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              Delete Resume
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirm?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
            <Button
              onClick={handleDeleteResume}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}