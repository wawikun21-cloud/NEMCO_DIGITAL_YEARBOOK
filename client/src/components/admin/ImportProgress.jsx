import { cn } from "@/lib/utils"

function Progress({ value = 0, className }) {
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]", className)}
    >
      <div
        className="h-full rounded-full bg-[var(--navy)] transition-[width] duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value || 0))}%` }}
      />
    </div>
  )
}

export { Progress }

export default function ImportProgress({ progress, status }) {
  const getStatusText = () => {
    switch (status) {
      case "processing": return "Processing import..."
      case "completed": return "Import complete!"
      case "completed_with_errors": return "Import completed with errors"
      case "failed": return "Import failed"
      default: return "Preparing..."
    }
  }

  return (
    <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {getStatusText()}
        </span>
        <span className="text-sm text-[var(--text-muted)]">
          {progress}%
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )
}