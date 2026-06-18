import AdminStatCard from "./AdminStatCard"
import {
  Users,
  UserCheck,
  UserPlus,
  ClipboardCheck,
  FileText,
  Upload,
  AlertTriangle,
  ScrollText,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const mockStats = [
  {
    id: "total-users",
    label: "Total Users",
    value: "1,284",
    icon: Users,
    trend: { value: "12% vs last month", positive: true },
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "active-users",
    label: "Active Users",
    value: "1,198",
    icon: UserCheck,
    trend: { value: "8% vs last month", positive: true },
    iconBg: "bg-emerald-50 dark:bg-emerald-900/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "new-this-month",
    label: "New This Month",
    value: "+86",
    icon: UserPlus,
    iconBg: "bg-violet-50 dark:bg-violet-900/20",
    iconColor: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "completed-profiles",
    label: "Completed Profiles",
    value: "923",
    icon: ClipboardCheck,
    trend: { value: "5% vs last month", positive: true },
    iconBg: "bg-sky-50 dark:bg-sky-900/20",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "pending-approvals",
    label: "Pending Approvals",
    value: "47",
    icon: ClipboardCheck,
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "resumes-created",
    label: "Resumes Created",
    value: "312",
    icon: FileText,
    trend: { value: "18% vs last month", positive: true },
    iconBg: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "recent-imports",
    label: "Recent Imports",
    value: "12",
    icon: Upload,
    iconBg: "bg-indigo-50 dark:bg-indigo-900/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
  {
    id: "failed-imports",
    label: "Failed Imports",
    value: "3",
    icon: AlertTriangle,
    iconBg: "bg-red-50 dark:bg-red-900/20",
    iconColor: "text-red-600 dark:text-red-400",
  },
]

const mockRecentLogs = [
  { id: 1, user: "Maria Santos", action: "Profile Updated", entity: "Profile", time: "2 minutes ago" },
  { id: 2, user: "System", action: "Import Completed", entity: "Import Batch #12", time: "18 minutes ago" },
  { id: 3, user: "Admin", action: "User Created", entity: "Juan Dela Cruz", time: "1 hour ago" },
  { id: 4, user: "Pedro Reyes", action: "Login", entity: "Auth", time: "2 hours ago" },
  { id: 5, user: "System", action: "Import Failed", entity: "Import Batch #11", time: "3 hours ago" },
]

const mockFailedImports = [
  {
    id: "batch-0011",
    fileName: "students_batch_march.xlsx",
    reason: "Invalid email format on row 14, 27, 33",
    timestamp: "3 hours ago",
  },
  {
    id: "batch-0012",
    fileName: "new_students.xlsx",
    reason: "Duplicate student_number detected on row 5",
    timestamp: "Yesterday",
  },
]

export default function AdminDashboard() {
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

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="default"
          onClick={() => console.log("→ /admin/users")}
          className="gap-2"
        >
          <Users size={16} />
          Manage Users
        </Button>
        <Button
          variant="outline"
          onClick={() => console.log("→ /admin/logs")}
          className="gap-2"
        >
          <ScrollText size={16} />
          View Audit Logs
        </Button>
        <Button
          variant="outline"
          onClick={() => console.log("→ /admin/import")}
          className="gap-2"
        >
          <Upload size={16} />
          Bulk Import
        </Button>
        <Button
          variant="outline"
          onClick={() => console.log("→ /admin/settings")}
          className="gap-2"
        >
          <Settings size={16} />
          Settings
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockStats.map((stat, index) => (
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
            <p className="text-xs text-[var(--text-muted)]">Latest 5 audit log entries</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-subtle)] text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity</th>
                  <th className="px-5 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-light)]">
                {mockRecentLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-[var(--bg-subtle)]/50"
                  >
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{log.user}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{log.action}</td>
                    <td className="px-5 py-3 text-[var(--text-muted)]">{log.entity}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-[var(--text-muted)]">
                      {log.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Failed Imports */}
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-sm">
          <div className="border-b border-[var(--border-light)] px-5 py-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Failed Imports</h2>
            <p className="text-xs text-[var(--text-muted)]">Recent batches with errors</p>
          </div>
          <div className="divide-y divide-[var(--border-light)]">
            {mockFailedImports.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-1 px-5 py-4 transition-colors hover:bg-[var(--bg-subtle)]/50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {item.fileName}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{item.timestamp}</span>
                </div>
                <p className="text-xs text-[var(--status-red)]">{item.reason}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--border-light)] px-5 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="text-xs"
            >
              View all failed imports
            </Button>
          </div>
        </div>
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
    </div>
  )
}