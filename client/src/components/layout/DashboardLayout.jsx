import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/navigation/AppSidebar"
import DashboardTopbar from "@/components/layout/DashboardTopbar"

/**
 * DashboardLayout
 * Wraps all authenticated dashboard pages with:
 *  - SidebarProvider (shadcn context + keyboard shortcut ctrl+b / cmd+b)
 *  - AppSidebar     (collapsible on tablet, offcanvas sheet on mobile)
 *  - SidebarInset   (pushes content to respect sidebar width)
 *  - DashboardTopbar (sticky header with SidebarTrigger)
 *
 * Props:
 *  - children:     ReactNode
 *  - activePage:   string    — key matching NAV_ITEMS in AppSidebar
 *  - user:         object    — { name, firstName, avatarInitials }
 *  - onNavigate:   (href) => void
 *  - onLogout:     () => void
 */
export default function DashboardLayout({
  children,
  activePage,
  user,
  onNavigate,
  onLogout,
}) {
  return (
    <SidebarProvider
      // Desktop default: open. Persisted in cookie by shadcn automatically.
      defaultOpen={true}
      style={{
        // Sidebar widths — adjust to taste
        "--sidebar-width": "16rem",
        "--sidebar-width-icon": "3.5rem",
      }}
    >
      {/* ── Sidebar ── */}
      <AppSidebar
        activePage={activePage}
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
      />

      {/* ── Main area (pushed right by sidebar on desktop) ── */}
      <SidebarInset className="flex min-h-screen flex-col bg-[var(--bg-page)]">
        {/* Topbar */}
        <DashboardTopbar user={user} />

        {/* Page content */}
        <div className="flex flex-1 flex-col">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
