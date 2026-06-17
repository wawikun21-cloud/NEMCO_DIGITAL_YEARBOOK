import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useTheme } from "@/hooks/useTheme"

/**
 * DashboardTopbar  (updated — includes SidebarTrigger)
 *
 * Props: none
 */
export default function DashboardTopbar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center border-b border-[var(--border-light)] bg-[var(--bg-topbar)] shadow-[var(--shadow-sm)]">
      <div className="flex h-full w-full items-center gap-2 px-3 sm:px-5">

        {/* Sidebar hamburger — visible on mobile/tablet */}
        <SidebarTrigger className="shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" />

        {/* Divider */}
        <div className="h-5 w-px bg-[var(--border-light)] md:hidden" />

        {/* Page title */}
        <span className="truncate text-sm font-semibold text-[var(--text-primary)] md:hidden">
          NEMCO Digital Yearbook
        </span>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="border-[var(--border)] text-[var(--text-secondary)]"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </Button>
      </div>
    </header>
  )
}
