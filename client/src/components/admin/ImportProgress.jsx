import { cn } from "@/lib/utils"

function Progress({ value = 0, className }) {
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]", className)}
    >
      <div
        className="h-full w-full flex-1 bg-[var(--bg-primary)] transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
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