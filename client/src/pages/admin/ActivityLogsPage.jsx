import { useState, useEffect, useCallback } from "react"
import {
  ScrollText,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Shield,
  FileText,
  Settings,
  Upload,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Calendar,
  Clock,
  Globe,
  Monitor,
  Eye,
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
import { getAuditLogs, getAuditLogDetail, getAuditLogFilters } from "@/services/auditLogService"

const ACTION_BADGES = {
  login: { variant: "active", icon: LogIn, label: "Login" },
  logout: { variant: "inactive", icon: LogOut, label: "Logout" },
  login_failed: { variant: "rejected", icon: AlertTriangle, label: "Login Failed" },
  user_created: { variant: "approved", icon: User, label: "User Created" },
  user_updated: { variant: "pending", icon: User, label: "User Updated" },
  user_deleted: { variant: "rejected", icon: User, label: "User Deleted" },
  user_role_changed: { variant: "pending", icon: Shield, label: "Role Changed" },
  user_status_changed: { variant: "pending", icon: Shield, label: "Status Changed" },
  profile_updated: { variant: "pending", icon: FileText, label: "Profile Updated" },
  profile_submitted: { variant: "pending", icon: FileText, label: "Profile Submitted" },
  profile_approved: { variant: "approved", icon: CheckCircle, label: "Profile Approved" },
  profile_rejected: { variant: "rejected", icon: AlertTriangle, label: "Profile Rejected" },
  resume_created: { variant: "approved", icon: FileText, label: "Resume Created" },
  resume_updated: { variant: "pending", icon: FileText, label: "Resume Updated" },
  resume_deleted: { variant: "rejected", icon: FileText, label: "Resume Deleted" },
  import_completed: { variant: "approved", icon: Upload, label: "Import Completed" },
  import_failed: { variant: "rejected", icon: Upload, label: "Import Failed" },
  settings_updated: { variant: "pending", icon: Settings, label: "Settings Updated" },
}

const ENTITY_ICONS = {
  auth: LogIn,
  profile: User,
  resume: FileText,
  import_batch: Upload,
  yearbook_settings: Settings,
}

function getActionBadge(action) {
  return ACTION_BADGES[action] || { variant: "pending", icon: ScrollText, label: action }
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
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function JsonDiff({ oldData, newData }) {
  const oldObj = oldData ? (typeof oldData === "string" ? JSON.parse(oldData) : oldData) : {}
  const newObj = newData ? (typeof newData === "string" ? JSON.parse(newData) : newData) : {}
  const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])]

  if (allKeys.length === 0) {
    return <p className="text-sm text-[var(--text-muted)] italic">No data changes recorded</p>
  }

  return (
    <div className="space-y-1">
      {allKeys.map((key) => {
        const oldVal = oldObj[key]
        const newVal = newObj[key]
        const isAdded = oldVal === undefined
        const isRemoved = newVal === undefined
        const isChanged = oldVal !== newVal && !isAdded && !isRemoved

        return (
          <div key={key} className="flex items-start gap-2 text-sm font-mono">
            <span className="shrink-0 text-[var(--text-muted)]">{key}:</span>
            {isAdded && (
              <span>
                <span className="text-[var(--text-muted)] italic">null</span>
                {" → "}
                <span className="text-green-600 dark:text-green-400">{JSON.stringify(newVal)}</span>
              </span>
            )}
            {isRemoved && (
              <span>
                <span className="text-red-600 dark:text-red-400 line-through">{JSON.stringify(oldVal)}</span>
                {" → "}
                <span className="text-[var(--text-muted)] italic">null</span>
              </span>
            )}
            {isChanged && !isAdded && !isRemoved && (
              <span>
                <span className="text-red-600 dark:text-red-400 line-through">{JSON.stringify(oldVal)}</span>
                {" → "}
                <span className="text-green-600 dark:text-green-400">{JSON.stringify(newVal)}</span>
              </span>
            )}
            {!isAdded && !isRemoved && !isChanged && (
              <span className="text-[var(--text-secondary)]">{JSON.stringify(oldVal)}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function LogDetailSheet({ log, open, onClose }) {
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && log) {
      setLoading(true)
      getAuditLogDetail(log.id)
        .then(setDetail)
        .catch(() => setDetail(log))
        .finally(() => setLoading(false))
    }
  }, [open, log])

  if (!log) return null

  const display = detail || log
  const badge = getActionBadge(display.action)
  const ActionIcon = badge.icon
  const EntityIcon = ENTITY_ICONS[display.entity_type] || ScrollText

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="border-b border-[var(--border-light)] pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <ActionIcon size={18} />
            {badge.label}
          </SheetTitle>
          <SheetDescription>
            {formatDateTime(display.created_at)}
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="mt-6 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Actor */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Actor</h4>
              <div className="flex items-center gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-xs font-bold text-[var(--bg-primary)]">
                  {display.user?.display_name?.charAt(0) || display.user?.email?.charAt(0) || "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {display.user?.display_name || display.user?.full_name || display.user?.email || "System"}
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    {display.user?.email || "No email"} {display.user?.student_number ? `• ${display.user.student_number}` : ""}
                  </p>
                </div>
              </div>
            </div>

            {/* Target Entity */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Target Entity</h4>
              <div className="flex items-center gap-2 text-sm">
                <EntityIcon size={14} className="text-[var(--text-muted)]" />
                <span className="font-medium text-[var(--text-primary)]">{display.entity_type || "—"}</span>
                {display.entity_id && (
                  <span className="text-xs text-[var(--text-muted)] font-mono truncate">
                    {display.entity_id.slice(0, 8)}…
                  </span>
                )}
              </div>
            </div>

            {/* IP & User Agent */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  <span className="flex items-center gap-1"><Globe size={12} /> IP Address</span>
                </h4>
                <p className="text-sm text-[var(--text-primary)] font-mono">{display.ip_address || "—"}</p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  <span className="flex items-center gap-1"><Monitor size={12} /> User Agent</span>
                </h4>
                <p className="text-xs text-[var(--text-secondary)] truncate" title={display.user_agent}>
                  {display.user_agent || "—"}
                </p>
              </div>
            </div>

            {/* Data Changes */}
            {(display.old_data || display.new_data) && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">Data Changes</h4>
                <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-3 max-h-64 overflow-y-auto">
                  <JsonDiff oldData={display.old_data} newData={display.new_data} />
                </div>
              </div>
            )}

            {/* Raw JSON (collapsible) */}
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-secondary)]">
                Raw Data
              </summary>
              <div className="mt-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-3 max-h-48 overflow-y-auto">
                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap break-all">
                  {JSON.stringify(
                    { old_data: display.old_data, new_data: display.new_data, ip_address: display.ip_address, user_agent: display.user_agent },
                    null,
                    2
                  )}
                </pre>
              </div>
            </details>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [availableActions, setAvailableActions] = useState([])
  const [availableEntityTypes, setAvailableEntityTypes] = useState([])

  const [selectedLog, setSelectedLog] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const totalPages = Math.ceil(total / perPage)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getAuditLogs({
        page,
        perPage,
        action: actionFilter || undefined,
        entityType: entityFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      })
      setLogs(result.logs)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [page, perPage, actionFilter, entityFilter, dateFrom, dateTo])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    getAuditLogFilters()
      .then((f) => {
        setAvailableActions(f.actions || [])
        setAvailableEntityTypes(f.entityTypes || [])
      })
      .catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchLogs()
  }

  const handleResetFilters = () => {
    setSearch("")
    setActionFilter("")
    setEntityFilter("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const handleExportCSV = () => {
    const headers = ["Timestamp", "User", "Email", "Student #", "Action", "Entity Type", "Entity ID", "IP Address"]
    const rows = logs.map((l) => [
      formatDateTime(l.created_at),
      l.user?.display_name || l.user?.full_name || l.user?.email || "System",
      l.user?.email || "",
      l.user?.student_number || "",
      l.action,
      l.entity_type || "",
      l.entity_id || "",
      l.ip_address || "",
    ])

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleRowClick = (log) => {
    setSelectedLog(log)
    setDetailOpen(true)
  }

  const hasFilters = actionFilter || entityFilter || dateFrom || dateTo

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Activity Logs
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {total.toLocaleString()} total events — track all system activity
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <Button variant="outline" size="sm" onClick={fetchLogs} className="gap-2" disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2" disabled={logs.length === 0}>
            <Download size={14} />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-col gap-3">
          {/* Search + Action + Entity row */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  type="text"
                  placeholder="Search by user name, email, student #…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button type="submit" size="sm" className="h-9">
                Search
              </Button>
            </form>

            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-[160px]">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {availableActions.map((a) => (
                    <SelectItem key={a} value={a}>
                      {getActionBadge(a).label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1) }}>
                <SelectTrigger className="h-9 w-[150px]">
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  {availableEntityTypes.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date range + reset */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[var(--text-muted)]" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                className="h-9 w-[150px]"
              />
              <span className="text-xs text-[var(--text-muted)]">to</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                className="h-9 w-[150px]"
              />
            </div>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleResetFilters} className="gap-1 text-xs h-8">
                <X size={12} />
                Clear filters
              </Button>
            )}

            <span className="text-xs text-[var(--text-muted)] ml-auto">
              Showing {logs.length > 0 ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, total)} of {total}
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-[var(--status-red)]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                <th className="px-4 py-3 whitespace-nowrap">Timestamp</th>
                <th className="px-4 py-3 whitespace-nowrap">User</th>
                <th className="px-4 py-3 whitespace-nowrap">Action</th>
                <th className="hidden px-4 py-3 whitespace-nowrap md:table-cell">Entity</th>
                <th className="hidden px-4 py-3 whitespace-nowrap lg:table-cell">IP Address</th>
                <th className="px-4 py-3 whitespace-nowrap text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-light)]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-5 w-24" /></td>
                    <td className="hidden px-4 py-3 md:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-10 ml-auto" /></td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <ScrollText size={32} className="mx-auto mb-3 text-[var(--text-muted)]" />
                    <p className="text-sm font-medium text-[var(--text-secondary)]">No activity logs found</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {hasFilters ? "Try adjusting your filters" : "Activity will appear here as users interact with the system"}
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getActionBadge(log.action)
                  const ActionIcon = badge.icon
                  const EntityIcon = ENTITY_ICONS[log.entity_type] || ScrollText
                  const userName = log.user?.display_name || log.user?.full_name || log.user?.email || "System"

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-[var(--bg-subtle)]/50 cursor-pointer"
                      onClick={() => handleRowClick(log)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <Clock size={12} className="shrink-0 text-[var(--text-muted)]" />
                          <span className="text-xs" title={formatDateTime(log.created_at)}>
                            {formatRelativeTime(log.created_at)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 text-[10px] font-bold text-[var(--bg-primary)]">
                            {userName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[var(--text-primary)] max-w-[160px]" title={userName}>
                              {userName}
                            </p>
                            {log.user?.student_number && (
                              <p className="truncate text-[10px] text-[var(--text-muted)]">
                                {log.user.student_number}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={badge.variant} className="gap-1 whitespace-nowrap">
                          <ActionIcon size={11} />
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                          <EntityIcon size={12} className="shrink-0 text-[var(--text-muted)]" />
                          <span className="text-xs">{log.entity_type || "—"}</span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <span className="text-xs font-mono text-[var(--text-muted)]">
                          {log.ip_address || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7"
                          onClick={(e) => { e.stopPropagation(); handleRowClick(log) }}
                        >
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--border-light)] px-4 py-3">
            <p className="text-xs text-[var(--text-muted)]">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                className="h-8 w-8"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 text-xs"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button
                variant="outline"
                size="icon-sm"
                className="h-8 w-8"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-muted)] sm:flex-row">
          <span>© {new Date().getFullYear()} NEMCO Digital Yearbook. All rights reserved.</span>
          <nav className="flex gap-4">
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Terms of Use</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Contact Us</a>
          </nav>
        </div>
      </footer>

      {/* Detail Sheet */}
      <LogDetailSheet
        log={selectedLog}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedLog(null) }}
      />
    </div>
  )
}
