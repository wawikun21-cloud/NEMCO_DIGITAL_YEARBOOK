import { useState, useEffect, useCallback } from "react"
import {
  BookMarked,
  Settings,
  Users,
  Layers,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  GripVertical,
  AlertTriangle,
  Save,
  ToggleLeft,
  ToggleRight,
  FileText,
  Upload,
  Sparkles,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
import {
  getFlipbookSettings,
  updateFlipbookSettings,
  getFlipbookProfiles,
  getApprovedProfiles,
  addProfileToFlipbook,
  updateFlipbookProfile,
  removeProfileFromFlipbook,
  getFlipbookSections,
  addFlipbookSection,
  removeFlipbookSection,
  getPdfPages,
  addPdfPage,
  updatePdfPage,
  removePdfPage,
  uploadPdfFile,
} from "@/services/flipbookService"
import PdfUploader from "@/components/admin/PdfUploader"
import Yearbook3DPage from "@/pages/student/Yearbook3DPage"

function SettingsPanel({ settings, onUpdate }) {
  const [form, setForm] = useState(settings || {})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) setForm(settings)
  }, [settings])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(form)
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = JSON.stringify(form) !== JSON.stringify(settings)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Settings size={16} />
            Flipbook Settings
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Configure the 3D yearbook appearance and behavior</p>
        </div>
        {hasChanges && (
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Save Changes
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Book Title</label>
          <Input
            value={form.title || ""}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="NEMCO Digital Yearbook"
            className="h-9"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Subtitle</label>
          <Input
            value={form.subtitle || ""}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="Academic Year 2025-2026"
            className="h-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Content Source</label>
          <Select value={form.source_type || "profiles"} onValueChange={(v) => setForm({ ...form, source_type: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="profiles">Student Profiles</SelectItem>
              <SelectItem value="pdfs">PDF Pages</SelectItem>
              <SelectItem value="combined">Combined (Profiles + PDFs)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {form.source_type === "pdfs"
              ? "Only PDF pages will be shown in the flipbook"
              : form.source_type === "combined"
              ? "Both student profiles and PDF pages will be included"
              : "Only student profiles will be shown in the flipbook"}
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Theme</label>
          <Select value={form.theme || "default"} onValueChange={(v) => setForm({ ...form, theme: v })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="classic">Classic</SelectItem>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="elegant">Elegant</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Flip Speed</label>
          <Select value={String(form.flip_speed || 0.5)} onValueChange={(v) => setForm({ ...form, flip_speed: parseFloat(v) })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.3">Fast (0.3s)</SelectItem>
              <SelectItem value="0.5">Normal (0.5s)</SelectItem>
              <SelectItem value="0.8">Slow (0.8s)</SelectItem>
              <SelectItem value="1.0">Very Slow (1.0s)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="text-xs font-medium text-[var(--text-secondary)] block">Toggles</label>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, enabled: !form.enabled })}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              form.enabled
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                : "border-[var(--border-light)] bg-[var(--bg-subtle)]"
            }`}
          >
            {form.enabled ? (
              <ToggleRight size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ToggleLeft size={20} className="text-[var(--text-muted)] shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Public Access</p>
              <p className="text-[10px] text-[var(--text-muted)]">{form.enabled ? "Flipbook is live" : "Flipbook is hidden"}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setForm({ ...form, show_page_numbers: !form.show_page_numbers })}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              form.show_page_numbers
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                : "border-[var(--border-light)] bg-[var(--bg-subtle)]"
            }`}
          >
            {form.show_page_numbers ? (
              <ToggleRight size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ToggleLeft size={20} className="text-[var(--text-muted)] shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Page Numbers</p>
              <p className="text-[10px] text-[var(--text-muted)]">{form.show_page_numbers ? "Shown" : "Hidden"}</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setForm({ ...form, auto_flip: !form.auto_flip })}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              form.auto_flip
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                : "border-[var(--border-light)] bg-[var(--bg-subtle)]"
            }`}
          >
            {form.auto_flip ? (
              <ToggleRight size={20} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ToggleLeft size={20} className="text-[var(--text-muted)] shrink-0" />
            )}
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Auto Flip</p>
              <p className="text-[10px] text-[var(--text-muted)]">{form.auto_flip ? "Enabled" : "Disabled"}</p>
            </div>
          </button>
        </div>
      </div>

      {form.auto_flip && (
        <div>
          <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Auto Flip Interval (seconds)</label>
          <Input
            type="number"
            min={3}
            max={60}
            value={form.auto_flip_interval || 10}
            onChange={(e) => setForm({ ...form, auto_flip_interval: parseInt(e.target.value) || 10 })}
            className="h-9 w-[150px]"
          />
        </div>
      )}
    </div>
  )
}

function SectionsPanel({ sections, onRefresh }) {
  const [newSection, setNewSection] = useState("")
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const handleAdd = async () => {
    if (!newSection.trim()) return
    setAdding(true)
    try {
      await addFlipbookSection(newSection.trim())
      setNewSection("")
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await removeFlipbookSection(id)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Layers size={16} />
          Sections
        </h3>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Organize flipbook pages into sections by course, year level, etc.</p>
      </div>

      <div className="flex gap-2">
        <Input
          value={newSection}
          onChange={(e) => setNewSection(e.target.value)}
          placeholder="e.g., BSIT Students, BSBA Students…"
          className="h-9 flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
        />
        <Button size="sm" onClick={handleAdd} disabled={adding || !newSection.trim()} className="h-9 gap-2">
          <Plus size={14} />
          Add
        </Button>
      </div>

      {sections.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-light)] p-6 text-center">
          <Layers size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-secondary)]">No sections yet</p>
          <p className="text-xs text-[var(--text-muted)]">Add sections to organize your flipbook pages</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <Badge variant="pending">#{section.sort_order}</Badge>
                <span className="text-sm font-medium text-[var(--text-primary)]">{section.name}</span>
              </div>
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
          ))}
        </div>
      )}
    </div>
  )
}

function PdfPagesPanel({ pdfPages, onRefresh }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [editingPage, setEditingPage] = useState(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  const handleUpload = async ({ file, title, description, onProgress }) => {
    setUploading(true)
    try {
      const uploadResult = await uploadPdfFile(file, onProgress)

      await addPdfPage({
        title,
        description,
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName,
        fileSize: uploadResult.fileSize,
        pageCount: uploadResult.pageCount || 1,
        filePath: uploadResult.filePath,
      })

      setShowUploadDialog(false)
      onRefresh()
    } catch (err) {
      console.error(err)
      throw err
    } finally {
      setUploading(false)
    }
  }

  const handleToggleActive = async (page) => {
    try {
      await updatePdfPage(page.id, { isActive: !page.is_active })
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await removePdfPage(id)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (page) => {
    setEditingPage(page)
    setEditTitle(page.title)
    setEditDescription(page.description || "")
  }

  const handleSaveEdit = async () => {
    try {
      await updatePdfPage(editingPage.id, {
        title: editTitle,
        description: editDescription,
      })
      setEditingPage(null)
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={16} />
            PDF Flipbook Pages
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {pdfPages.length} PDF(s) uploaded — manage your flipbook PDF pages
          </p>
        </div>
        <Button size="sm" onClick={() => setShowUploadDialog(true)} className="gap-2">
          <Upload size={14} />
          Upload PDF
        </Button>
      </div>

      {pdfPages.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No PDFs uploaded</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Upload PDF files to create a flipbook from them
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pdfPages.map((page, index) => (
            <div
              key={page.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                page.is_active
                  ? "border-[var(--border-light)] bg-[var(--bg-surface)]"
                  : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                <FileText size={20} className="text-red-600 dark:text-red-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {page.title}
                </p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">
                  {page.file_name} • {formatFileSize(page.file_size)} • {page.page_count || 1} page{(page.page_count || 1) !== 1 ? "s" : ""}
                </p>
              </div>

              <Badge variant="inactive" className="text-[10px]">
                #{page.sort_order || index + 1}
              </Badge>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => window.open(page.file_url, "_blank")}
                  title="Preview PDF"
                >
                  <Eye size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => handleToggleActive(page)}
                  title={page.is_active ? "Deactivate" : "Activate"}
                >
                  {page.is_active ? (
                    <Eye size={14} />
                  ) : (
                    <EyeOff size={14} className="text-amber-500" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => handleEdit(page)}
                  title="Edit"
                >
                  <Settings size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  onClick={() => handleDelete(page.id)}
                  disabled={deletingId === page.id}
                >
                  {deletingId === page.id ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={(open) => !uploading && setShowUploadDialog(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload PDF</DialogTitle>
            <DialogDescription>
              Upload a PDF file to add it as a flipbook page
            </DialogDescription>
          </DialogHeader>
          <PdfUploader
            onUploadSuccess={handleUpload}
            onCancel={() => !uploading && setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingPage} onOpenChange={() => setEditingPage(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit PDF Page</DialogTitle>
            <DialogDescription>
              Update the title and description for this PDF page
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                Title
              </label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Enter title"
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
                Description
              </label>
              <Input
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter description"
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContentPanel({ profiles, sections, approvedProfiles, onRefresh }) {
  const [search, setSearch] = useState("")
  const [sectionFilter, setSectionFilter] = useState("")
  const [addingProfileId, setAddingProfileId] = useState(null)
  const [removingId, setRemovingId] = useState(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addSearch, setAddSearch] = useState("")

  const handleToggleInclude = async (profile) => {
    try {
      await updateFlipbookProfile(profile.id, { isIncluded: !profile.is_included })
      onRefresh()
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemove = async (id) => {
    setRemovingId(id)
    try {
      await removeProfileFromFlipbook(id)
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingId(null)
    }
  }

  const handleAddProfile = async (profileId) => {
    setAddingProfileId(profileId)
    try {
      await addProfileToFlipbook(profileId, { sectionName: sectionFilter || null })
      onRefresh()
    } catch (err) {
      console.error(err)
    } finally {
      setAddingProfileId(null)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    onRefresh()
  }

  const handleSectionChange = (v) => {
    setSectionFilter(v)
  }

  const notAddedProfiles = approvedProfiles.filter(
    (p) => !profiles.some((fp) => fp.profile_id === p.id)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Users size={16} />
            Content Management
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {profiles.length} profiles in flipbook — manage page order and visibility
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus size={14} />
          Add Profile
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              type="text"
              placeholder="Search profiles in flipbook…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <Button type="submit" size="sm" className="h-9">Search</Button>
        </form>

        <Select value={sectionFilter} onValueChange={handleSectionChange}>
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All sections" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sections</SelectItem>
            {sections.map((s) => (
              <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {profiles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
          <BookMarked size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No profiles in flipbook</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Add approved student profiles to build your flipbook</p>
        </div>
      ) : (
        <div className="space-y-2">
          {profiles.map((fp, index) => (
            <div
              key={fp.id}
              className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
                fp.is_included
                  ? "border-[var(--border-light)] bg-[var(--bg-surface)]"
                  : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
              }`}
            >
              <GripVertical size={16} className="text-[var(--text-muted)] shrink-0 cursor-grab" />

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-xs font-bold text-[var(--bg-primary)]">
                {fp.profile?.display_name?.charAt(0) || fp.profile?.full_name?.charAt(0) || "?"}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {fp.profile?.display_name || fp.profile?.full_name || "Unknown"}
                </p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">
                  {fp.profile?.student_number || ""} {fp.profile?.course_or_strand ? `• ${fp.profile.course_or_strand}` : ""}
                </p>
              </div>

              {fp.section_name && (
                <Badge variant="pending" className="hidden sm:inline-flex">{fp.section_name}</Badge>
              )}

              <Badge variant="inactive" className="text-[10px]">Page {fp.page_order || index + 1}</Badge>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => handleToggleInclude(fp)}
                  title={fp.is_included ? "Exclude from flipbook" : "Include in flipbook"}
                >
                  {fp.is_included ? <Eye size={14} /> : <EyeOff size={14} className="text-amber-500" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  onClick={() => handleRemove(fp.id)}
                  disabled={removingId === fp.id}
                >
                  {removingId === fp.id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Profile to Flipbook</DialogTitle>
            <DialogDescription>Select an approved profile to add to the flipbook</DialogDescription>
          </DialogHeader>
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              type="text"
              placeholder="Search approved profiles…"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
            {notAddedProfiles.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">All approved profiles are already in the flipbook</p>
            ) : (
              notAddedProfiles
                .filter((p) => {
                  if (!addSearch) return true
                  const s = addSearch.toLowerCase()
                  return (
                    (p.display_name || "").toLowerCase().includes(s) ||
                    (p.full_name || "").toLowerCase().includes(s) ||
                    (p.email || "").toLowerCase().includes(s) ||
                    (p.student_number || "").toLowerCase().includes(s)
                  )
                })
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--bg-subtle)]"
                    onClick={() => handleAddProfile(p.id)}
                    disabled={addingProfileId === p.id}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-[10px] font-bold text-[var(--bg-primary)]">
                      {(p.display_name || p.full_name || "?").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                        {p.display_name || p.full_name}
                      </p>
                      <p className="truncate text-[10px] text-[var(--text-muted)]">
                        {p.student_number} {p.course_or_strand ? `• ${p.course_or_strand}` : ""}
                      </p>
                    </div>
                    {addingProfileId === p.id ? (
                      <RefreshCw size={14} className="animate-spin text-[var(--text-muted)]" />
                    ) : (
                      <Plus size={14} className="text-[var(--text-muted)]" />
                    )}
                  </button>
                ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function YearbookManagementPage() {
  const [activeTab, setActiveTab] = useState("settings")
  const [settings, setSettings] = useState(null)
  const [profiles, setProfiles] = useState([])
  const [approvedProfiles, setApprovedProfiles] = useState([])
  const [sections, setSections] = useState([])
  const [pdfPages, setPdfPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [settingsRes, profilesRes, approvedRes, sectionsRes, pdfPagesRes] = await Promise.all([
        getFlipbookSettings(),
        getFlipbookProfiles({ page: 1, perPage: 100 }),
        getApprovedProfiles(),
        getFlipbookSections(),
        getPdfPages(),
      ])
      setSettings(settingsRes)
      setProfiles(profilesRes.profiles || [])
      setApprovedProfiles(approvedRes || [])
      setSections(sectionsRes || [])
      setPdfPages(pdfPagesRes || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleSettingsUpdate = async (newSettings) => {
    const updated = await updateFlipbookSettings(newSettings)
    setSettings(updated)
  }

  const tabs = [
    { key: "settings", label: "Settings", icon: Settings },
    { key: "sections", label: "Sections", icon: Layers },
    { key: "content", label: "Content", icon: Users },
    { key: "pdfs", label: "PDF Pages", icon: FileText },
    { key: "preview", label: "3D Preview", icon: Sparkles },
  ]

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            3D Yearbook Management
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Configure and manage the flipbook-style digital yearbook
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-[var(--status-red)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

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

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
          {activeTab === "settings" && (
            <SettingsPanel settings={settings} onUpdate={handleSettingsUpdate} />
          )}
          {activeTab === "sections" && (
            <SectionsPanel sections={sections} onRefresh={fetchAll} />
          )}
          {activeTab === "content" && (
            <ContentPanel
              profiles={profiles}
              sections={sections}
              approvedProfiles={approvedProfiles}
              onRefresh={fetchAll}
            />
          )}
          {activeTab === "pdfs" && (
            <PdfPagesPanel
              pdfPages={pdfPages}
              onRefresh={fetchAll}
            />
          )}
          {activeTab === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles size={16} />
                    3D Flipbook Preview
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    This is exactly what students will see when they open the yearbook
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/3d-yearbook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-primary)]/10 hover:text-[var(--bg-primary)]"
                  >
                    <ExternalLink size={13} />
                    Open Public View
                  </a>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border-light)] overflow-hidden shadow-xl bg-gradient-to-br from-amber-50 via-stone-50 to-slate-100 dark:from-[#0d1b2a] dark:via-[#112233] dark:to-[#0d1b2a]" style={{ minHeight: "600px" }}>
                <Yearbook3DPage />
              </div>
            </div>
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
