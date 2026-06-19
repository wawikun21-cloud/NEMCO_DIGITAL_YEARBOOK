import { useAuth } from "@/contexts/AuthContext"
import LoginPage from "./pages/student/LoginPage"
import LibraryPage from "./pages/student/LibraryPage"
import ProfilePage from "./pages/student/ProfilePage"
import FlipbookPage from "./pages/student/FlipbookPage"
import Yearbook3DPage from "./pages/student/Yearbook3DPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdminDashboard from "@/pages/admin/AdminDashboard"
import ImportUsersPage from "@/pages/admin/ImportUsersPage"
import ManageUsersPage from "@/pages/admin/ManageUsersPage"
import ActivityLogsPage from "@/pages/admin/ActivityLogsPage"
import ResumeManagementPage from "@/pages/admin/ResumeManagementPage"
import YearbookManagementPage from "@/pages/admin/YearbookManagementPage"

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
    if (path === "/library") return "library"
    if (path === "/profile") return "profile"
    if (path === "/flipbook") return "flipbook"
    if (path === "/3d-yearbook") return "3d-yearbook"
    if (path === "/resume") return "resume"
    return "library"
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
    if (path === "/library") return <LibraryPage />
    if (path === "/profile") return <ProfilePage />
    if (path === "/flipbook") return <FlipbookPage />
    if (path === "/3d-yearbook") return <Yearbook3DPage />
    if (path === "/resume") return <div className="p-8">Resume Builder (coming soon)</div>
    return <LibraryPage />
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