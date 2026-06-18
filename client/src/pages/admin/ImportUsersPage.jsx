import { useState } from "react"
import { Upload, AlertCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ImportPreviewModal from "@/components/admin/ImportPreviewModal.jsx"
import ImportProgress from "@/components/admin/ImportProgress.jsx"
import ImportResults from "@/components/admin/ImportResults.jsx"
import { uploadImport } from "@/services/importService.js"
import * as XLSX from "xlsx"

const VALID_IMPORT_ROLES = ["admin", "user"]

const normalizeText = (value) => {
  if (value == null) return ""
  return String(value).trim()
}

const normalizeStudentNumber = (value) => {
  const normalized = normalizeText(value)
  if (!normalized) return ""
  return normalized.padStart(7, "0")
}

const normalizeOptionalText = (value) => {
  const normalized = normalizeText(value)
  return normalized || undefined
}

const normalizeRole = (value) => {
  if (value == null) return ""
  return String(value).trim().toLowerCase()
}

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default function ImportUsersPage() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [validRows, setValidRows] = useState([])
  const [invalidRows, setInvalidRows] = useState([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [error, setError] = useState(null)

  const handleReset = () => {
    setSelectedFile(null)
    setValidRows([])
    setInvalidRows([])
    setPreviewOpen(false)
    setImportStatus(null)
    setError(null)
    const input = document.getElementById("import-file")
    if (input) input.value = ""
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = "." + (file.name.split(".").pop() || "").toLowerCase()
    if (![".xlsx", ".xls"].includes(ext)) {
      setError("Please select a valid .xlsx or .xls file")
      setSelectedFile(null)
      return
    }

    setError(null)
    setImportStatus(null)
    setSelectedFile(file)
    parseAndValidate(file)
  }

  const parseAndValidate = async (file) => {
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const sheet = workbook.Sheets[sheetName]

      /*
        KEY FIX: { raw: false } makes SheetJS return the *formatted string*
        that Excel displays — not the raw JS number.

        This is what preserves leading zeros:
          Excel cell "0026284" → JS "0026284"  ✅
          Without this flag  → JS  26284       ❌ (leading zero lost)

        The client-side parse must match the server-side parse exactly so the
        preview the admin sees is identical to what the backend will process.
      */
      const data = XLSX.utils.sheet_to_json(sheet, { raw: false })

      const valid = []
      const invalid = []

      data.forEach((row, index) => {
        const errors = []

        const rawStudentNumber  = row.student_number   ?? row["Student Number"]
        const rawYearLevel      = row.year_level       ?? row["Year Level"]
        const rawSection        = row.section          ?? row["Section"]
        const rawDisplayName    = row.display_name     ?? row["Display Name"]

        // With raw:false everything is already a string — normalizeText is a
        // trim-only pass-through, but it also safely handles null/undefined.
        const student_number    = normalizeStudentNumber(rawStudentNumber)
        const email             = normalizeText(row.email           ?? row["Email"])
        const full_name         = normalizeText(row.full_name       ?? row["Full Name"])
        const role              = normalizeRole(row.role            ?? row["Role"])
        const year_level        = normalizeText(rawYearLevel)
        const course_or_strand  = normalizeText(row.course_or_strand ?? row["Course or Strand"])

        if (!student_number) errors.push("Missing student_number")
        if (!email) errors.push("Missing email")
        else if (!isValidEmail(email)) errors.push("Invalid email format")
        if (!full_name) errors.push("Missing full_name")
        if (!role) errors.push("Missing role")
        else if (!VALID_IMPORT_ROLES.includes(role)) errors.push("Role must be 'admin' or 'user'")
        if (!year_level) errors.push("Missing year_level")
        if (!course_or_strand) errors.push("Missing course_or_strand")

        const normalized = {
          student_number,
          email,
          full_name,
          role: role === "student" ? "user" : role,
          year_level,
          course_or_strand,
          section:      normalizeOptionalText(rawSection),
          display_name: normalizeOptionalText(rawDisplayName),
          bio:          normalizeOptionalText(row.bio   ?? row["Bio"]),
          quote:        normalizeOptionalText(row.quote ?? row["Quote"]),
        }

        if (errors.length > 0) {
          invalid.push({ rowNumber: index + 2, error: errors.join(", "), ...normalized })
        } else {
          valid.push(normalized)
        }
      })

      setValidRows(valid)
      setInvalidRows(invalid)
      setPreviewOpen(true)
    } catch (err) {
      setError(err.message || "Failed to parse Excel file")
    }
  }

  const handleImport = async () => {
    if (!selectedFile || validRows.length === 0) return

    setError(null)
    setImportStatus({ progress: 0, status: "processing" })

    try {
      const results = await uploadImport(selectedFile)
      const status = results.errorCount > 0 ? "completed_with_errors" : "completed"

      setImportStatus({
        progress: 100,
        status,
        batchId: results.batchId,
        totalRows: results.totalRows,
        successCount: results.successCount,
        errorCount: results.errorCount,
      })
    } catch (err) {
      setError(err.message || "An unexpected error occurred during import.")
      setImportStatus({ progress: 100, status: "failed" })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    const input = document.getElementById("import-file")
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    input.files = dataTransfer.files
    handleFileChange({ target: input })
  }

  const handleDragOver = (e) => e.preventDefault()

  const isComplete   = importStatus?.status === "completed" || importStatus?.status === "completed_with_errors"
  const isDone       = isComplete || importStatus?.status === "failed"
  const isProcessing = importStatus?.status === "processing"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Bulk Import Users
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Upload an Excel file to create multiple user accounts at once.
          </p>
        </div>

        {(selectedFile || importStatus) && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-2 shrink-0">
            <RotateCcw size={14} />
            Start Over
          </Button>
        )}
      </div>

      {/* ── Drop zone ─────────────────────────────────────────────────── */}
      {!isProcessing && !isDone && (
        <div
          className="rounded-lg border-2 border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] p-8 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById("import-file").click()}
        >
          <Upload size={48} className="mx-auto mb-4 text-[var(--text-muted)]" />

          <div className="mb-4 pointer-events-none">
            <span className="text-sm font-medium text-[var(--text-primary)] underline">
              Click to upload
            </span>
            <span className="text-sm text-[var(--text-muted)]"> or drag and drop</span>
          </div>

          <p className="text-xs text-[var(--text-muted)]">.xlsx or .xls — max 5 MB</p>

          <Input
            id="import-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-[var(--status-red)]">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      {importStatus && (
        <ImportProgress progress={importStatus.progress} status={importStatus.status} />
      )}

      {/* ── Results card ──────────────────────────────────────────────── */}
      {isComplete && (
        <ImportResults results={importStatus} />
      )}

      {/* ── Centered preview modal ────────────────────────────────────── */}
      <ImportPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        validRows={validRows}
        invalidRows={invalidRows}
        onConfirm={handleImport}
        onCancel={() => setPreviewOpen(false)}
      />
    </div>
  )
}