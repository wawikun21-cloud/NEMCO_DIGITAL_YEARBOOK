import { useDashboard } from "@/hooks/useDashboard"
import DashboardLayout from "@/components/layout/DashboardLayout"
import DashboardHero from "@/components/dashboard/DashboardHero"
import DashboardNavGrid from "@/components/dashboard/DashboardNavGrid"
import { useAuth } from "@/contexts/AuthContext"

/**
 * DashboardPage
 * Thin orchestration layer — no layout logic lives here.
 * Replace the navigate stubs with useNavigate() from react-router-dom.
 */
export default function DashboardPage() {
  const { user: authUser, logout } = useAuth()
  const { greeting } = useDashboard()

  const user = {
    name: authUser?.email || "Student",
    firstName: (authUser?.email || "Student").split("@")[0],
    avatarInitials: (authUser?.email || "Student").charAt(0),
  }

  const handleLogout = () => {
    logout()
    window.location.href = "/login"
  }

  const handleNavigate = (href) => {
    window.location.href = href
  }

  const handleProfile = () => {
    window.location.href = "/profile"
  }

  const handleLibrary = () => console.log("→ /library")
  const handleResume = () => console.log("→ /resume")

  return (
    <DashboardLayout
      activePage="dashboard"
      user={user}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      onProfile={handleProfile}
    >
      {/* ── Page content ── */}
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        <DashboardHero greeting={greeting} firstName={user.firstName} />

        <DashboardNavGrid
          onLibrary={handleLibrary}
          onProfile={handleProfile}
          onResume={handleResume}
        />
      </main>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-muted)] sm:flex-row">
          <span>© {new Date().getFullYear()} Student Portal. All rights reserved.</span>
          <nav className="flex gap-4">
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Terms of Use</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Contact Us</a>
          </nav>
        </div>
      </footer>
    </DashboardLayout>
  )
}