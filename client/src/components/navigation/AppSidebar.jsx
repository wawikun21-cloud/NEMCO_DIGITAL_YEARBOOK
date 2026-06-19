import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BookOpen,
  ChevronsUpDown,
  FileText,
  LayoutDashboard,
  LogOut,
  User,
  Users,
  ScrollText,
  Upload,
  Settings,
  BookMarked,
  Sparkles,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

const NAV_MAIN = [
  { key: "3d-yearbook", label: "3D Yearbook", icon: Sparkles, href: "/3d-yearbook" },
  { key: "flipbook", label: "PDF Flipbook", icon: BookMarked, href: "/flipbook" },
  { key: "library", label: "My Library", icon: BookOpen, href: "/library" },
  { key: "profile", label: "Profile", icon: User, href: "/profile" },
  { key: "resume", label: "Resume", icon: FileText, href: "/resume" },
]

const NAV_ADMIN = [
  { key: "admin-dashboard",  label: "Dashboard",           icon: LayoutDashboard, href: "/admin" },
  { key: "admin-users",      label: "Manage Users",        icon: Users,           href: "/admin/users" },
  { key: "admin-resumes",    label: "Resume Management",   icon: FileText,        href: "/admin/resumes" },
  { key: "admin-yearbook",   label: "3D Yearbook",         icon: BookMarked,      href: "/admin/yearbook" },
  { key: "admin-logs",       label: "Activity Logs",       icon: ScrollText,      href: "/admin/logs" },
  { key: "admin-import",     label: "Bulk Import",         icon: Upload,          href: "/admin/import" },
  { key: "admin-settings",   label: "Settings",            icon: Settings,        href: "/admin/settings" },
]

export default function AppSidebar({ activePage = "library", onNavigate, onLogout, onProfile }) {
  const { user, role, profile } = useAuth()
  const navItems = role === "admin" ? NAV_ADMIN : NAV_MAIN

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[--sidebar-border]"
    >
      <SidebarHeader className="h-14 flex flex-row items-center px-3 border-b border-[--sidebar-border]">
        <div className="flex w-full items-center gap-3 overflow-hidden">
          <img
            src="/NEMCO-Logo.png"
            alt="NEMCO Logo"
            className="h-8 w-8 shrink-0 rounded-md object-contain"
          />
          <div className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-bold leading-tight text-[--sidebar-foreground]">
              NEMCO Yearbook
            </span>
            <span className="truncate text-[11px] leading-tight text-[--sidebar-foreground]/60">
              Student Digital Yearbook System
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-3 styled-scroll">
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="
            mb-1 h-6 px-2
            text-[10px] font-semibold uppercase tracking-widest
            text-[--sidebar-foreground]/40
            group-data-[collapsible=icon]:hidden
          ">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map(({ key, label, icon: Icon, href }) => (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    isActive={activePage === key}
                    tooltip={label}
                    onClick={() => onNavigate?.(href)}
                    className="
                      h-10 gap-3 rounded-lg px-3
                      text-sm font-medium
                      text-[--sidebar-foreground]/80
                      hover:bg-[--sidebar-accent] hover:text-[--sidebar-accent-foreground]
                      data-[active=true]:bg-[--sidebar-primary]/15
                      data-[active=true]:text-[--sidebar-accent-foreground]
                      data-[active=true]:font-semibold
                      transition-colors
                    "
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="mx-0 bg-[--sidebar-border]" />

      <SidebarFooter className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user?.email ?? "Account"}
                  className="
                    h-12 gap-3 rounded-lg px-3
                    text-[--sidebar-foreground]
                    hover:bg-[--sidebar-accent] hover:text-[--sidebar-accent-foreground]
                    data-[state=open]:bg-[--sidebar-accent]
                    data-[state=open]:text-[--sidebar-accent-foreground]
                    transition-colors
                  "
                >
<div className="
                     flex h-8 w-8 shrink-0 items-center justify-center
                     rounded-full overflow-hidden
                     bg-[--sidebar-primary]/20
                     text-xs font-bold text-[--sidebar-primary]
                     ring-2 ring-[--sidebar-primary]/40
                   ">
                     {profile?.avatar_url ? (
                       <img
                         src={profile.avatar_url}
                         alt="Avatar"
                         className="h-full w-full object-cover"
                       />
                     ) : (
                       user?.email?.charAt(0)?.toUpperCase() ?? "?"
                     )}
                   </div>

                  <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold leading-tight">
                      {user?.email ?? "Account"}
                    </span>
                    <span className="truncate text-[11px] leading-tight text-[--sidebar-foreground]/60">
                      {role}
                    </span>
                  </div>

                  <ChevronsUpDown
                    size={14}
                    className="ml-auto shrink-0 text-[--sidebar-foreground]/50 group-data-[collapsible=icon]:hidden"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-60 p-1.5"
              >
                <DropdownMenuLabel className="p-0 font-normal">
<div className="flex items-center gap-3 rounded-md px-3 py-3">
                     <div className="
                       flex h-9 w-9 shrink-0 items-center justify-center
                       rounded-full
                       bg-[var(--bg-sidebar)] dark:bg-[var(--bg-sidebar)]
                       text-xs font-bold text-[var(--accent-gold)]
                       ring-2 ring-border
                       overflow-hidden
                     ">
                       {profile?.avatar_url ? (
                         <img
                           src={profile.avatar_url}
                           alt="Avatar"
                           className="h-full w-full object-cover"
                         />
                       ) : (
                         user?.email?.charAt(0)?.toUpperCase() ?? "?"
                       )}
                     </div>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold leading-tight text-foreground">
                        {user?.email ?? "Account"}
                      </span>
                      <span className="truncate text-xs leading-tight text-muted-foreground">
                        {role}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={onProfile}
                  className="
                    flex items-center gap-3
                    rounded-md px-3 py-2.5
                    text-sm font-medium
                    cursor-pointer
                    text-foreground
                    focus:bg-accent focus:text-accent-foreground
                  "
                >
                  <User size={15} className="shrink-0 text-muted-foreground" />
                  <span>My Profile</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1" />

                <DropdownMenuItem
                  onClick={onLogout}
                  className="
                    flex items-center gap-3
                    rounded-md px-3 py-2.5
                    text-sm font-medium
                    cursor-pointer
                    text-red-500 dark:text-red-400
                    focus:bg-red-50 focus:text-red-600
                    dark:focus:bg-red-950/40 dark:focus:text-red-400
                  "
                >
                  <LogOut size={15} className="shrink-0" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>

            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}