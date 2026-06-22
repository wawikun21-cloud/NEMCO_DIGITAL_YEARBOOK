import { useState, useEffect, useRef, useCallback, forwardRef } from "react"
import HTMLFlipBook from "react-pageflip"
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Loader2,
  AlertTriangle,
  FileText,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Grid3X3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPublicFlipbook } from "@/services/flipbookService"
import PdfFlipbookViewer from "@/components/student/PdfFlipbookViewer"

function ProfilePageContent({ profile, layoutTemplate, pageNumber, totalPages }) {
  if (!profile) return null

  const displayName = profile.display_name || profile.full_name || "Unknown"
  const initials = displayName.charAt(0).toUpperCase()

  return (
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
  )
}

const FlipbookCover = forwardRef(function FlipbookCover({ title, subtitle, onClick }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#132F45] to-[#0d1f33] p-6 text-center relative" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"><BookMarked size={36} className="text-[var(--accent-gold)]" /></div>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight leading-tight">{title || "NEMCO Digital Yearbook"}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/60 font-light">{subtitle}</p>}
      </div>
    </div>
  )
})

const FlipbookBackCover = forwardRef(function FlipbookBackCover({ title }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0d1f33] via-[#132F45] to-[#1a3a5c] p-6 text-center">
      <BookMarked size={32} className="mb-3 text-[var(--accent-gold)]/60" />
      <p className="text-lg font-bold text-white/80">{title || "NEMCO"}</p>
      <p className="mt-1 text-xs text-white/40">Digital Yearbook</p>
    </div>
  )
})

const StudentPage = forwardRef(function StudentPage({ profile, pageNum, totalPages }, ref) {
  if (!profile) return <div ref={ref} className="flex h-full w-full items-center justify-center bg-white" />
  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()
  return (
    <div ref={ref} className="flex h-full w-full flex-col bg-white p-5 sm:p-6">
      <div className="flex flex-1 flex-col items-center">
        <div className="w-full h-1 rounded-full bg-gradient-to-r from-transparent via-[var(--bg-primary)]/20 to-transparent mb-4" />
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--bg-primary)]/10 shadow-lg sm:h-32 sm:w-32" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--bg-primary)]/10 to-[var(--bg-primary)]/20 text-4xl font-bold text-[var(--bg-primary)] ring-4 ring-[var(--bg-primary)]/10 shadow-lg sm:h-32 sm:w-32 sm:text-5xl">{initial}</div>
        )}
        <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)] sm:text-xl">{name}</h2>
        {profile.student_number && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{profile.student_number}</p>}
        <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
          {profile.course_or_strand && <span className="rounded-full bg-[var(--bg-primary)]/8 px-2.5 py-0.5 text-[10px] font-medium text-[var(--bg-primary)]">{profile.course_or_strand}</span>}
          {profile.year_level && <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{profile.year_level}</span>}
          {profile.section && <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{profile.section}</span>}
        </div>
        <div className="mt-3 flex-1 overflow-y-auto styled-scroll min-h-0">
          {profile.bio && <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] text-center max-w-xs px-2">{profile.bio}</p>}
          {profile.quote && <blockquote className="mt-3 border-l-2 border-[var(--bg-primary)]/40 pl-2.5 text-[11px] italic text-[var(--text-muted)] max-w-xs text-center">"{profile.quote}"</blockquote>}
        </div>
      </div>
      <div className="text-center pt-2"><span className="text-[9px] text-[var(--text-muted)]/50">{pageNum} / {totalPages}</span></div>
    </div>
  )
})

