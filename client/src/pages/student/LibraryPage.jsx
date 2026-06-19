import { BookOpen } from "lucide-react"

export default function LibraryPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Library
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Access your digital flipbooks and learning materials.
        </p>
      </div>

      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-8 text-center">
        <BookOpen size={64} className="mb-4 text-[var(--text-muted)]" />
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Your Library is Empty
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          No books or materials available yet. Check back later!
        </p>
      </div>

      <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-muted)] sm:flex-row">
          <span>© {new Date().getFullYear()} Student Portal. All rights reserved.</span>
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