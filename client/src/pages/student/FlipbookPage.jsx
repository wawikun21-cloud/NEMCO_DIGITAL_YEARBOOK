import { useState, useEffect, useRef, useCallback } from "react"
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPublicFlipbook } from "@/services/flipbookService"
import PdfFlipbookViewer from "@/components/student/PdfFlipbookViewer"

function FlipbookPage({ profile, layoutTemplate, pageNumber, totalPages, isLeft }) {
  if (!profile) return null

  const displayName = profile.display_name || profile.full_name || "Unknown"
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <div
      className={`absolute inset-0 backface-hidden ${
        isLeft ? "" : "rotate-y-180"
      }`}
      style={{
        backfaceVisibility: "hidden",
        transform: isLeft ? "none" : "rotateY(180deg)",
        backgroundColor: "var(--bg-surface)",
        borderRight: isLeft ? "1px solid var(--border-light)" : "none",
        borderLeft: !isLeft ? "1px solid var(--border-light)" : "none",
      }}
    >
      <div className={`flex h-full flex-col ${layoutTemplate === "photo-left" ? "flex-row" : "flex-col"}`}>
        <div
          className={`${
            layoutTemplate === "photo-left"
              ? "w-2/5 h-full"
              : layoutTemplate === "photo-right"
              ? "hidden"
              : "w-full h-1/2"
          } flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/5 to-[var(--bg-primary)]/10 p-6`}
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-32 w-32 rounded-full object-cover ring-4 ring-white/50 dark:ring-white/10 shadow-lg sm:h-40 sm:w-40"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[var(--bg-primary)]/20 text-4xl font-bold text-[var(--bg-primary)] ring-4 ring-white/50 dark:ring-white/10 shadow-lg sm:h-40 sm:w-40 sm:text-5xl">
              {initials}
            </div>
          )}
        </div>

        <div className={`flex flex-1 flex-col justify-center p-6 sm:p-8 ${layoutTemplate === "photo-left" ? "w-3/5" : "w-full"}`}>
          <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">{displayName}</h2>

          {profile.student_number && (
            <p className="mt-1 text-xs font-medium text-[var(--text-muted)]">{profile.student_number}</p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            {profile.course_or_strand && (
              <span className="rounded-full bg-[var(--bg-primary)]/10 px-3 py-1 text-xs font-medium text-[var(--bg-primary)]">
                {profile.course_or_strand}
              </span>
            )}
            {profile.year_level && (
              <span className="rounded-full bg-[var(--bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                {profile.year_level}
              </span>
            )}
            {profile.section && (
              <span className="rounded-full bg-[var(--bg-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                {profile.section}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-4">{profile.bio}</p>
          )}

          {profile.quote && (
            <blockquote className="mt-4 border-l-2 border-[var(--bg-primary)] pl-3 text-sm italic text-[var(--text-muted)]">
              &ldquo;{profile.quote}&rdquo;
            </blockquote>
          )}

          <div className="mt-auto pt-4 text-center">
            <span className="text-[10px] text-[var(--text-muted)]">
              {pageNumber} / {totalPages}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function FlipbookCover({ title, subtitle }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/80 p-8 text-center"
      style={{ backfaceVisibility: "hidden" }}
    >
      <BookMarked size={48} className="mb-4 text-white/80" />
      <h1 className="text-2xl font-extrabold text-white sm:text-3xl">{title || "NEMCO Digital Yearbook"}</h1>
      {subtitle && (
        <p className="mt-2 text-sm text-white/70">{subtitle}</p>
      )}
      <div className="mt-6 rounded-full bg-white/20 px-4 py-1.5 text-xs font-medium text-white/90">
        Click arrows or use keyboard to flip pages
      </div>
    </div>
  )
}

export default function FlipbookPage_() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [viewMode, setViewMode] = useState("profiles")
  const containerRef = useRef(null)

  const flipSpeed = data?.settings?.flip_speed || 0.5

  useEffect(() => {
    getPublicFlipbook()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const profiles = (data?.profiles || []).filter((p) => p.profile)
  const pdfPages = data?.pdfPages || []
  const totalPages = profiles.length + 1

  const hasPdfPages = pdfPages.length > 0
  const hasProfiles = profiles.length > 0

  const filteredProfiles = search
    ? profiles.filter((p) => {
        const s = search.toLowerCase()
        const prof = p.profile
        return (
          (prof.display_name || "").toLowerCase().includes(s) ||
          (prof.full_name || "").toLowerCase().includes(s) ||
          (prof.student_number || "").toLowerCase().includes(s) ||
          (prof.course_or_strand || "").toLowerCase().includes(s) ||
          (p.section_name || "").toLowerCase().includes(s)
        )
      })
    : profiles

  const goToPage = useCallback(
    (pageIndex) => {
      if (isFlipping) return
      if (pageIndex < 0 || pageIndex >= totalPages) return

      setIsFlipping(true)

      setTimeout(() => {
        setCurrentPage(pageIndex)
        setIsFlipping(false)
      }, flipSpeed * 1000)
    },
    [totalPages, isFlipping, flipSpeed]
  )

  const goNext = useCallback(() => goToPage(currentPage + 1), [goToPage, currentPage])
  const goPrev = useCallback(() => goToPage(currentPage - 1), [goToPage, currentPage])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== "profiles") return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "Escape") {
        setSearchOpen(false)
        setSearch("")
      } else if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev, viewMode])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--bg-primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading flipbook…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={32} className="text-red-500" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Failed to load flipbook</p>
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
        </div>
      </div>
    )
  }

  if (!data?.settings?.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <BookMarked size={32} className="text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Flipbook is not available</p>
          <p className="text-xs text-[var(--text-muted)]">The digital yearbook has not been published yet.</p>
        </div>
      </div>
    )
  }

  const currentProfile = currentPage > 0 ? filteredProfiles[currentPage - 1] : null

  const renderProfilesView = () => (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border-light)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <BookMarked size={20} className="text-[var(--bg-primary)]" />
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {data.settings.title || "NEMCO Digital Yearbook"}
              </h1>
              {data.settings.subtitle && (
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">{data.settings.subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {searchOpen ? (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input
                  type="text"
                  placeholder="Search students…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 w-48 pl-9 pr-8 text-sm"
                  autoFocus
                />
                <button
                  onClick={() => { setSearchOpen(false); setSearch("") }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <Button variant="ghost" size="icon-sm" className="h-8 w-8" onClick={() => setSearchOpen(true)} title="Search (Ctrl+K)">
                <Search size={16} />
              </Button>
            )}

            <span className="text-xs text-[var(--text-muted)]">
              {currentPage === 0 ? "Cover" : `${currentPage} / ${filteredProfiles.length}`}
            </span>
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8" ref={containerRef}>
        <div
          className="relative w-full max-w-2xl"
          style={{
            perspective: "2000px",
            aspectRatio: "3/2",
          }}
        >
          <div
            className="relative h-full w-full rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] shadow-2xl"
            style={{
              transformStyle: "preserve-3d",
              transition: `transform ${flipSpeed}s ease-in-out`,
            }}
          >
            {currentPage === 0 ? (
              <FlipbookCover title={data.settings.title} subtitle={data.settings.subtitle} />
            ) : currentProfile ? (
              <FlipbookPage
                profile={currentProfile.profile}
                layoutTemplate={currentProfile.layout_template}
                pageNumber={currentPage}
                totalPages={filteredProfiles.length}
                isLeft={true}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-[var(--text-muted)]">Page not found</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            disabled={currentPage <= 0 || isFlipping}
            className="h-10 w-10 rounded-full"
          >
            <ChevronLeft size={20} />
          </Button>

          <div className="flex items-center gap-1.5">
            {filteredProfiles.slice(Math.max(0, currentPage - 3), currentPage + 4).map((_, i) => {
              const actualIndex = Math.max(0, currentPage - 3) + i
              const pageNum = actualIndex + 1
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  disabled={isFlipping}
                  className={`h-2 rounded-full transition-all ${
                    pageNum === currentPage
                      ? "w-6 bg-[var(--bg-primary)]"
                      : "w-2 bg-[var(--border-light)] hover:bg-[var(--text-muted)]"
                  }`}
                />
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            disabled={currentPage >= filteredProfiles.length || isFlipping}
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight size={20} />
          </Button>
        </div>

        <p className="mt-3 text-[10px] text-[var(--text-muted)]">
          Use arrow keys or click buttons to navigate • Ctrl+K to search
        </p>
      </div>

      {search && filteredProfiles.length === 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-3 text-center">
          <p className="text-sm text-[var(--text-muted)]">No students found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )

  const renderPdfView = () => (
    <div className="flex min-h-screen flex-col bg-[var(--bg-page)]">
      <header className="sticky top-0 z-20 border-b border-[var(--border-light)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <FileText size={20} className="text-[var(--bg-primary)]" />
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {data.settings.title || "NEMCO Digital Yearbook"}
              </h1>
              {data.settings.subtitle && (
                <p className="text-[10px] text-[var(--text-muted)] leading-tight">{data.settings.subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <PdfFlipbookViewer pdfPages={pdfPages} settings={data.settings} />
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[var(--bg-primary)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading flipbook…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertTriangle size={32} className="text-red-500" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Failed to load flipbook</p>
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
        </div>
      </div>
    )
  }

  if (!data?.settings?.enabled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
        <div className="flex flex-col items-center gap-3 text-center">
          <BookMarked size={32} className="text-[var(--text-muted)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Flipbook is not available</p>
          <p className="text-xs text-[var(--text-muted)]">The digital yearbook has not been published yet.</p>
        </div>
      </div>
    )
  }

  if (hasPdfPages && hasProfiles) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-page)]">
        <header className="sticky top-0 z-20 border-b border-[var(--border-light)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <BookMarked size={20} className="text-[var(--bg-primary)]" />
              <div>
                <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                  {data.settings.title || "NEMCO Digital Yearbook"}
                </h1>
                {data.settings.subtitle && (
                  <p className="text-[10px] text-[var(--text-muted)] leading-tight">{data.settings.subtitle}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "profiles" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("profiles")}
                className="gap-2"
              >
                <BookMarked size={14} />
                <span className="hidden sm:inline">Students</span>
              </Button>
              <Button
                variant={viewMode === "pdfs" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("pdfs")}
                className="gap-2"
              >
                <FileText size={14} />
                <span className="hidden sm:inline">PDF Pages</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1">
          {viewMode === "profiles" ? renderProfilesView() : renderPdfView()}
        </div>
      </div>
    )
  }

  if (hasPdfPages) {
    return renderPdfView()
  }

  return renderProfilesView()
}
