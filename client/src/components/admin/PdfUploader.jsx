import { useState, useRef, useCallback } from "react"
import { Upload, FileText, X, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function PdfUploader({ onUploadSuccess, onCancel }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile)
      setTitle(droppedFile.name.replace(".pdf", ""))
      setError(null)
    } else {
      setError("Please drop a valid PDF file")
    }
  }, [])

  const handleFileSelect = useCallback((e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setTitle(selectedFile.name.replace(".pdf", ""))
      setError(null)
    } else {
      setError("Please select a valid PDF file")
    }
  }, [])

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file")
      return
    }

    setUploading(true)
    setError(null)
    setProgress(10)

    try {
      const onProgress = (p) => setProgress(p)

      await onUploadSuccess({
        file,
        title: title || file.name.replace(".pdf", ""),
        description,
        onProgress,
      })

      setProgress(100)
    } catch (err) {
      setError(err.message || "Failed to upload PDF")
      setProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            dragging
              ? "border-[var(--bg-primary)] bg-[var(--bg-primary)]/5"
              : "border-[var(--border-light)] hover:border-[var(--bg-primary)]/50 hover:bg-[var(--bg-subtle)]"
          }`}
        >
          <Upload
            size={40}
            className={`mx-auto mb-3 ${dragging ? "text-[var(--bg-primary)]" : "text-[var(--text-muted)]"}`}
          />
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {dragging ? "Drop your PDF here" : "Drag & drop your PDF here"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            or click to browse files
          </p>
          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Maximum file size: 50MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <FileText size={24} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {file.name}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {formatFileSize(file.size)}
              </p>
            </div>
            {!uploading && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setFile(null)
                  setTitle("")
                  setDescription("")
                }}
                className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
              Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this PDF"
              className="h-9"
              disabled={uploading}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--text-secondary)] mb-1.5 block">
              Description (optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description"
              className="h-9"
              disabled={uploading}
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Uploading...</span>
                <span className="text-[var(--text-muted)]">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className="h-full bg-[var(--bg-primary)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={uploading}>
            Cancel
          </Button>
        )}
        {file && (
          <Button
            onClick={handleUpload}
            disabled={uploading || !title.trim()}
            className="gap-2"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload PDF
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
