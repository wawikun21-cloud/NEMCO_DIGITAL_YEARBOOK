import { AlertTriangle, CheckCircle, Download } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getBatchErrors } from "@/services/importService"

export default function ImportResults({ results }) {
  // All hooks must be called unconditionally at the top, before any conditional logic
  const [errors, setErrors] = useState(null)
  const [loadingErrors, setLoadingErrors] = useState(false)
  const fetchedRef = useRef(false)

  const batchId = results?.batchId
  const totalRows = results?.totalRows ?? 0
  const successCount = results?.successCount ?? 0
  const errorCount = results?.errorCount ?? 0
  const hasErrors = errorCount > 0
  const ResultIcon = hasErrors ? AlertTriangle : CheckCircle

  // Effect hook - always called, condition is inside the callback
  useEffect(() => {
    if (!batchId || errorCount <= 0 || fetchedRef.current) return

    fetchedRef.current = true
    setLoadingErrors(true)

    getBatchErrors(batchId)
      .then(setErrors)
      .finally(() => setLoadingErrors(false))
  }, [batchId, errorCount])

  // Early return after all hooks are called
  if (!results) {
    return null
  }

  const downloadErrors = async () => {
    const errorData = errors || await getBatchErrors(batchId)
    const csv = [
      ["Row Number", "Student #", "Email", "Error Message"],
      ...errorData.map(e => [
        e.row_number,
        e.student_number ?? "",
        e.email ?? "",
        e.message || "Unknown error",
      ]),
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `import-errors-${batchId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6">
      <div className="flex items-center gap-2 mb-4">
        <ResultIcon className={hasErrors ? "text-[var(--status-red)]" : "text-[var(--status-green)]"} size={20} />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {hasErrors ? "Import Complete with Errors" : "Import Complete"}
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--text-primary)]">{totalRows}</p>
          <p className="text-xs text-[var(--text-muted)]">Total Rows</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--status-green)]">{successCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Successful</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-[var(--status-red)]">{errorCount}</p>
          <p className="text-xs text-[var(--text-muted)]">Errors</p>
        </div>
      </div>

      {hasErrors && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadErrors}
            className="gap-2 mb-4"
            disabled={loadingErrors}
          >
            <Download size={14} />
            {loadingErrors ? "Loading..." : "Download Error Report"}
          </Button>

          {errors && (
            <div className="max-h-64 overflow-y-auto border border-[var(--border-light)] rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-[var(--bg-subtle)]">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold">Row</th>
                    <th className="text-left px-3 py-2 font-semibold">Student #</th>
                    <th className="text-left px-3 py-2 font-semibold">Email</th>
                    <th className="text-left px-3 py-2 font-semibold">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e, i) => (
                    <tr key={i} className="border-t border-[var(--border-light)] bg-red-50/40">
                      <td className="px-3 py-2 text-[var(--text-muted)]">{e.row_number}</td>
                      <td className="px-3 py-2 text-[var(--text-primary)]">
                        {e.student_number ?? <span className="text-[var(--text-muted)] italic">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--text-primary)]">
                        {e.email ?? <span className="text-[var(--text-muted)] italic">—</span>}
                      </td>
                      <td className="px-3 py-2 text-[var(--status-red)]">{e.message || "Unknown error"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}