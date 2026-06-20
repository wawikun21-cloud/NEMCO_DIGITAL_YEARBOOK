import { useState, useEffect, useCallback } from "react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { ResumeSectionRenderer } from "@/components/resume/ResumeSectionRenderer"
import {
  getMyResumes,
  getMyResumeDetail,
  createMyResume,
  updateMyResume,
  deleteMyResume,
  getPublicTemplates,
  getPublicTemplateDetail,
} from "@/services/studentResumeService"

function TemplateGallery({ templates, onSelect, onPreview }) {
  if (!templates || templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-light)] p-12 text-center">
        <Layout size={40} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">No templates available</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Check back later for resume templates</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <div
          key={template.id}
          className="group rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden transition-all hover:shadow-md hover:border-[var(--bg-primary)]/30"
        >
          <div className="relative">
            {template.thumbnail_url ? (
              <img
                src={template.thumbnail_url}
                alt={template.name}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-[var(--bg-primary)]/5 to-[var(--bg-primary)]/15 flex items-center justify-center">
                <FileText size={48} className="text-[var(--bg-primary)]/30" />
              </div>
            )}
            {template.is_default && (
              <div className="absolute top-2 right-2">
                <Badge variant="approved" className="text-[10px] gap-1">
                  <Check size={9} /> Default
                </Badge>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{template.name}</h3>
            {template.description && (
              <p className="text-xs text-[var(--text-muted)] mt-1 line-clamp-2">{template.description}</p>
            )}
            <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
              <span>{Array.isArray(template.default_sections) ? template.default_sections.length : 0} sections</span>
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => onSelect(template)}>
                <Plus size={12} /> Use Template
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onPreview(template)}>
                <Eye size={12} /> Preview
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function TemplatePreviewModal({ template, sections, open, onClose, onUse }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout size={18} />
            {template?.name}
          </DialogTitle>
          <DialogDescription>
            {template?.description || "Preview this template's sections and layout"}
          </DialogDescription>
        </DialogHeader>

        {template?.thumbnail_url && (
          <div className="rounded-lg overflow-hidden border border-[var(--border-light)]">
            <img src={template.thumbnail_url} alt={template.name} className="w-full h-48 object-cover" />
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Sections ({sections?.length || 0})
          </h4>
          {sections && sections.length > 0 ? (
            <div className="space-y-2">
              {sections.map((section, i) => (
                <div
                  key={section.id || i}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 px-3 py-2.5"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-[10px] font-bold text-[var(--bg-primary)]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{section.label}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {section.field_type?.replace(/_/g, " ")}
                      {section.is_required ? " • Required" : " • Optional"}
                    </p>
                  </div>
                  {section.is_required && (
                    <span className="text-[9px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">Required</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] italic">No sections defined for this template</p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={() => { onUse(template); onClose() }} className="gap-2">
            <Plus size={14} /> Use This Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResumeEditor({ resume, template, sections, onBack, onSave, saving }) {
  const [data, setData] = useState(resume?.data || {})
  const [title, setTitle] = useState(resume?.title || "My Resume")
  const [isPublic, setIsPublic] = useState(resume?.is_public || false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const updateSection = useCallback((sectionKey, value) => {
    setData((prev) => ({ ...prev, [sectionKey]: value }))
    setHasChanges(true)
  }, [])

  const handleSave = () => {
    onSave({ title, data, isPublic })
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setHasChanges(true) }}
                  className="h-8 text-sm font-semibold w-[200px]"
                  autoFocus
                />
                <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => setEditingTitle(false)}>
                  <Check size={14} />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2>
                <Button variant="ghost" size="icon-sm" className="h-6 w-6" onClick={() => setEditingTitle(true)}>
                  <Pencil size={12} />
                </Button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="pending" className="text-[10px] capitalize">{template?.name || resume?.template}</Badge>
              <span className="text-[10px] text-[var(--text-muted)]">
                {filledSections}/{sections.length} sections filled
              </span>
              {requiredSections.length > 0 && (
                <span className="text-[10px] text-[var(--text-muted)]">
                  • {filledRequired}/{requiredSections.length} required
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => { setIsPublic(!isPublic); setHasChanges(true) }}
          >
            {isPublic ? <Globe size={12} /> : <GlobeLock size={12} />}
            {isPublic ? "Public" : "Private"}
          </Button>
          <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </Button>
        </div>
      </div>

      {requiredSections.length > 0 && filledRequired < requiredSections.length && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 dark:bg-amber-950/20 dark:border-amber-800 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            {filledRequired}/{requiredSections.length} required sections completed.
            Fill all required sections before sharing your resume.
          </span>
        </div>
      )}

      <div className="space-y-3">
        {sections.map((section) => (
          <ResumeSectionRenderer
            key={section.id || section.section_key}
            section={section}
            value={data[section.section_key]}
            onChange={(value) => updateSection(section.section_key, value)}
          />
        ))}
      </div>

      <div className="flex justify-end pt-2">
        <Button size="sm" className="gap-1.5 text-xs" onClick={handleSave} disabled={saving || !hasChanges}>
          {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}

function MyResumesList({ resumes, loading, onEdit, onDelete, onNew }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    )
  }

  if (!resumes || resumes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
        <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">No resumes yet</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Create your first resume to get started</p>
        <Button size="sm" className="mt-4 gap-2" onClick={onNew}>
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
          className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4 transition-colors hover:border-[var(--bg-primary)]/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-primary)]/10">
            <FileText size={18} className="text-[var(--bg-primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{resume.title}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="pending" className="text-[10px] capitalize">{resume.template || "simple"}</Badge>
              <span className="text-[10px] text-[var(--text-muted)]">
                {resume.is_public ? "Public" : "Private"}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                • Updated {new Date(resume.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5" onClick={() => onEdit(resume)}>
              <Pencil size={12} /> Edit
            </Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => onDelete(resume)}>
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

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
    setLoading(true)
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
    fetchData()
  }, [fetchData])

  const handleNewResume = () => {
    setView("gallery")
  }

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
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const getPublicTemplateWithSections = async (slug) => {
    return await getPublicTemplateDetail(slug)
  }

  const handleEditResume = async (resume) => {
    setSaving(true)
    try {
      const detail = await getPublicTemplateWithSections(resume.template)
      const fullResume = await getMyResumeDetail(resume.id)
      setEditingResume(fullResume)
      setEditingTemplate(detail.template)
      setEditingSections(detail.sections || [])
      setView("editor")
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveResume = async ({ title, data, isPublic }) => {
    if (!editingResume) return
    setSaving(true)
    try {
      await updateMyResume(editingResume.id, { title, data, isPublic })
      const updated = await getMyResumeDetail(editingResume.id)
      setEditingResume(updated)
    } catch (err) {
      setError(err.message)
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
    } catch (err) {
      setError(err.message)
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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl flex items-center gap-2">
            <FileText size={24} />
            Resume Builder
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {view === "list" && "Manage your resumes"}
            {view === "gallery" && "Choose a template to get started"}
            {view === "editor" && "Fill in your resume sections"}
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
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0">
            <X size={14} />
          </button>
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Sparkles size={14} />
            <span>Choose a template for your new resume</span>
          </div>
          <TemplateGallery
            templates={templates}
            onSelect={handleSelectTemplate}
            onPreview={handlePreviewTemplate}
          />
        </div>
      )}

      {view === "editor" && (
        <ResumeEditor
          resume={editingResume}
          template={editingTemplate}
          sections={editingSections}
          onBack={() => { setView("list"); setEditingResume(null); fetchData() }}
          onSave={handleSaveResume}
          saving={saving}
        />
      )}

      <TemplatePreviewModal
        template={previewTemplate}
        sections={previewSections}
        open={previewOpen}
        onClose={() => { setPreviewOpen(false); setPreviewTemplate(null) }}
        onUse={handleSelectTemplate}
      />

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
            <Button onClick={handleDeleteResume} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2">
              {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