function PageThumbnails({ pages, currentPage, onSelect }) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector(`[data-page="${currentPage}"]`)
      if (active) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [currentPage])

  return (
    <div ref={scrollRef} className="flex gap-2 overflow-x-auto py-2 px-1 styled-scroll">
      {pages.map((page, index) => (
        <button
          key={index}
          data-page={index}
          onClick={() => onSelect(index)}
          className={`shrink-0 rounded border-2 transition-all text-left ${
            index === currentPage
              ? "border-[var(--bg-primary)] shadow-md scale-105"
              : "border-transparent hover:border-[var(--bg-primary)]/40 opacity-60 hover:opacity-100"
          }`}
          style={{ width: "56px", aspectRatio: "3/4" }}
        >
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-subtle)] rounded-sm overflow-hidden">
            {index === 0 ? (
              <BookMarked size={16} className="text-[var(--bg-primary)]" />
            ) : page?.profile ? (
              <div className="flex h-full w-full flex-col items-center justify-center p-1">
                {page.profile.avatar_url ? (
                  <img src={page.profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-primary)]/20 text-[10px] font-bold text-[var(--bg-primary)]">
                    {(page.profile.display_name || page.profile.full_name || "?").charAt(0)}
                  </div>
                )}
                <p className="mt-0.5 w-full truncate text-center text-[7px] text-[var(--text-muted)]">
                  {(page.profile.display_name || page.profile.full_name || "").split(" ")[0]}
                </p>
              </div>
            ) : (
              <span className="text-[9px] text-gray-400">{index}</span>
            )}
          </div>
        </button>
      ))}
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
  const [contentView, setContentView] = useState("auto")
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isFlipping, setIsFlipping] = useState(false)
  const [bookState, setBookState] = useState("read")
  const containerRef = useRef(null)
  const bookRef = useRef(null)
  const touchStartRef = useRef(null)

  const flipSpeed = data?.settings?.flip_speed || 0.6

  useEffect(() => {
    getPublicFlipbook()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const sourceType = data?.sourceType || "profiles"
  const profiles = (data?.profiles || []).filter((p) => p.profile)
  const pdfPages = (data?.pdfPages || [])

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

  const showProfiles = sourceType === "profiles" || sourceType === "combined"
  const showPdfs = sourceType === "pdfs" || sourceType === "combined"
  const hasProfiles = showProfiles && filteredProfiles.length > 0
  const hasPdfs = showPdfs && pdfPages.length > 0

  const effectiveView =
    contentView === "auto"
      ? hasPdfs && !hasProfiles
        ? "pdfs"
        : "profiles"
      : contentView

  const totalPages = filteredProfiles.length + 2

  const goToPage = useCallback(
    (pageIndex) => {
      if (isFlipping) return
      if (pageIndex < 0 || pageIndex >= totalPages) return
      if (!bookRef.current) return

      const pf = bookRef.current.pageFlip()
      if (!pf) return

      setIsFlipping(true)
      pf.flip(pageIndex)
    },
    [totalPages, isFlipping]
  )

  const goNext = useCallback(() => {
    if (!bookRef.current) return
    const pf = bookRef.current.pageFlip()
    if (!pf) return
    setIsFlipping(true)
    pf.flipNext()
  }, [])

  const goPrev = useCallback(() => {
    if (!bookRef.current) return
    const pf = bookRef.current.pageFlip()
    if (!pf) return
    setIsFlipping(true)
    pf.flipPrev()
  }, [])

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data)
    setIsFlipping(false)
  }, [])

  const onChangeState = useCallback((e) => {
    setBookState(e.data)
    if (e.data === "read") {
      setIsFlipping(false)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (effectiveView !== "profiles") return
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
  }, [goNext, goPrev, effectiveView])

  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current) return
    const delta = e.changedTouches[0].clientX - touchStartRef.current
    if (Math.abs(delta) > 50) {
      if (delta < 0) goNext()
      else goPrev()
    }
    touchStartRef.current = null
  }, [goNext, goPrev])

  const handleCoverClick = useCallback(() => {
    if (currentPage === 0 && bookState === "read" && !isFlipping) {
      goNext()
    }
  }, [currentPage, bookState, goNext, isFlipping])

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

  if (effectiveView === "pdfs" && hasPdfs) {
    return (
      <div className="flex min-h-screen flex-col bg-[var(--bg-page)]">
        <header className="sticky top-0 z-20 border-b border-[var(--border-light)] bg-[var(--bg-surface)]/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
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
              {hasProfiles && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentView("profiles")}
                  className="gap-1 text-xs"
                >
                  <Users size={12} />
                  <span className="hidden sm:inline">Students</span>
                </Button>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                PDF Flipbook • {pdfPages.length} document{pdfPages.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          <PdfFlipbookViewer pdfPages={pdfPages} settings={data.settings} />
        </div>
      </div>
    )
  }

  if (effectiveView === "profiles" && hasProfiles) {
    return (
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

              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8"
                onClick={() => setShowThumbnails(!showThumbnails)}
                title="Toggle page thumbnails"
              >
                <Grid3X3 size={14} />
              </Button>

              {hasPdfs && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentView("pdfs")}
                  className="gap-1 text-xs"
                >
                  <FileText size={12} />
                  <span className="hidden sm:inline">PDFs</span>
                </Button>
              )}

              <span className="text-xs text-[var(--text-muted)]">
                {currentPage === 0 ? "Cover" : `${currentPage} / ${totalPages - 1}`}
              </span>
            </div>
          </div>
        </header>

        {showThumbnails && (
          <div className="border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-2">
            <div className="mx-auto max-w-4xl">
              <PageThumbnails
                pages={[{ isCover: true }, ...filteredProfiles]}
                currentPage={currentPage}
                onSelect={(idx) => goToPage(idx)}
              />
            </div>
          </div>
        )}

        <div
          className="flex flex-1 flex-col items-center justify-center px-4 py-8"
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative transition-transform duration-200"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
            }}
          >
            <HTMLFlipBook
              key={totalPages}
              ref={bookRef}
              width={300}
              height={400}
              size="stretch"
              minWidth={250}
              maxWidth={500}
              minHeight={350}
              maxHeight={600}
              showCover={true}
              drawShadow={true}
              maxShadowOpacity={0.5}
              flippingTime={Math.round(flipSpeed * 1000)}
              usePortrait={true}
              startPage={0}
              clickEventForward={true}
              mobileScrollSupport={true}
              useMouseEvents={true}
              showPageCorners={true}
              disableFlipByClick={false}
              swipeDistance={30}
              autoSize={true}
              onFlip={onFlip}
              onChangeState={onChangeState}
              className="mx-auto"
              style={{ maxWidth: "100%" }}
            >
              <FlipbookCover
                title={data.settings.title}
                subtitle={data.settings.subtitle}
                onClick={handleCoverClick}
              />

              {filteredProfiles.map((fp, index) => (
                <StudentPage
                  key={fp.id}
                  profile={fp.profile}
                  pageNum={index + 1}
                  totalPages={totalPages - 2}
                />
              ))}

              <FlipbookBackCover title={data.settings.title} />
            </HTMLFlipBook>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              disabled={currentPage <= 0 || isFlipping}
              className="h-10 w-10 rounded-full shadow-md"
            >
              <ChevronLeft size={20} />
            </Button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => {
                let pageNum
                if (totalPages <= 9) {
                  pageNum = i
                } else {
                  const start = Math.max(0, Math.min(currentPage - 4, totalPages - 9))
                  pageNum = start + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    disabled={isFlipping}
                    title={pageNum === 0 ? "Cover" : `Page ${pageNum}`}
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
              disabled={currentPage >= totalPages - 1 || isFlipping}
              className="h-10 w-10 rounded-full shadow-md"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.6))} className="h-8 w-8">
              <ZoomOut size={14} />
            </Button>
            <span className="text-[10px] text-[var(--text-muted)] w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="h-8 w-8">
              <ZoomIn size={14} />
            </Button>
          </div>

          <p className="mt-2 text-[10px] text-[var(--text-muted)]">
            Use arrow keys or swipe to navigate • Ctrl+K to search
          </p>
        </div>

        {search && filteredProfiles.length === 0 && (
          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-3 text-center">
            <p className="text-sm text-[var(--text-muted)]">No students found matching &ldquo;{search}&rdquo;</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <BookMarked size={32} className="text-[var(--text-muted)]" />
        <p className="text-sm font-medium text-[var(--text-primary)]">No content available</p>
        <p className="text-xs text-[var(--text-muted)]">Add student profiles or PDF pages to the flipbook.</p>
      </div>
    </div>
  )
}

