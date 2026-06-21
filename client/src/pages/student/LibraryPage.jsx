import { BookOpen, BookMarked, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function LibraryPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          My Library
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Access your digital flipbooks and learning materials.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div
          role="button"
          tabIndex={0}
          onClick={() => { window.location.href = "/3d-yearbook" }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); window.location.href = "/3d-yearbook" } }}
          className="group flex flex-col items-center rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-6 text-center transition-all hover:border-[var(--bg-primary)]/30 hover:shadow-lg cursor-pointer"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-primary)]/10 transition-colors group-hover:bg-[var(--bg-primary)]/20">
            <BookMarked size={32} className="text-[var(--bg-primary)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">3D Yearbook</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Browse the interactive 3D flipbook
          </p>
          <Button size="sm" className="mt-4 gap-2" onClick={(e) => { e.stopPropagation(); window.location.href = "/3d-yearbook" }}>
            <BookOpen size={14} />
            Open Flipbook
          </Button>
        </div>

        <div className="flex flex-col items-center rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] p-6 text-center opacity-60">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-subtle)]">
            <FileText size={32} className="text-[var(--text-muted)]" />
          </div>
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Documents</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Coming soon
          </p>
        </div>
      </div>

      <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-muted)] sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Student Portal. All rights reserved.</span>
          <nav className="flex gap-4">
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Terms of Use</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Contact Us</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}
