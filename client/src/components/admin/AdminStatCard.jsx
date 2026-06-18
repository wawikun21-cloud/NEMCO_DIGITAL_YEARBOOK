import { cn } from "@/lib/utils"

/**
 * AdminStatCard
 * Reusable stat card for admin dashboard metrics.
 *
 * Props:
 *  - label: string
 *  - value: string | number
 *  - icon: LucideIcon component
 *  - trend?: { value: string; positive: boolean }
 *  - iconBg?: string (Tailwind classes)
 *  - iconColor?: string (Tailwind classes)
 */
export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  trend,
  iconBg = "bg-[var(--bg-subtle)]",
  iconColor = "text-[var(--text-secondary)]",
}) {
  return (
    <div
      className={cn(
        "group flex flex-col gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-3.5 shadow-sm sm:p-5",
        "transition-shadow duration-200 hover:shadow-md animate-fade-in-up"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl">
            {value}
          </p>
          {/* Always rendered — invisible spacer when no trend, keeps all cards the same height */}
          <p
            className={cn(
              "mt-1 text-xs font-medium",
              trend
                ? trend.positive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
                : "invisible select-none"
            )}
          >
            {trend ? `${trend.positive ? "↑" : "↓"} ${trend.value}` : "—"}
          </p>
        </div>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 sm:h-11 sm:w-11",
            iconBg,
            iconColor
          )}
        >
          <Icon size={22} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  )
}