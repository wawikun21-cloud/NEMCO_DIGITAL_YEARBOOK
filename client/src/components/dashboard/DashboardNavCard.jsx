import { Button } from "@/components/ui/button"

/**
 * DashboardNavCard
 * A single feature access card.
 *
 * Props:
 *  - icon: ReactNode       — lucide icon or any SVG element
 *  - iconBg: string        — tailwind bg class for the icon circle e.g. "bg-violet-100"
 *  - iconColor: string     — tailwind text class e.g. "text-violet-600"
 *  - title: string
 *  - description: string
 *  - buttonLabel: string
 *  - buttonIcon: ReactNode
 *  - onClick: () => void
 */
export default function DashboardNavCard({
  icon,
  iconBg = "bg-[var(--bg-subtle)]",
  iconColor = "text-[var(--bg-sidebar)]",
  title,
  description,
  buttonLabel,
  buttonIcon,
  onClick,
}) {
  return (
    <article
      className="group flex flex-col items-center gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-6 text-center shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)] sm:p-8 animate-fade-in-up animate-delay-100"
    >
      {/* Icon circle */}
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${iconBg} ${iconColor} transition-transform duration-200 group-hover:scale-105`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-1">
        <h2 className="text-base font-bold text-[var(--text-primary)] sm:text-lg">{title}</h2>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      </div>

      {/* CTA */}
      <Button
        size="default"
        onClick={onClick}
        className="mt-auto w-full gap-2 bg-[var(--bg-sidebar)] text-[var(--navy-foreground)] hover:bg-[var(--bg-sidebar)]/90"
      >
        {buttonIcon}
        {buttonLabel}
      </Button>
    </article>
  )
}
