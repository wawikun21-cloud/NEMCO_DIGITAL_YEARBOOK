import { cn } from "@/lib/utils"

function Badge({
  className,
  variant = "default",
  ...props
}) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(
        "inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0",
        "bg-[var(--bg-subtle)] text-[var(--text-secondary)]",
        variant === "admin" && "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]",
        variant === "user" && "bg-[var(--bg-surface)] text-[var(--text-secondary)]",
        "transition-colors",
        className
      )}
      {...props} />
  );
}

export { Badge }