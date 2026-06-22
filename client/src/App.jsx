import { useAuth } from "@/contexts/AuthContext"
import LoginPage from "./pages/student/LoginPage"
import ProfilePage from "./pages/student/ProfilePage"
import Yearbook3DPage from "./pages/student/Yearbook3DPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import ImportUsersPage from "@/pages/admin/ImportUsersPage"
import ManageUsersPage from "@/pages/admin/ManageUsersPage"
import ActivityLogsPage from "@/pages/admin/ActivityLogsPage"
import ResumeManagementPage from "@/pages/admin/ResumeManagementPage"
import YearbookManagementPage from "@/pages/admin/YearbookManagementPage"
import PublicProfilePage from "@/pages/student/PublicProfilePage"
import ResumeBuilderPage from "@/pages/student/ResumeBuilderPage"

export default function App() {
  const { user, profile, role, logout } = useAuth()

  const isPublicProfilePath = /^\/(?:u|profile)\/[^/]+$/.test(window.location.pathname)

  if (isPublicProfilePath) {
    return <PublicProfilePage />
  }

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
    if (path === "/admin/resumes") return "admin-resumes"
    if (path === "/admin/yearbook") return "admin-yearbook"
    if (path === "/admin/logs") return "admin-logs"
    if (path === "/admin/settings") return "admin-settings"
    if (path === "/profile") return "profile"
    if (path === "/resume") return "resume"
    return "3d-yearbook"
  }

  const getAdminPage = () => {
    const path = window.location.pathname
    if (path === "/admin/import") return <ImportUsersPage />
    if (path === "/admin/users") return <ManageUsersPage />
    if (path === "/admin/logs") return <ActivityLogsPage />
    if (path === "/admin/resumes") return <ResumeManagementPage />
    if (path === "/admin/yearbook") return <YearbookManagementPage />
    return <AdminDashboard />
  }

  const getStudentPage = () => {
    const path = window.location.pathname
    if (path === "/profile") return <ProfilePage />
    if (path === "/resume") return <ResumeBuilderPage />
    return <Yearbook3DPage />
  }

  if (role === "admin") {
    return (
      <DashboardLayout
        activePage={getActivePage()}
        user={userDisplay}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      >
        {getAdminPage()}
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      activePage={getActivePage()}
      user={userDisplay}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {getStudentPage()}
    </DashboardLayout>
  )
}
