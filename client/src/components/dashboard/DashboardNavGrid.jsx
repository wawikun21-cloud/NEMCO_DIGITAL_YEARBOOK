import { BookOpen, User, FileText } from "lucide-react"
import DashboardNavCard from "./DashboardNavCard"

/**
 * DashboardNavGrid
 * Renders the 3-card feature grid.
 *
 * Props:
 *  - onLibrary:  () => void
 *  - onProfile:  () => void
 *  - onResume:   () => void
 */
export default function DashboardNavGrid({ onLibrary, onProfile, onResume }) {
  const cards = [
    {
      id: "library",
      icon: <BookOpen size={28} strokeWidth={1.8} />,
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      title: "Library",
      description: "Access your digital flipbooks and learning materials.",
      buttonLabel: "Go to Library",
      buttonIcon: <BookOpen size={15} />,
      onClick: onLibrary,
    },
    {
      id: "profile",
      icon: <User size={28} strokeWidth={1.8} />,
      iconBg: "bg-sky-100 dark:bg-sky-900/30",
      iconColor: "text-sky-500 dark:text-sky-400",
      title: "My Profile",
      description: "View and edit your personal information and account details.",
      buttonLabel: "Go to Profile",
      buttonIcon: <User size={15} />,
      onClick: onProfile,
    },
    {
      id: "resume",
      icon: <FileText size={28} strokeWidth={1.8} />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      title: "Resume Builder",
      description: "Create, customize and download your professional resume.",
      buttonLabel: "Build Resume",
      buttonIcon: <FileText size={15} />,
      onClick: onResume,
    },
  ]

  return (
    <section aria-label="Quick access" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ id, ...props }) => (
        <DashboardNavCard key={id} {...props} />
      ))}
    </section>
  )
}
