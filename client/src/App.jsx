import { useAuth } from "@/contexts/AuthContext"
import DashboardPage from "./pages/student/DashboardPage"
import LoginPage from "./pages/student/LoginPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import ImportUsersPage from "@/pages/admin/ImportUsersPage"

export default function App() {
  const { user, profile, role, logout } = useAuth()

  if (!user || !profile) {
    return <LoginPage />
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

  const userDisplay = {
    name: profile.display_name || profile.full_name || user.email,
    firstName: (profile.display_name || profile.full_name || user.email).split(" ")[0],
    avatarInitials: (profile.display_name || profile.full_name || user.email).charAt(0)
  }

  const getActivePage = () => {
    const path = window.location.pathname
    if (path === "/admin" || path === "/admin/") return "admin-dashboard"
    if (path === "/admin/import") return "admin-import"
    if (path === "/admin/users") return "admin-users"
    if (path === "/admin/logs") return "admin-logs"
    if (path === "/admin/settings") return "admin-settings"
    if (path === "/dashboard") return "dashboard"
    return "dashboard"
  }

  const getAdminPage = () => {
    const path = window.location.pathname
    if (path === "/admin/import") return <ImportUsersPage />
    return <AdminDashboard />
  }

  if (role === "admin") {
    return (
      <DashboardLayout
        activePage={getActivePage()}
        user={userDisplay}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onProfile={handleProfile}
      >
        {getAdminPage()}
      </DashboardLayout>
    )
  }

  return <DashboardPage />
}