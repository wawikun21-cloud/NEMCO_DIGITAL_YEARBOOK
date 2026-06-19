import { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Search,
  RefreshCw,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Globe,
  GlobeLock,
  Calendar,
  Clock,
  AlertTriangle,
  X,
  Plus,
  Settings,
  Layers,
  Layout,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Star,
  StarOff,
  Copy,
  Image,
  ChevronDown,
  ChevronUp,
  Briefcase,
  GraduationCap,
  Award,
  Users,
  List,
  Type,
  AlignLeft,
  CalendarRange,
  Link,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { getResumes, getResumeDetail, updateResume, deleteResume, getResumeStats } from "@/services/resumeService"
import {
  getTemplates,
  getTemplateDetail,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  addTemplateSection,
  updateTemplateSection,
  deleteTemplateSection,
} from "@/services/resumeTemplateService"

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "list", label: "Bullet List" },
  { value: "date_range", label: "Date Range" },
  { value: "education", label: "Education Entry" },
  { value: "experience", label: "Work Experience Entry" },
  { value: "skills", label: "Skills Tags" },
  { value: "achievements", label: "Achievements" },
  { value: "references", label: "References" },
]

const FIELD_TYPE_ICONS = {
  text: Type,
  textarea: AlignLeft,
  list: List,
  date_range: CalendarRange,
  education: GraduationCap,
  experience: Briefcase,
  skills: Award,
  achievements: Star,
  references: Users,
}

function formatFieldValue(value) {
  if (value === null || value === undefined || value === "") return null
  if (Array.isArray(value)) {
    if (value.length === 0) return null
    return (
      <ul className="mt-1 space-y-1">
        {value.map((item, i) => {
          if (typeof item === "object" && item !== null) {
            return (
              <li key={i} className="text-xs text-[var(--text-secondary)] rounded bg-[var(--bg-subtle)] p-2 space-y-0.5">
                {Object.entries(item).map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium text-[var(--text-primary)] capitalize">{k.replace(/_/g, " ")}: </span>
                    <span>{String(v)}</span>
                  </div>
                ))}
              </li>
            )
          }
          return (
            <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-1.5">
              <span className="mt-1.5 h-1 w-1 rounded-full bg-[var(--text-muted)] shrink-0" />
              <span>{String(item)}</span>
            </li>
          )
        })}
      </ul>
    )
  }
  if (typeof value === "object" && value !== null) {
    return (
      <div className="mt-1 space-y-0.5 rounded bg-[var(--bg-subtle)] p-2">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="font-medium text-[var(--text-primary)] capitalize">{k.replace(/_/g, " ")}: </span>
            <span className="text-[var(--text-secondary)]">{String(v)}</span>
          </div>
        ))}
      </div>
    )
  }
  if (typeof value === "string" && (value.startsWith("http://") || value.startsWith("https://"))) {
    return <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--bg-primary)] hover:underline break-all">{value}</a>
  }
  return <p className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">{String(value)}</p>
}

