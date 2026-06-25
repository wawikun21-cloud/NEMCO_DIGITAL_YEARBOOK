import AdminStatCard from "../../components/admin/AdminStatCard"
import {
  Users,
  UserCheck,
  UserPlus,
  ClipboardCheck,
  FileText,
  Upload,
  AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { getDashboard } from "../../services/dashboardService.js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

const DISPLAY_LIMIT = 10

const STAT_CONFIG = [
  {
    id: "total-users",
    label: "Total Users",
    icon: Users,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "active-users",
    label: "Active Users",
    icon: UserCheck,
    iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "new-this-month",
    label: "New This Month",
    icon: UserPlus,
    iconBg: "bg-violet-50 dark:bg-violet-900/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "completed-profiles",
    label: "Completed Profiles",
    icon: ClipboardCheck,
    iconBg: "bg-sky-50 dark:bg-sky-900/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "pending-approvals",
    label: "Pending Approvals",
    icon: ClipboardCheck,
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "resumes-created",
    label: "Resumes Created",
    icon: FileText,
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "recent-imports",
    label: "Recent Imports",
    icon: Upload,
    iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "failed-imports",
    label: "Failed Imports",
    icon: AlertTriangle,
    iconBg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
]

function formatStatValue(id, value) {
  if (value === undefined || value === null) return "—"
  if (id === "new-this-month") return "+" + Number(value).toLocaleString()
  return Number(value).toLocaleString()
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [recentLogs, setRecentLogs] = useState([])
  const [failedImports, setFailedImports] = useState([])
  const [activityModalOpen, setActivityModalOpen] = useState(false)
  const [importsModalOpen, setImportsModalOpen] = useState(false)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const data = await getDashboard()
        setStats(data.stats)
        setRecentLogs(data.recentLogs || [])
        setFailedImports(data.failedImports || [])
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        setStats(null)
        setRecentLogs([])
        setFailedImports([])
      }
    }
    fetchDashboardData()
  }, [])

  const displayedLogs = recentLogs.slice(0, DISPLAY_LIMIT)
  const displayedFailedImports = failedImports.slice(0, DISPLAY_LIMIT)
  const hasMoreLogs = recentLogs.length > DISPLAY_LIMIT

  const displayStats = stats
    ? [
        { ...STAT_CONFIG[0], value: formatStatValue("total-users", stats.totalUsers) },
        { ...STAT_CONFIG[1], value: formatStatValue("active-users", stats.activeUsers) },
        { ...STAT_CONFIG[2], value: formatStatValue("new-this-month", stats.newUsersThisMonth) },
        { ...STAT_CONFIG[3], value: formatStatValue("completed-profiles", stats.completedProfiles) },
        { ...STAT_CONFIG[4], value: formatStatValue("pending-approvals", stats.pendingApprovals) },
        { ...STAT_CONFIG[5], value: formatStatValue("resumes-created", stats.resumesCreated) },
        { ...STAT_CONFIG[6], value: formatStatValue("recent-imports", stats.recentImports) },
        { ...STAT_CONFIG[7], value: formatStatValue("failed-imports", stats.failedImports) },
      ]
    : STAT_CONFIG.map((stat) => ({ ...stat, value: "—" }))

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Admin Dashboard
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          System overview and recent activity at a glance.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {displayStats.map((stat, index) => (
          <div key={stat.id} className={`animate-fade-in-up animate-delay-${(index + 1) * 100}`}>
            <AdminStatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Recent Activity & Failed Imports */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activity Table */}
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Recent Activity</h2>
            <p className="text-xs text-[var(--text-muted)]">Latest {DISPLAY_LIMIT} audit log entries</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="px-3 py-3 sm:px-5">User</th>
                  <th className="px-3 py-3 sm:px-5">Action</th>
                  <th className="hidden px-3 py-3 sm:table-cell sm:px-5">Entity</th>
                  <th className="px-3 py-3 text-right sm:px-5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {displayedLogs.length > 0 ? (
                  displayedLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-[var(--bg-subtle)]/50"
                    >
                      <td className="px-3 py-3 font-medium text-[var(--text-primary)] sm:px-5">{log.user}</td>
                      <td className="px-3 py-3 text-[var(--text-secondary)] sm:px-5">{log.action}</td>
                      <td className="hidden px-3 py-3 text-[var(--text-muted)] sm:table-cell sm:px-5">{log.entity}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-[var(--text-muted)] sm:px-5">
                        {log.time}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-[var(--text-muted)]">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {hasMoreLogs && (
            <div className="border-t border-[var(--border-light)] px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActivityModalOpen(true)}
                className="text-xs"
              >
                View all
              </Button>
            </div>
          )}
        </div>

        {/* Failed Imports */}
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Failed Imports</h2>
            <p className="text-xs text-[var(--text-muted)]">Recent batches with errors (showing {DISPLAY_LIMIT})</p>
          </div>
          {displayedFailedImports.length > 0 ? (
            <div className="divide-y divide-[var(--border-light)]">
              {displayedFailedImports.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-[var(--bg-subtle)]/50"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {item.fileName}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-[var(--status-red)]">{item.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-[var(--text-muted)]">
              No failed imports
            </div>
          )}
          <div className="border-t border-[var(--border-light)] px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImportsModalOpen(true)}
              className="text-xs"
              disabled={failedImports.length === 0}
            >
              View all ({failedImports.length})
            </Button>
          </div>
        </div>
      </div>

      {/* All Activity Modal */}
      <Dialog open={activityModalOpen} onOpenChange={setActivityModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>All Recent Activity</DialogTitle>
            <DialogDescription>Complete audit log entries ({recentLogs.length} total)</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--bg-surface)]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="hidden px-3 py-3 sm:table-cell">Entity</th>
                  <th className="px-3 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-[var(--bg-subtle)]/50"
                    >
                      <td className="px-3 py-3 font-medium text-[var(--text-primary)]">{log.user}</td>
                      <td className="px-3 py-3 text-[var(--text-secondary)]">{log.action}</td>
                      <td className="hidden px-3 py-3 text-[var(--text-muted)] sm:table-cell">{log.entity}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right text-[var(--text-muted)]">
                        {log.time}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-[var(--text-muted)]">
                      No recent activity
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Failed Imports Modal */}
      <Dialog open={importsModalOpen} onOpenChange={setImportsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>All Failed Imports</DialogTitle>
            <DialogDescription>All batches with errors ({failedImports.length} total)</DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 divide-y divide-[var(--border-light)]">
            {failedImports.length > 0 ? (
              failedImports.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-1 px-3 py-4 transition-colors hover:bg-[var(--bg-subtle)]/50"
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {item.fileName}
                    </span>
                    <span className="shrink-0 text-xs text-[var(--text-muted)]">{item.timestamp}</span>
                  </div>
                  <p className="text-xs text-[var(--status-red)]">{item.reason}</p>
                </div>
              ))
            ) : (
              <div className="px-3 py-8 text-center text-[var(--text-muted)]">
                No failed imports
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}