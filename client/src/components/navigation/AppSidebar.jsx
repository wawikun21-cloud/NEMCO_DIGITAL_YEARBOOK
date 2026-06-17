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
} from "lucide-react"

/**
 * NAV_ITEMS — extracted list for easy customisation.
 */
const NAV_MAIN = [
  { key: "Home",     label: "Home",     icon: LayoutDashboard, href: "/dashboard" },
  { key: "library",       label: "Library",        icon: BookOpen,        href: "/library" },
  { key: "profile",       label: "My Profile",     icon: User,            href: "/profile" },
  { key: "resume",        label: "Resume Builder", icon: FileText,        href: "/resume" },
]

export default function AppSidebar({ activePage = "dashboard", user, onNavigate, onProfile, onLogout }) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-[--sidebar-border]"
    >
      {/* ── Header ── */}
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

      {/* ── Nav items ── */}
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
              {NAV_MAIN.map(({ key, label, icon: Icon, href }) => (
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

      {/* ── Footer: user dropdown ── */}
      <SidebarFooter className="px-2 py-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>

              {/* ── Trigger: user row ── */}
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  tooltip={user?.name ?? "Account"}
                  className="
                    h-12 gap-3 rounded-lg px-3
                    text-[--sidebar-foreground]
                    hover:bg-[--sidebar-accent] hover:text-[--sidebar-accent-foreground]
                    data-[state=open]:bg-[--sidebar-accent]
                    data-[state=open]:text-[--sidebar-accent-foreground]
                    transition-colors
                  "
                >
                  {/* Avatar — ring-bordered circle, ready for profile photo */}
                  <div className="
                    flex h-8 w-8 shrink-0 items-center justify-center
                    rounded-full overflow-hidden
                    bg-[--sidebar-primary]/20
                    text-xs font-bold text-[--sidebar-primary]
                    ring-2 ring-[--sidebar-primary]/40
                  ">
                    {user?.avatarPhoto
                      ? <img src={user.avatarPhoto} alt={user.name} className="h-full w-full object-cover" />
                      : user?.avatarInitials ?? "?"
                    }
                  </div>

                  {/* Name + role */}
                  <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-sm font-semibold leading-tight">
                      {user?.name ?? "Student"}
                    </span>
                    <span className="truncate text-[11px] leading-tight text-[--sidebar-foreground]/60">
                      Student
                    </span>
                  </div>

                  {/* Chevron */}
                  <ChevronsUpDown
                    size={14}
                    className="ml-auto shrink-0 text-[--sidebar-foreground]/50 group-data-[collapsible=icon]:hidden"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>

              {/* ── Dropdown panel ── */}
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-60 p-1.5"
              >
                {/* User info header — uses Tailwind semantic tokens for dark mode */}
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 rounded-md px-3 py-3">
                    {/* Avatar */}
                    <div className="
                      flex h-9 w-9 shrink-0 items-center justify-center
                      rounded-full
                      bg-[var(--bg-sidebar)] dark:bg-[var(--bg-sidebar)]
                      text-xs font-bold text-[var(--accent-gold)]
                      ring-2 ring-border
                    ">
                      {user?.avatarInitials ?? "?"}
                    </div>
                    {/* Name + role */}
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate text-sm font-semibold leading-tight text-foreground">
                        {user?.name ?? "Student"}
                      </span>
                      <span className="truncate text-xs leading-tight text-muted-foreground">
                        Student
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="my-1" />

                {/* My Profile */}
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

                {/* Log out */}
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