import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const COLUMNS = [
  { key: "student_number",   label: "Student #" },
  { key: "email",            label: "Email" },
  { key: "full_name",        label: "Full Name" },
  { key: "role",             label: "Role" },
  { key: "year_level",       label: "Year Level" },
  { key: "course_or_strand", label: "Course / Strand" },
  { key: "section",          label: "Section" },
  { key: "display_name",     label: "Display Name" },
  { key: "bio",              label: "Bio" },
  { key: "quote",            label: "Quote" },
]

function getVisibleColumns(rows) {
  return COLUMNS.filter((col) =>
    rows.some((row) => row[col.key] !== undefined && row[col.key] !== "")
  )
}

export default function ImportPreviewModal({
  open,
  onOpenChange,
  validRows,
  invalidRows,
  onConfirm,
  onCancel,
  sheetNames,
  selectedSheet,
  onSheetChange,
}) {
  const totalRows = validRows.length + invalidRows.length
  const maxRows = 50
  const isOverLimit = totalRows > maxRows
  const visibleColumns = getVisibleColumns(validRows)

  const handleConfirm = () => {
    onOpenChange(false)
    onConfirm(selectedSheet)
  }

  const handleCancel = () => {
    onOpenChange(false)
    onCancel()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        Mobile  : near full-screen (w-[95vw], max-h-[90vh])
        Desktop : very wide, capped at 95vw so it never bleeds off-screen
                  min-w forces it to actually use the space on large monitors
      */}
      <DialogContent className="
        flex flex-col gap-0 p-0
        w-[95vw] max-h-[90vh]
        sm:w-[95vw]
        lg:w-[90vw] lg:max-w-[1400px]
      ">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--border-light)] shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg">Import Preview</DialogTitle>
            <DialogDescription>
              Review {totalRows} record{totalRows !== 1 ? "s" : ""} before importing
            </DialogDescription>
          </DialogHeader>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-[var(--status-green)] border border-green-200">
              ✓ {validRows.length} valid
            </span>
            {invalidRows.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[var(--status-red)] border border-red-200">
                ✕ {invalidRows.length} invalid
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${isOverLimit ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
              {totalRows}/{maxRows} rows
            </span>
          </div>
        </div>

        {/* ── Sheet selector ──────────────────────────────────────────── */}
        {sheetNames.length > 0 && (
          <div className="px-6 py-3 border-b border-[var(--border-light)] bg-[var(--bg-subtle)] shrink-0">
            <p className="text-xs font-medium text-[var(--text-muted)] mb-2">Select sheet to import</p>
            <div className="flex flex-wrap gap-2">
              {sheetNames.map((name) => (
                <label
                  key={name}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs cursor-pointer select-none hover:border-[var(--text-muted)] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedSheet === name}
                    onChange={() => onSheetChange(name)}
                    className="h-3.5 w-3.5 rounded accent-[var(--status-green)] cursor-pointer"
                  />
                  <span className="text-[var(--text-primary)]">{name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* ── Scrollable body ─────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">

          {/* ── Valid Rows ─────────────────────────────────────────────── */}
          <section>
            <h3 className="text-sm font-semibold text-[var(--status-green)] mb-2">
              ✓ Valid Rows ({validRows.length})
            </h3>

            {validRows.length > 0 ? (
              <div className="overflow-x-auto border border-[var(--border-light)] rounded-lg max-h-72">
                <table className="w-full text-xs whitespace-nowrap border-collapse">
                  <thead className="sticky top-0 z-10 bg-[var(--bg-subtle)]">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-muted)] border-b border-[var(--border-light)] w-8">#</th>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.key}
                          className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-light)]"
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {validRows.slice(0, 50).map((row, i) => (
                      <tr
                        key={i}
                        className={`border-t border-[var(--border-light)] hover:bg-[var(--bg-subtle)] transition-colors ${i % 2 === 1 ? "bg-[var(--bg-subtle)]/40" : ""}`}
                      >
                        <td className="px-3 py-2 text-[var(--text-muted)] text-xs">{i + 1}</td>
                        {visibleColumns.map((col) => (
                          <td
                            key={col.key}
                            className="px-3 py-2 text-[var(--text-primary)]"
                            title={row[col.key] ?? ""}
                          >
                            {/* Bio/quote get a max-width truncate; other fields show fully */}
                            {col.key === "bio" || col.key === "quote" ? (
                              <span className="block max-w-[240px] truncate">
                                {row[col.key] ?? <span className="text-[var(--text-muted)] italic">—</span>}
                              </span>
                            ) : (
                              row[col.key] ?? <span className="text-[var(--text-muted)] italic">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {validRows.length > 50 && (
                  <p className="text-xs text-[var(--text-muted)] px-3 py-2 border-t border-[var(--border-light)]">
                    Showing first 50 of {validRows.length} valid rows
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">No valid rows to display</p>
            )}
          </section>

          {/* ── Invalid Rows ───────────────────────────────────────────── */}
          {invalidRows.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-[var(--status-red)] mb-2">
                ✕ Invalid Rows ({invalidRows.length})
              </h3>

              <div className="overflow-x-auto border border-[var(--border-light)] rounded-lg max-h-48">
                <table className="w-full text-xs whitespace-nowrap border-collapse">
                  <thead className="sticky top-0 z-10 bg-[var(--bg-subtle)]">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-light)]">Row</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-light)]">Student #</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-light)]">Email</th>
                      <th className="text-left px-3 py-2 font-semibold text-[var(--text-primary)] border-b border-[var(--border-light)]">Validation Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invalidRows.map((row, i) => (
                      <tr key={i} className="border-t border-[var(--border-light)] bg-red-50/40">
                        <td className="px-3 py-2 text-[var(--text-muted)]">{row.rowNumber}</td>
                        <td className="px-3 py-2 text-[var(--text-primary)]">
                          {row.student_number ?? <span className="text-[var(--text-muted)] italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[var(--text-primary)]">
                          {row.email ?? <span className="text-[var(--text-muted)] italic">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[var(--status-red)] font-medium">{row.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-[var(--border-light)] shrink-0">
          {isOverLimit && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
              ⚠ This file exceeds the {maxRows}-row limit. Please remove {totalRows - maxRows} row{totalRows - maxRows !== 1 ? "s" : ""} or split into smaller batches.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={validRows.length === 0 || isOverLimit}>
              Import {validRows.length} User{validRows.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}