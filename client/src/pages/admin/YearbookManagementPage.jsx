import { useState, useEffect, useCallback } from "react"
import {
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Save,
  ToggleLeft,
  ToggleRight,
  FileText,
  Upload,
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
} from "@/components/ui/dialog"
import {
  getFlipbookSettings,
  updateFlipbookSettings,
  getPdfPages,
  addPdfPage,
  updatePdfPage,
  removePdfPage,
  uploadPdfFile,
  getYearbookCatalog,
} from "@/services/flipbookService"
import PdfUploader from "@/components/admin/PdfUploader"
import Yearbook3DPage from "@/pages/student/Yearbook3DPage"
import { dedupeBatchLabels } from "@/utils/yearbookEditionHelpers"
import { COURSE_OPTIONS } from "@/utils/courseOptions"

function SettingsSection({ settings, onUpdate }) {
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

function EditionsList({ editions, onRefresh, catalog }) {
   const [editingId, setEditingId] = useState(null)
   const [editDept, setEditDept] = useState("")
   const [editBatch, setEditBatch] = useState("")
   const [deletingId, setDeletingId] = useState(null)
   const batchDatalistId = "edit-batch-suggestions"

   const batchOptions = dedupeBatchLabels([
     ...(catalog?.batches || []),
     ...(editBatch ? [editBatch] : []),
   ])

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
     setEditingId(page.id)
     setEditDept(page.department || "")
     setEditBatch(page.batch || "")
   }

   const handleSaveEdit = async (id) => {
     try {
       await updatePdfPage(id, { department: editDept || null, sub_department: null, batch: editBatch || null })
       setEditingId(null)
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
            Yearbook Editions
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {editions.length} edition{editions.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
      </div>

      {editions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border-light)] p-8 text-center">
          <FileText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">No editions uploaded</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Upload a PDF to create your first yearbook edition
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {editions.map((page) => (
            <div
              key={page.id}
              className={`rounded-lg border p-3 transition-colors ${
                page.is_active
                  ? "border-[var(--border-light)] bg-[var(--bg-surface)]"
                  : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20"
              }`}
            >
               {editingId === page.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={editDept || ""} onValueChange={setEditDept}>
                     <SelectTrigger className="h-8 min-w-[140px] max-w-[200px]">
                       <SelectValue placeholder="Course / Strand" />
                     </SelectTrigger>
                     <SelectContent>
                       {COURSE_OPTIONS.flatMap((entry) => [
                         <SelectItem key={entry.value} value={entry.value} className="font-semibold">{entry.label}</SelectItem>,
                         ...entry.subs.map((s) => (
                           <SelectItem key={s} value={s} className="pl-6">{s}</SelectItem>
                         )),
                       ])}
                     </SelectContent>
                   </Select>
                   <Input
                     value={editBatch}
                     onChange={(e) => setEditBatch(e.target.value)}
                     placeholder="Batch"
                     className="h-8 w-[120px]"
                     list={batchDatalistId}
                   />
                   {batchOptions.length > 0 && (
                     <datalist id={batchDatalistId}>
                       {batchOptions.map((b) => (
                         <option key={b} value={b} />
                       ))}
                     </datalist>
                   )}
                   <Button size="sm" className="h-8" onClick={() => handleSaveEdit(page.id)} disabled={!editDept}>Save</Button>
                   <Button size="sm" variant="outline" className="h-8" onClick={() => setEditingId(null)}>Cancel</Button>
                 </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                    <FileText size={20} className="text-red-600 dark:text-red-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {page.title}
                    </p>
                     <p className="truncate text-[10px] text-[var(--text-muted)]">
                       {page.department || "No course/strand"} • {page.batch || "No batch"} • {page.file_name} • {formatFileSize(page.file_size)} • {page.page_count || 1} page{(page.page_count || 1) !== 1 ? "s" : ""}
                     </p>
                  </div>

                  <Badge variant={page.is_active ? "default" : "inactive"} className="text-[10px]">
                    {page.is_active ? "Active" : "Inactive"}
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
                        <EyeOff size={14} className="text-amber-500" />
                      ) : (
                        <Eye size={14} />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-7 w-7"
                      onClick={() => handleEdit(page)}
                      title="Edit course/strand and batch"
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
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default function YearbookManagementPage() {
  const [settings, setSettings] = useState(null)
  const [editions, setEditions] = useState([])
   const [catalog, setCatalog] = useState({ departments: [], batches: [], courseStrands: [], subCourses: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
    const [showUploadDialog, setShowUploadDialog] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [selectedDept, setSelectedDept] = useState("")
    const [selectedBatch, setSelectedBatch] = useState("")

    const batchOptions = dedupeBatchLabels(catalog.batches || [])
   const batchDatalistId = "batch-suggestions"

   const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [settingsRes, editionsRes, catalogRes] = await Promise.all([
        getFlipbookSettings(),
        getPdfPages(),
        getYearbookCatalog(),
      ])
      setSettings(settingsRes)
      setEditions(editionsRes || [])
       setCatalog(catalogRes || { departments: [], batches: [], courseStrands: [], subCourses: [] })
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

    const handleUpload = async ({ file, title, description, onProgress }) => {
      if (!selectedDept) {
        throw new Error("Select a course/strand before uploading.")
      }
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
          department: selectedDept || null,
          subDepartment: null,
          batch: selectedBatch || null,
        })

        setShowUploadDialog(false)
        setSelectedDept("")
        setSelectedBatch("")
        fetchAll()
      } catch (err) {
        console.error(err)
        throw err
      } finally {
        setUploading(false)
      }
    }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            3D Yearbook Management
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Configure and manage your yearbook editions
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

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
            <SettingsSection settings={settings} onUpdate={handleSettingsUpdate} />
          </div>

          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Upload size={16} />
                  Upload New Edition
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Upload a PDF for a specific course/strand and batch</p>
              </div>
              <Button
                size="sm"
                onClick={() => setShowUploadDialog(true)}
                className="gap-2"
                disabled={!selectedDept}
              >
                <Plus size={14} />
                Upload PDF
              </Button>
            </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Course / Strand</label>
                  <Select value={selectedDept || ""} onValueChange={setSelectedDept}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select course / strand…" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_OPTIONS.flatMap((entry) => [
                        <SelectItem key={entry.value} value={entry.value} className="font-semibold">{entry.label}</SelectItem>,
                        ...entry.subs.map((s) => (
                          <SelectItem key={s} value={s} className="pl-6">{s}</SelectItem>
                        )),
                      ])}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">Batch</label>
                  <Input
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    placeholder="e.g. 2025-2026"
                    className="h-9"
                    list={batchDatalistId}
                  />
                  {batchOptions.length > 0 && (
                    <datalist id={batchDatalistId}>
                      {batchOptions.map((b) => (
                        <option key={b} value={b} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2">
              Options are loaded from existing student profiles. Students auto-see the yearbook that matches their course/strand on login.
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
            <EditionsList editions={editions} onRefresh={fetchAll} catalog={catalog} />
          </div>

          <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Eye size={16} />
                  Preview
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  This is exactly what students will see when they open the yearbook
                </p>
              </div>
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

            <div className="rounded-xl border border-[var(--border-light)] shadow-xl bg-gradient-to-br from-amber-50 via-stone-50 to-slate-100 dark:from-[#0d1b2a] dark:via-[#112233] dark:to-[#0d1b2a]" style={{ minHeight: "400px", overflow: "hidden" }}>
              <Yearbook3DPage />
            </div>
          </div>
        </div>
      )}

      <Dialog open={showUploadDialog} onOpenChange={(open) => !uploading && setShowUploadDialog(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload PDF Edition</DialogTitle>
            <DialogDescription>
               Upload a PDF for {selectedDept || "the selected course/strand"}{selectedBatch ? ` (${selectedBatch})` : ""}
             </DialogDescription>
          </DialogHeader>
          <PdfUploader
            onUploadSuccess={handleUpload}
            onCancel={() => !uploading && setShowUploadDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}