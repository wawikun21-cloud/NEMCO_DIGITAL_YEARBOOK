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

function FlipbookCover3D({ title, subtitle, onClick }) {
  return (
    <div
      className="absolute inset-0 cursor-pointer"
      style={{ backfaceVisibility: "hidden" }}
      onClick={onClick}
    >
      <div
        className="h-full w-full rounded-r-sm bg-gradient-to-br from-[var(--bg-primary)] via-[var(--bg-primary)]/90 to-[var(--bg-primary)]/70 p-8 text-center flex flex-col items-center justify-center"
        style={{
          boxShadow: "4px 0 16px rgba(0,0,0,0.15), inset -4px 0 8px rgba(0,0,0,0.1)",
        }}
      >
        <div className="mb-6 rounded-full bg-white/10 p-4 backdrop-blur-sm">
          <BookMarked size={48} className="text-white/90" />
        </div>
        <h1 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">{title || "NEMCO Digital Yearbook"}</h1>
        {subtitle && (
          <p className="mt-3 text-base text-white/70 font-light">{subtitle}</p>
        )}
        <div className="mt-8 flex items-center gap-2 rounded-full bg-white/15 px-5 py-2 text-sm font-medium text-white/90 backdrop-blur-sm">
          <BookOpen size={16} />
          Click to open
        </div>
        <div className="mt-6 h-0.5 w-24 rounded-full bg-white/30" />
      </div>
    </div>
  )
}

function Page3DSheet({
  children,
  pageIndex,
  currentPage,
  totalSheets,
  isFlipping,
  flipDirection,
  flipSpeed,
  isCover,
}) {
  const isFlipped = pageIndex < currentPage
  const isCurrent = pageIndex === currentPage
  const isTurning = isFlipping && (isCurrent || pageIndex === currentPage - 1)

  const getTransform = () => {
    if (isTurning) {
      return flipDirection === "next" ? "rotateY(-180deg)" : "rotateY(0deg)"
    }
    return isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)"
  }

  const getZIndex = () => {
    if (isTurning) return totalSheets + 10
    if (isFlipped) return pageIndex
    return totalSheets - pageIndex
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
        transform: getTransform(),
        transition: isTurning ? `transform ${flipSpeed}s cubic-bezier(0.645, 0.045, 0.355, 1)` : "none",
        zIndex: getZIndex(),
      }}
    >
      <div
        className="absolute inset-0 bg-white overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          borderRadius: isCover ? "4px 8px 8px 4px" : "2px 6px 6px 2px",
          boxShadow: isCover
            ? "4px 0 16px rgba(0,0,0,0.15), inset -4px 0 8px rgba(0,0,0,0.08)"
            : "2px 0 10px rgba(0,0,0,0.08), inset -3px 0 6px rgba(0,0,0,0.04)",
        }}
      >
        {children}
      </div>

      <div
        className="absolute inset-0 bg-[#fafafa] overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderRadius: "6px 2px 2px 6px",
          boxShadow: "-2px 0 10px rgba(0,0,0,0.08), inset 3px 0 6px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-[90%] w-[90%] rounded border border-dashed border-gray-200" />
        </div>
      </div>
    </div>
  )
}

function BookSpine3D() {
  return (
    <div
      className="absolute left-0 top-0 h-full"
      style={{
        width: "14px",
        transform: "translateX(-7px)",
        zIndex: 9999,
        background: "linear-gradient(90deg, #374151 0%, #4b5563 30%, #6b7280 50%, #4b5563 70%, #374151 100%)",
        borderRadius: "3px 0 0 3px",
        boxShadow: "inset -2px 0 6px rgba(0,0,0,0.4), -3px 0 10px rgba(0,0,0,0.25)",
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 30%, rgba(0,0,0,0.15) 100%)",
          borderRadius: "3px 0 0 3px",
        }}
      />
    </div>
  )
}

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
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState(null)
  const [contentView, setContentView] = useState("auto")
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)
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

  const totalSheets = hasProfiles ? filteredProfiles.length + 1 : 0

  const goToPage = useCallback(
    (pageIndex, direction) => {
      if (isFlipping) return
      if (pageIndex < 0 || pageIndex >= totalSheets) return

      setIsFlipping(true)
      setFlipDirection(direction)

      setTimeout(() => {
        setCurrentPage(pageIndex)
        setIsFlipping(false)
        setFlipDirection(null)
      }, flipSpeed * 1000)
    },
    [totalSheets, isFlipping, flipSpeed]
  )

  const goNext = useCallback(() => {
    if (currentPage < totalSheets - 1) {
      goToPage(currentPage + 1, "next")
    }
  }, [currentPage, totalSheets, goToPage])

  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      goToPage(currentPage - 1, "prev")
    }
  }, [currentPage, goToPage])

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
                {currentPage === 0 ? "Cover" : `${currentPage} / ${totalSheets - 1}`}
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
                onSelect={(idx) => goToPage(idx, idx > currentPage ? "next" : "prev")}
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
               perspective: "300px",
               perspectiveOrigin: "50% 50%",
               height: "min(80vh, 1.5 * 80vw)",
               aspectRatio: "3/2",
               transform: `scale(${zoom})`,
               transformOrigin: "center center",
             }}
           >
            <div className="relative h-full w-full rounded-lg" style={{ transformStyle: "preserve-3d" }}>
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300"
                style={{
                  transform: "translateZ(-3px)",
                  boxShadow: "0 0 30px rgba(0,0,0,0.15)",
                }}
              />

              <BookSpine3D />

              <Page3DSheet
                pageIndex={0}
                currentPage={currentPage}
                totalSheets={totalSheets}
                isFlipping={isFlipping}
                flipDirection={flipDirection}
                flipSpeed={flipSpeed}
                isCover={true}
              >
                <FlipbookCover3D
                  title={data.settings.title}
                  subtitle={data.settings.subtitle}
                  onClick={() => {
                    if (currentPage === 0 && !isFlipping) {
                      goNext()
                    }
                  }}
                />
              </Page3DSheet>

              {filteredProfiles.map((fp, index) => (
                <Page3DSheet
                  key={fp.id}
                  pageIndex={index + 1}
                  currentPage={currentPage}
                  totalSheets={totalSheets}
                  isFlipping={isFlipping}
                  flipDirection={flipDirection}
                  flipSpeed={flipSpeed}
                >
                  <ProfilePageContent
                    profile={fp.profile}
                    layoutTemplate={fp.layout_template}
                    pageNumber={index + 1}
                    totalPages={totalSheets - 1}
                  />
                </Page3DSheet>
              ))}
            </div>
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
              {Array.from({ length: Math.min(totalSheets, 9) }, (_, i) => {
                let pageNum
                if (totalSheets <= 9) {
                  pageNum = i
                } else {
                  const start = Math.max(0, Math.min(currentPage - 4, totalSheets - 9))
                  pageNum = start + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum, pageNum > currentPage ? "next" : "prev")}
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
              disabled={currentPage >= totalSheets - 1 || isFlipping}
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

function Users({ size }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
