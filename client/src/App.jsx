import { useAuth } from "@/contexts/AuthContext"
import DashboardPage from "./pages/student/DashboardPage"
import LoginPage from "./pages/student/LoginPage"
import DashboardLayout from "@/components/layout/DashboardLayout"
import AdminDashboard from "@/components/admin/AdminDashboard"

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

  if (role === "admin") {
    return (
      <DashboardLayout
        activePage="admin-dashboard"
        user={userDisplay}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onProfile={handleProfile}
      >
        <AdminDashboard />
      </DashboardLayout>
    )
  }

  // DashboardPage already includes DashboardLayout
  return <DashboardPage />
}