function StructuredDataPreview({ data, sections }) {
  const [expandedSections, setExpandedSections] = useState({})

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-light)] p-6 text-center">
        <FileText size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
        <p className="text-xs text-[var(--text-muted)]">No data has been entered yet</p>
      </div>
    )
  }

  const toggleSection = (key) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const sectionMap = {}
  if (sections && sections.length > 0) {
    for (const s of sections) {
      sectionMap[s.section_key] = s
    }
  }

  const entries = Object.entries(data)
  const orderedEntries = []
  if (sections && sections.length > 0) {
    for (const s of sections) {
      if (data[s.section_key] !== undefined) {
        orderedEntries.push([s.section_key, data[s.section_key], s])
      }
    }
    for (const [key, value] of entries) {
      if (!sectionMap[key]) {
        orderedEntries.push([key, value, null])
      }
    }
  } else {
    for (const [key, value] of entries) {
      orderedEntries.push([key, value, null])
    }
  }

  return (
    <div className="space-y-2">
      {orderedEntries.map(([key, value, section]) => {
        const fieldType = section?.field_type || "text"
        const label = section?.label || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        const Icon = FIELD_TYPE_ICONS[fieldType] || FileText
        const formatted = formatFieldValue(value, fieldType)
        const isExpanded = expandedSections[key] !== false

        return (
          <div key={key} className="rounded-lg border border-[var(--border-light)] overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(key)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--bg-subtle)]/50 transition-colors"
            >
              <Icon size={14} className="shrink-0 text-[var(--text-muted)]" />
              <span className="text-xs font-semibold text-[var(--text-primary)] flex-1">{label}</span>
              {section?.is_required && (
                <span className="text-[9px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">Required</span>
              )}
              {formatted ? (
                isExpanded ? <ChevronUp size={12} className="text-[var(--text-muted)]" /> : <ChevronDown size={12} className="text-[var(--text-muted)]" />
              ) : (
                <span className="text-[10px] text-[var(--text-muted)] italic">Empty</span>
              )}
            </button>
            {formatted && isExpanded && (
              <div className="border-t border-[var(--border-light)] px-3 py-2 bg-[var(--bg-subtle)]/30">
                {formatted}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

function ResumeDetailSheet({ resumeId, open, onClose, onUpdate, templates }) {
  const [detail, setDetail] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && resumeId) {
      setLoading(true)
      getResumeDetail(resumeId)
        .then(async (resume) => {
          setDetail(resume)
          if (resume.template) {
            const tmpl = templates?.find((t) => t.slug === resume.template)
            if (tmpl) {
              try {
                const detail = await getTemplateDetail(tmpl.id)
                setSections(detail.sections || [])
              } catch {
                setSections([])
              }
            }
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [open, resumeId, templates])

  const handleToggleVisibility = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const updated = await updateResume(detail.id, { isPublic: !detail.is_public })
      setDetail({ ...detail, is_public: updated.is_public })
      onUpdate?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleChangeTemplate = async (templateSlug) => {
    if (!detail) return
    setSaving(true)
    try {
      const updated = await updateResume(detail.id, { template: templateSlug })
      setDetail({ ...detail, template: updated.template })
      onUpdate?.()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!resumeId) return null

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="border-b border-[var(--border-light)] pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <FileText size={18} />
            {loading ? "Loading..." : detail?.title || "Resume"}
          </SheetTitle>
          <SheetDescription>{detail ? formatDateTime(detail.created_at) : ""}</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : detail ? (
          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-sm font-bold text-[var(--bg-primary)]">
                {detail.user?.display_name?.charAt(0) || detail.user?.full_name?.charAt(0) || "?"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {detail.user?.display_name || detail.user?.full_name || "Unknown"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {detail.user?.email || ""}
                  {detail.user?.student_number ? ` • ${detail.user.student_number}` : ""}
                </p>
                {detail.user?.course_or_strand && (
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {detail.user.course_or_strand} {detail.user.year_level ? `• ${detail.user.year_level}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Template</h4>
                {templates && templates.length > 0 ? (
                  <Select value={detail.template || "simple"} onValueChange={handleChangeTemplate}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="pending" className="capitalize">{detail.template || "simple"}</Badge>
                )}
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Visibility</h4>
                <Badge variant={detail.is_public ? "active" : "inactive"} className="gap-1">
                  {detail.is_public ? <Globe size={11} /> : <GlobeLock size={11} />}
                  {detail.is_public ? "Public" : "Private"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Created</h4>
                <p className="text-sm text-[var(--text-secondary)]">{formatDateTime(detail.created_at)}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Last Updated</h4>
                <p className="text-sm text-[var(--text-secondary)]">{formatDateTime(detail.updated_at)}</p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Resume Content</h4>
              <StructuredDataPreview data={detail.data} sections={sections} />
            </div>

            <div className="flex gap-2">
              <Button
                variant={detail.is_public ? "outline" : "default"}
                size="sm"
                onClick={handleToggleVisibility}
                disabled={saving}
                className="gap-2"
              >
                {detail.is_public ? <GlobeLock size={14} /> : <Globe size={14} />}
                {detail.is_public ? "Make Private" : "Make Public"}
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

function TemplateManager({ templates, onRefresh }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: "", slug: "", description: "", thumbnail_url: "", is_active: true })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [duplicatingId, setDuplicatingId] = useState(null)

  const openCreate = () => {
    setForm({ name: "", slug: "", description: "", thumbnail_url: "", is_active: true })
    setEditingId(null)
    setShowCreate(true)
  }

  const openEdit = (template) => {
    setForm({
      name: template.name,
      slug: template.slug,
      description: template.description || "",
      thumbnail_url: template.thumbnail_url || "",
      is_active: template.is_active,
    })
    setEditingId(template.id)
    setShowCreate(true)
  }

  const handleNameChange = (name) => {
    setForm({
      ...form,
      name,
      slug: editingId ? form.slug : generateSlug(name),
    })
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        await updateTemplate(editingId, form)
      } else {
        await createTemplate(form)
      }
      setShowCreate(false)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTemplate(id)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDuplicate = async (template) => {
    setDuplicatingId(template.id)
    try {
      await createTemplate({
        name: `${template.name} (Copy)`,
        slug: `${template.slug}-copy-${Date.now()}`,
        description: template.description,
        thumbnail_url: template.thumbnail_url,
        default_sections: template.default_sections,
        is_active: true,
      })
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDuplicatingId(null)
    }
  }

  const handleToggleActive = async (template) => {
    try {
      await updateTemplate(template.id, { is_active: !template.is_active })
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetDefault = async (template) => {
    try {
      await updateTemplate(template.id, { is_default: true })
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Layout size={16} />
            Resume Templates
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {templates.length} template{templates.length !== 1 ? "s" : ""} — create and manage resume layouts
          </p>
        </div>
        <Button size="sm" onClick={openCreate} className="gap-2">
          <Plus size={14} />
          New Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
          <Layout size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No templates yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Create your first resume template to get started</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`rounded-lg border p-4 transition-colors ${
                template.is_active
                  ? "border-[var(--border-light)] bg-[var(--bg-surface)]"
                  : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{template.name}</h4>
                    {template.is_default && (
                      <Badge variant="approved" className="text-[10px] shrink-0 gap-1">
                        <Star size={9} /> Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{template.slug}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] transition-colors"
                    title={template.is_active ? "Deactivate" : "Activate"}
                  >
                    {template.is_active ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                  </button>
                </div>
              </div>

              {template.thumbnail_url && (
                <div className="mt-2 rounded-md overflow-hidden border border-[var(--border-light)] bg-[var(--bg-subtle)]">
                  <img src={template.thumbnail_url} alt={template.name} className="w-full h-24 object-cover" />
                </div>
              )}

              {template.description && (
                <p className="mt-2 text-xs text-[var(--text-muted)] line-clamp-2">{template.description}</p>
              )}

              <div className="mt-3 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                <span>{Array.isArray(template.default_sections) ? template.default_sections.length : 0} sections</span>
                <span>•</span>
                <span>Updated {formatRelativeTime(template.updated_at)}</span>
              </div>

              <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--border-light)] pt-3">
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => openEdit(template)}>
                  <Settings size={12} /> Edit
                </Button>
                {!template.is_default && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleSetDefault(template)} title="Set as default">
                    <StarOff size={12} />
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleDuplicate(template)} disabled={duplicatingId === template.id}>
                  {duplicatingId === template.id ? <RefreshCw size={12} className="animate-spin" /> : <Copy size={12} />}
                </Button>
                {!template.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 ml-auto"
                    onClick={() => handleDelete(template.id)}
                    disabled={deletingId === template.id}
                  >
                    {deletingId === template.id ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={() => setShowCreate(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the template details below." : "Define a new resume template with a name and slug."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Template Name *</label>
              <Input
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Modern Professional"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Slug *</label>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: generateSlug(e.target.value) })}
                placeholder="e.g., modern-professional"
                className="h-9 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of this template"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Thumbnail URL</label>
              <div className="relative">
                <Image size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  value={form.thumbnail_url}
                  onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                  placeholder="https://example.com/thumbnail.png"
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Image shown on template card and student gallery</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                form.is_active
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                  : "border-[var(--border-light)] bg-[var(--bg-subtle)]"
              }`}
            >
              {form.is_active ? (
                <ToggleRight size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <ToggleLeft size={20} className="text-[var(--text-muted)] shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Active</p>
                <p className="text-[10px] text-[var(--text-muted)]">{form.is_active ? "Available for students to use" : "Hidden from students"}</p>
              </div>
            </button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.slug.trim()} className="gap-2">
              {saving && <RefreshCw size={14} className="animate-spin" />}
              {editingId ? "Save Changes" : "Create Template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              Delete Template
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? Resumes using it will fall back to the default template.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)} disabled={!!deletingId}>Cancel</Button>
            <Button
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={!deletingId}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SectionBuilder({ template, onRefresh }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({
    section_key: "", label: "", description: "", icon: "", field_type: "text", is_required: false, config: "{}",
  })
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (template?.id) {
      setLoading(true)
      getTemplateDetail(template.id)
        .then((data) => setSections(data.sections || []))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [template?.id])

  const openAdd = () => {
    setForm({ section_key: "", label: "", description: "", icon: "", field_type: "text", is_required: false, config: "{}" })
    setEditingId(null)
    setShowAdd(true)
  }

  const openEdit = (section) => {
    setForm({
      section_key: section.section_key,
      label: section.label,
      description: section.description || "",
      icon: section.icon || "",
      field_type: section.field_type,
      is_required: section.is_required,
      config: JSON.stringify(section.config || {}, null, 2),
    })
    setEditingId(section.id)
    setShowAdd(true)
  }

  const handleLabelChange = (label) => {
    setForm({
      ...form,
      label,
      section_key: editingId ? form.section_key : generateSlug(label),
    })
  }

  const handleSave = async () => {
    if (!form.label.trim() || !form.section_key.trim()) return
    setSaving(true)
    try {
      let parsedConfig = {}
      try {
        parsedConfig = JSON.parse(form.config || "{}")
      } catch {
        parsedConfig = {}
      }
      const payload = { ...form, config: parsedConfig }
      if (editingId) {
        await updateTemplateSection(editingId, payload)
      } else {
        await addTemplateSection(template.id, payload)
      }
      setShowAdd(false)
      const data = await getTemplateDetail(template.id)
      setSections(data.sections || [])
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteTemplateSection(id)
      const data = await getTemplateDetail(template.id)
      setSections(data.sections || [])
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  if (!template) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
        <Layers size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Select a template</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Choose a template from the Templates tab to manage its sections</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Layers size={16} />
            Sections &mdash; {template.name}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {sections.length} section{sections.length !== 1 ? "s" : ""} — define the fields students fill in
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-2">
          <Plus size={14} />
          Add Section
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
          <Layers size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No sections yet</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Add sections to define what students fill in</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-3"
            >
              <GripVertical size={16} className="text-[var(--text-muted)] shrink-0 cursor-grab" />

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--bg-primary)]/10 text-xs font-bold text-[var(--bg-primary)]">
                {index + 1}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">{section.label}</p>
                  {section.is_required && (
                    <Badge variant="rejected" className="text-[10px]">Required</Badge>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] font-mono">
                  {section.section_key} • {FIELD_TYPES.find((f) => f.value === section.field_type)?.label || section.field_type}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => openEdit(section)}>
                  <Settings size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  onClick={() => handleDelete(section.id)}
                  disabled={deletingId === section.id}
                >
                  {deletingId === section.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={() => setShowAdd(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Section" : "Add Section"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the section details." : "Define a new section for this resume template."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Label *</label>
              <Input
                value={form.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Work Experience"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Key *</label>
              <Input
                value={form.section_key}
                onChange={(e) => setForm({ ...form, section_key: generateSlug(e.target.value) })}
                placeholder="e.g., work-experience"
                className="h-9 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Description</label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Helper text for students"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Icon (Lucide name)</label>
              <div className="relative">
                <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="e.g., Briefcase, GraduationCap"
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Field Type *</label>
              <Select value={form.field_type} onValueChange={(v) => setForm({ ...form, field_type: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Section Config (JSON)</label>
              <textarea
                value={form.config}
                onChange={(e) => setForm({ ...form, config: e.target.value })}
                placeholder='{"maxItems": 5, "placeholder": "Enter value..."}'
                className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-subtle)] px-3 py-2 text-xs font-mono text-[var(--text-secondary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] min-h-[60px] resize-y"
              />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Optional JSON config for section-specific settings</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, is_required: !form.is_required })}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                form.is_required
                  ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                  : "border-[var(--border-light)] bg-[var(--bg-subtle)]"
              }`}
            >
              {form.is_required ? (
                <ToggleRight size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
              ) : (
                <ToggleLeft size={20} className="text-[var(--text-muted)] shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Required Section</p>
                <p className="text-[10px] text-[var(--text-muted)]">{form.is_required ? "Students must fill this section" : "Optional for students"}</p>
              </div>
            </button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.label.trim() || !form.section_key.trim()} className="gap-2">
              {saving && <RefreshCw size={14} className="animate-spin" />}
              {editingId ? "Save Changes" : "Add Section"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              Delete Section
            </DialogTitle>
            <DialogDescription>Remove this section from the template? Existing resume data for this section will be preserved but hidden.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button
              onClick={() => deletingId && handleDelete(deletingId)}
              disabled={!deletingId}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              <Trash2 size={14} /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResumeList({ templates }) {
  const [resumes, setResumes] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState(null)

  const [search, setSearch] = useState("")
  const [templateFilter, setTemplateFilter] = useState("")
  const [visibilityFilter, setVisibilityFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [selectedResumeId, setSelectedResumeId] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const totalPages = Math.ceil(total / perPage)

  const fetchResumes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getResumes({
        page, perPage,
        template: templateFilter || undefined,
        isPublic: visibilityFilter === "public" ? true : visibilityFilter === "private" ? false : undefined,
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setResumes(result.resumes)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, templateFilter, visibilityFilter, search, dateFrom, dateTo])

  const fetchStats = useCallback(async () => {
    try {
      const result = await getResumeStats()
      setStats(result)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => { fetchResumes() }, [fetchResumes])
  useEffect(() => { fetchStats() }, [fetchStats])

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchResumes() }
  const handleResetFilters = () => { setSearch(""); setTemplateFilter(""); setVisibilityFilter(""); setDateFrom(""); setDateTo(""); setPage(1) }
  const handleRowClick = (resume) => { setSelectedResumeId(resume.id); setDetailOpen(true) }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await deleteResume(deleteConfirm.id)
      setDeleteConfirm(null)
      fetchResumes()
      fetchStats()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const hasFilters = templateFilter || visibilityFilter || dateFrom || dateTo

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={16} />
            Student Resumes
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {total.toLocaleString()} total resume{total !== 1 ? "s" : ""} — view and manage all student resumes
          </p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">Total</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">Public</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.public}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">Private</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.private}</p>
          </div>
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
            <p className="text-xs font-medium text-[var(--text-muted)]">This Month</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.thisMonth}</p>
          </div>
        </div>
      )}

      {stats && stats.byTemplate && Object.keys(stats.byTemplate).length > 0 && (
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-3">By Template</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.byTemplate).map(([tmpl, count]) => (
              <div key={tmpl} className="flex items-center gap-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-subtle)] px-3 py-1.5">
                <span className="text-xs font-medium text-[var(--text-primary)] capitalize">{tmpl}</span>
                <span className="text-xs font-bold text-[var(--bg-primary)]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input type="text" placeholder="Search by name, email, student #…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
              </div>
              <Button type="submit" size="sm" className="h-9">Search</Button>
            </form>
            <div className="flex gap-2">
              <Select value={templateFilter} onValueChange={(v) => { setTemplateFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="All templates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All templates</SelectItem>
                  {templates.map((t) => (
                    <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={visibilityFilter} onValueChange={(v) => { setVisibilityFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-[130px]">
                  <SelectValue placeholder="All visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All visibility</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--text-muted)]" />
              <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="h-9 w-[150px]" />
              <span className="text-xs text-[var(--text-muted)]">to</span>
              <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="h-9 w-[150px]" />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1 text-xs h-8">
                <X size={12} /> Clear filters
              </Button>
            )}
            <span className="text-xs text-[var(--text-muted)] ml-auto">
              Showing {resumes.length > 0 ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, total)} of {total}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-[var(--status-red)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="px-4 py-3 whitespace-nowrap">Student</th>
                <th className="px-4 py-3 whitespace-nowrap">Title</th>
                <th className="hidden px-4 py-3 whitespace-nowrap sm:table-cell">Template</th>
                <th className="px-4 py-3 whitespace-nowrap">Visibility</th>
                <th className="hidden px-4 py-3 whitespace-nowrap md:table-cell">Updated</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="hidden px-4 py-3 sm:table-cell"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : resumes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">No resumes found</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {hasFilters ? "Try adjusting your filters" : "Resumes will appear here as students create them"}
                    </p>
                  </td>
                </tr>
              ) : (
                resumes.map((resume) => {
                  const userName = resume.user?.display_name || resume.user?.full_name || resume.user?.email || "Unknown"
                  return (
                    <tr key={resume.id} className="transition-colors hover:bg-[var(--bg-subtle)]/50 cursor-pointer" onClick={() => handleRowClick(resume)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-[10px] font-bold text-[var(--bg-primary)]">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)] max-w-[160px]" title={userName}>{userName}</p>
                            {resume.user?.student_number && <p className="truncate text-[10px] text-[var(--text-muted)]">{resume.user.student_number}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-sm text-[var(--text-secondary)] truncate block max-w-[180px]">{resume.title}</span></td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <Badge variant="pending" className="capitalize">{resume.template || "simple"}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={resume.is_public ? "active" : "inactive"} className="gap-1">
                          {resume.is_public ? <Globe size={11} /> : <GlobeLock size={11} />}
                          {resume.is_public ? "Public" : "Private"}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Clock size={12} className="shrink-0 text-[var(--text-muted)]" />
                          <span className="text-xs">{formatRelativeTime(resume.updated_at)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7" onClick={() => handleRowClick(resume)}>
                            <Eye size={14} />
                          </Button>
                          <Button variant="ghost" size="icon-sm" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40" onClick={() => setDeleteConfirm(resume)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-light)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon-sm" className="h-8 w-8" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) pageNum = i + 1
                else if (page <= 3) pageNum = i + 1
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i
                else pageNum = page - 2 + i
                return (
                  <Button key={pageNum} variant={pageNum === page ? "default" : "outline"} size="sm" className="h-8 w-8 text-xs" onClick={() => setPage(pageNum)}>
                    {pageNum}
                  </Button>
                )
              })}
              <Button variant="outline" size="icon-sm" className="h-8 w-8" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ResumeDetailSheet
        resumeId={selectedResumeId}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedResumeId(null) }}
        onUpdate={() => { fetchResumes(); fetchStats() }}
        templates={templates}
      />

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 size={18} className="text-red-500" />
              Delete Resume
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirm?.title}&rdquo; by {deleteConfirm?.user?.display_name || deleteConfirm?.user?.full_name || "this student"}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={deleting}>Cancel</Button>
            <Button variant="default" onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white gap-2">
              {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function ResumeManagementPage() {
  const [activeTab, setActiveTab] = useState("templates")
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchTemplates = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getTemplates({ includeInactive: true })
      setTemplates(result || [])
      if (result && result.length > 0 && !selectedTemplateId) {
        setSelectedTemplateId(result[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [selectedTemplateId])

  useEffect(() => { fetchTemplates() }, [fetchTemplates])

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const tabs = [
    { key: "templates", label: "Templates", icon: Layout },
    { key: "sections", label: "Sections", icon: Layers },
    { key: "resumes", label: "Resumes", icon: FileText },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Resume Management
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage templates, sections, and student resumes
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={fetchTemplates} className="gap-2" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-1">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === key
                ? "bg-[var(--bg-primary)] text-white shadow-sm"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {activeTab === "sections" && templates.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Editing sections for:</span>
          <Select value={selectedTemplateId || ""} onValueChange={setSelectedTemplateId}>
            <SelectTrigger className="h-8 w-[200px]">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} {!t.is_active ? "(Inactive)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
          {activeTab === "templates" && (
            <TemplateManager templates={templates} onRefresh={fetchTemplates} />
          )}
          {activeTab === "sections" && (
            <SectionBuilder template={selectedTemplate} onRefresh={fetchTemplates} />
          )}
          {activeTab === "resumes" && (
            <ResumeList templates={templates} />
          )}
        </div>
      )}

      <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-muted)] sm:flex-row">
          <span>&copy; {new Date().getFullYear()} NEMCO Digital Yearbook. All rights reserved.</span>
          <nav className="flex gap-4">
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Terms of Use</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
