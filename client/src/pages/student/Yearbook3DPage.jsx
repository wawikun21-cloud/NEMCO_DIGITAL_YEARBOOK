import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Grid3X3,
  BookOpen,
  Sparkles,
  Heart,
  GraduationCap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPublicFlipbook } from "@/services/flipbookService"

/* ─── Profile page content ─── */
function StudentPage({ profile, layoutTemplate, pageNum, totalPages }) {
  if (!profile) return null
  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className={`flex h-full w-full flex-col ${layoutTemplate === "photo-left" ? "flex-row" : "flex-col"}`}>
      <div
        className={`${
          layoutTemplate === "photo-left" ? "w-2/5 h-full" : "w-full h-1/2"
        } flex items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/5 to-[var(--bg-primary)]/10 p-4`}
      >
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-28 w-28 rounded-full object-cover ring-4 ring-white/60 shadow-lg sm:h-36 sm:w-36" />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[var(--bg-primary)]/15 text-4xl font-bold text-[var(--bg-primary)] ring-4 ring-white/60 shadow-lg sm:h-36 sm:w-36 sm:text-5xl">
            {initial}
          </div>
        )}
      </div>
      <div className={`flex flex-1 flex-col justify-center p-5 sm:p-7 ${layoutTemplate === "photo-left" ? "w-3/5" : "w-full"}`}>
        <h2 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl">{name}</h2>
        {profile.student_number && <p className="mt-1 text-xs text-[var(--text-muted)]">{profile.student_number}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.course_or_strand && (
            <span className="rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[var(--bg-primary)]">{profile.course_or_strand}</span>
          )}
          {profile.year_level && (
            <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{profile.year_level}</span>
          )}
          {profile.section && (
            <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{profile.section}</span>
          )}
        </div>
        {profile.bio && <p className="mt-3 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-4">{profile.bio}</p>}
        {profile.quote && (
          <blockquote className="mt-3 border-l-2 border-[var(--bg-primary)] pl-2.5 text-xs italic text-[var(--text-muted)]">
            &ldquo;{profile.quote}&rdquo;
          </blockquote>
        )}
        <div className="mt-auto pt-3 text-center">
          <span className="text-[9px] text-[var(--text-muted)]">{pageNum} / {totalPages}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Cover (front) ─── */
function BookCover({ title, subtitle, closable }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#132F45] to-[#0d1f33] p-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
          <GraduationCap size={36} className="text-[var(--accent-gold)]" />
        </div>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight leading-tight">{title || "NEMCO Digital Yearbook"}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/60 font-light">{subtitle}</p>}
        <div className="mt-5 flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm border border-white/10">
          <BookOpen size={14} />
          3D Interactive Flipbook
        </div>
      </div>
      {closable && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Back cover ─── */
function BackCover({ title }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0d1f33] via-[#132F45] to-[#1a3a5c] p-6 text-center">
      <Heart size={32} className="mb-3 text-[var(--accent-gold)]/60" />
      <p className="text-lg font-bold text-white/80">{title || "NEMCO"}</p>
      <p className="mt-1 text-xs text-white/40">Digital Yearbook</p>
      <div className="mt-4 h-px w-16 bg-white/10" />
      <p className="mt-4 text-[10px] text-white/30">Made with ❤ by NEMCO</p>
    </div>
  )
}

/* ─── Single 3D page (one "leaf" with front + back face) ─── */
function PageLeaf({ frontContent, backContent, pageIndex, currentPage, totalLeaves, isFlipping, flipDirection, flipSpeed, isCover: coverFlag }) {
  const isFlipped = pageIndex < currentPage
  const isTurning = isFlipping && (pageIndex === currentPage || pageIndex === currentPage - 1)

  const getTransform = () => {
    if (isTurning) return flipDirection === "next" ? "rotateY(-180deg)" : "rotateY(0deg)"
    return isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)"
  }

  const getZ = () => {
    if (isTurning) return totalLeaves + 10
    if (isFlipped) return pageIndex
    return totalLeaves - pageIndex
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
        transform: getTransform(),
        transition: isTurning ? `transform ${flipSpeed}s cubic-bezier(0.645, 0.045, 0.355, 1)` : "none",
        zIndex: getZ(),
      }}
    >
      {/* Front face */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          borderRadius: coverFlag ? "3px 6px 6px 3px" : "1px 5px 5px 1px",
          boxShadow: coverFlag
            ? "5px 0 20px rgba(0,0,0,0.18), inset -5px 0 10px rgba(0,0,0,0.06)"
            : "3px 0 12px rgba(0,0,0,0.06), inset -3px 0 6px rgba(0,0,0,0.03)",
          background: "#fff",
        }}
      >
        {frontContent}
        {/* Page edge thickness simulation */}
        <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gray-200 via-gray-100 to-gray-200" />
        {/* Subtle paper texture */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='6' height='6' viewBox='0 0 6 6' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M5 0h1L0 6V5zM6 5v1H5z'/%3E%3C/g%3E%3C/svg%3E\")" }} />
      </div>

      {/* Back face */}
      <div
        className="absolute inset-0 overflow-hidden bg-[#fefefe]"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          borderRadius: "5px 1px 1px 5px",
          boxShadow: "-3px 0 12px rgba(0,0,0,0.06), inset 3px 0 6px rgba(0,0,0,0.03)",
        }}
      >
        {backContent}
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-gray-200 via-gray-100 to-gray-200" />
      </div>
    </div>
  )
}

/* ─── Book spine ─── */
function Spine() {
  return (
    <div
      className="absolute left-0 top-[-2px] bottom-[-2px]"
      style={{
        width: "16px",
        transform: "translateX(-8px)",
        zIndex: 10000,
        background: "linear-gradient(90deg, #2d3748 0%, #4a5568 25%, #718096 50%, #4a5568 75%, #2d3748 100%)",
        borderRadius: "4px 0 0 4px",
        boxShadow: "inset -3px 0 8px rgba(0,0,0,0.5), -4px 0 14px rgba(0,0,0,0.3)",
      }}
    >
      <div className="absolute inset-0 rounded-l" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 20%, rgba(0,0,0,0.1) 100%)" }} />
      {/* Spine ridges */}
      <div className="absolute top-[15%] left-0 right-0 h-px bg-white/5" />
      <div className="absolute top-[85%] left-0 right-0 h-px bg-black/10" />
    </div>
  )
}

/* ─── Page thumbnails strip ─── */
function PageStrip({ pages, currentPage, onSelect }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      const el = ref.current.querySelector(`[data-p="${currentPage}"]`)
      el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
    }
  }, [currentPage])

  return (
    <div ref={ref} className="flex gap-1.5 overflow-x-auto py-2 px-3 styled-scroll">
      {pages.map((pg, i) => {
        const active = i === currentPage
        return (
          <button
            key={i}
            data-p={i}
            onClick={() => onSelect(i)}
            className={`shrink-0 rounded-md border-2 transition-all duration-200 ${
              active
                ? "border-[var(--accent-gold)] shadow-lg shadow-[var(--accent-gold)]/20 scale-110 z-10"
                : "border-white/20 hover:border-white/50 opacity-50 hover:opacity-90"
            }`}
            style={{ width: "48px", aspectRatio: "3/4" }}
          >
            <div className={`flex h-full w-full items-center justify-center rounded-sm overflow-hidden ${i === 0 ? "bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/70" : "bg-[var(--bg-surface)]"}`}>
              {i === 0 ? (
                <BookMarked size={12} className="text-white/80" />
              ) : pg?.profile ? (
                <div className="flex flex-col items-center gap-0.5">
                  {pg.profile.avatar_url ? (
                    <img src={pg.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-primary)]/20 text-[9px] font-bold text-[var(--bg-primary)]">
                      {(pg.profile.display_name || "?").charAt(0)}
                    </div>
                  )}
                  <p className="w-full truncate text-center text-[6px] text-[var(--text-muted)]">
                    {(pg.profile.display_name || "").split(" ")[0]}
                  </p>
                </div>
              ) : (
                <span className="text-[8px] text-gray-400">{i}</span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ─── Section divider page ─── */
function SectionPage({ name }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/3 via-white to-[var(--bg-primary)]/3 p-6">
      <div className="h-px w-16 bg-[var(--bg-primary)]/20 mb-4" />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]/8 mb-3">
        <Sparkles size={20} className="text-[var(--bg-primary)]" />
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{name}</h3>
      <div className="mt-2 h-0.5 w-12 rounded-full bg-[var(--accent-gold)]/40" />
      <div className="h-px w-16 bg-[var(--bg-primary)]/20 mt-4" />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function Yearbook3DPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState(null)
  const [showStrip, setShowStrip] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)
  const touchRef = useRef(null)

  const flipSpeed = data?.settings?.flip_speed || 0.7

  useEffect(() => {
    getPublicFlipbook().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const profiles = (data?.profiles || []).filter((p) => p.profile)
  const sections = useMemo(() => data?.sections || [], [data])

  const filtered = search
    ? profiles.filter((p) => {
        const q = search.toLowerCase()
        const pr = p.profile
        return (
          (pr.display_name || "").toLowerCase().includes(q) ||
          (pr.full_name || "").toLowerCase().includes(q) ||
          (pr.student_number || "").toLowerCase().includes(q) ||
          (pr.course_or_strand || "").toLowerCase().includes(q) ||
          (p.section_name || "").toLowerCase().includes(q)
        )
      })
    : profiles

  // Build page list: cover, then section dividers + student pages, then back cover
  const pageList = useMemo(() => {
    const secs = sections
    const pages = [{ type: "cover" }]

    if (secs.length > 0) {
      const sectionMap = new Map()
      const unsectioned = []
      for (const fp of filtered) {
        const sn = fp.section_name || ""
        if (sn) {
          if (!sectionMap.has(sn)) sectionMap.set(sn, [])
          sectionMap.get(sn).push(fp)
        } else {
          unsectioned.push(fp)
        }
      }
      for (const sec of secs) {
        pages.push({ type: "section", name: sec.name })
        const secProfiles = sectionMap.get(sec.name) || []
        for (const sp of secProfiles) pages.push({ type: "student", data: sp })
      }
      for (const up of unsectioned) pages.push({ type: "student", data: up })
    } else {
      for (const fp of filtered) pages.push({ type: "student", data: fp })
    }

    pages.push({ type: "back-cover" })
    return pages
  }, [filtered, sections])

  const totalLeaves = pageList.length

  const goTo = useCallback(
    (idx, dir) => {
      if (isFlipping || idx < 0 || idx >= totalLeaves) return
      setIsFlipping(true)
      setFlipDirection(dir)
      setTimeout(() => {
        setCurrentPage(idx)
        setIsFlipping(false)
        setFlipDirection(null)
      }, flipSpeed * 1000)
    },
    [totalLeaves, isFlipping, flipSpeed]
  )

  const goNext = useCallback(() => { if (currentPage < totalLeaves - 1) goTo(currentPage + 1, "next") }, [currentPage, totalLeaves, goTo])
  const goPrev = useCallback(() => { if (currentPage > 0) goTo(currentPage - 1, "prev") }, [currentPage, goTo])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goNext() }
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goPrev() }
      else if (e.key === "Escape") { setSearchOpen(false); setSearch(""); if (isFullscreen) document.exitFullscreen() }
      else if ((e.ctrlKey || e.metaKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true) }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goPrev, isFullscreen])

  // Fullscreen tracking
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  // Touch
  const onTouchStart = useCallback((e) => { touchRef.current = e.touches[0].clientX }, [])
  const onTouchEnd = useCallback((e) => {
    if (touchRef.current == null) return
    const d = e.changedTouches[0].clientX - touchRef.current
    if (Math.abs(d) > 50) { d < 0 ? goNext() : goPrev() }
    touchRef.current = null
  }, [goNext, goPrev])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  /* ─── Render page content ─── */
  function renderFront(page, idx) {
    if (page.type === "cover") return <BookCover title={data?.settings?.title} subtitle={data?.settings?.subtitle} closable />
    if (page.type === "back-cover") return <BackCover title={data?.settings?.title} />
    if (page.type === "section") return <SectionPage name={page.name} />
    if (page.type === "student") return <StudentPage profile={page.data.profile} layoutTemplate={page.data.layout_template} pageNum={idx} totalPages={totalLeaves - 2} />
    return null
  }

  function renderBack(page) {
    // Back of each page — show class notes, blank with watermark, or section continuation
    if (page.type === "student") {
      const pr = page.data.profile
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#fafafa] p-6 text-center">
          <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)]/5 flex items-center justify-center mb-3">
            <GraduationCap size={20} className="text-[var(--bg-primary)]/30" />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]/40 italic">&ldquo;{pr.motto || "The future belongs to those who believe in the beauty of their dreams."}&rdquo;</p>
          {pr.achievements && (
            <div className="mt-3 flex flex-wrap gap-1 justify-center">
              {(typeof pr.achievements === "string" ? pr.achievements.split(",") : []).slice(0, 3).map((a, i) => (
                <span key={i} className="rounded-full bg-[var(--accent-gold)]/10 px-2 py-0.5 text-[8px] font-medium text-[var(--accent-gold)]">{a.trim()}</span>
              ))}
            </div>
          )}
        </div>
      )
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#fafafa]">
        <div className="h-[85%] w-[85%] rounded border border-dashed border-gray-200/50" />
      </div>
    )
  }

  /* ─── Loading / error / disabled states ─── */
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0d1f33] to-[#132F45]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-gold)]/20" />
          <BookMarked size={40} className="relative text-[var(--accent-gold)] animate-pulse" />
        </div>
        <p className="text-sm text-white/60 font-light">Opening your yearbook…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><AlertTriangle size={32} className="mx-auto mb-2 text-red-500" /><p className="text-sm font-medium text-[var(--text-primary)]">Failed to load yearbook</p><p className="text-xs text-[var(--text-muted)]">{error}</p></div>
    </div>
  )

  if (!data?.settings?.enabled) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><BookMarked size={32} className="mx-auto mb-2 text-[var(--text-muted)]" /><p className="text-sm font-medium text-[var(--text-primary)]">Yearbook not available</p><p className="text-xs text-[var(--text-muted)]">The digital yearbook has not been published yet.</p></div>
    </div>
  )

  if (filtered.length === 0) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><BookOpen size={32} className="mx-auto mb-2 text-[var(--text-muted)]" /><p className="text-sm font-medium text-[var(--text-primary)]">No students in yearbook</p><p className="text-xs text-[var(--text-muted)]">Add student profiles to the yearbook to see them here.</p></div>
    </div>
  )

  /* ─── Main render ─── */
  const coverClosed = currentPage === 0

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-gradient-to-br from-amber-950/30 via-stone-900/50 to-slate-900/40 backdrop-blur-sm" : "min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-slate-100 dark:from-[#0d1b2a] dark:via-[#112233] dark:to-[#0d1b2a]"}`}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Ambient background ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[var(--accent-gold)]/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[var(--bg-primary)]/5 blur-3xl" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-black/5 bg-white/60 dark:bg-[#112233]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/70 shadow-lg shadow-[var(--bg-primary)]/20">
              <BookMarked size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{data.settings.title || "NEMCO Digital Yearbook"}</h1>
              {data.settings.subtitle && <p className="text-[10px] text-[var(--text-muted)] leading-tight">{data.settings.subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {searchOpen ? (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input type="text" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-44 pl-9 pr-8 text-xs" autoFocus />
                <button onClick={() => { setSearchOpen(false); setSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={14} /></button>
              </div>
            ) : (
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setSearchOpen(true)} title="Search (Ctrl+K)"><Search size={15} /></Button>
            )}
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setShowStrip(!showStrip)} title="Page thumbnails"><Grid3X3 size={15} /></Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={toggleFullscreen} title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </Button>
            <div className="ml-2 flex items-center gap-1.5 rounded-full bg-[var(--bg-primary)]/8 px-3 py-1">
              <div className={`h-1.5 w-1.5 rounded-full ${coverClosed ? "bg-amber-400 animate-pulse" : "bg-emerald-400"}`} />
              <span className="text-[10px] font-medium text-[var(--text-muted)]">
                {coverClosed ? "Cover" : `Page ${currentPage} / ${totalLeaves - 1}`}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Thumbnail strip ── */}
      {showStrip && (
        <div className="relative z-10 border-b border-black/5 bg-white/40 dark:bg-[#112233]/60 backdrop-blur-sm">
          <PageStrip pages={pageList} currentPage={currentPage} onSelect={(i) => goTo(i, i > currentPage ? "next" : "prev")} />
        </div>
      )}

      {/* ── 3D Book ── */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 overflow-hidden">
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            perspective: "2200px",
            perspectiveOrigin: "50% 50%",
            maxWidth: "820px",
            width: "100%",
            aspectRatio: "3/2",
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
          }}
        >
          <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
            {/* Table / desk surface */}
            <div
              className="absolute inset-x-[-5%] bottom-[-8%] h-[30%] rounded-[50%]"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0,0,0,0.06) 0%, transparent 70%)",
                filter: "blur(4px)",
                transform: "rotateX(60deg)",
              }}
            />

            {/* Book pages container */}
            {pageList.map((page, idx) => (
              <PageLeaf
                key={idx}
                frontContent={renderFront(page, idx)}
                backContent={renderBack(page)}
                pageIndex={idx}
                currentPage={currentPage}
                totalLeaves={totalLeaves}
                isFlipping={isFlipping}
                flipDirection={flipDirection}
                flipSpeed={flipSpeed}
                isCover={page.type === "cover"}
              />
            ))}

            {/* Spine */}
            <Spine />

            {/* Top shadow on book */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-black/5 to-transparent rounded-t-lg pointer-events-none" />
          </div>
        </div>

        {/* ── Navigation ── */}
        <div className="mt-6 flex items-center gap-5">
          <Button
            variant="outline"
            size="icon"
            onClick={goPrev}
            disabled={currentPage <= 0 || isFlipping}
            className="h-11 w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/80 dark:bg-[#112233]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#1a2e42]"
          >
            <ChevronLeft size={22} />
          </Button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalLeaves, 11) }, (_, i) => {
              let pn
              if (totalLeaves <= 11) pn = i
              else { const s = Math.max(0, Math.min(currentPage - 5, totalLeaves - 11)); pn = s + i }
              return (
                <button
                  key={pn}
                  onClick={() => goTo(pn, pn > currentPage ? "next" : "prev")}
                  disabled={isFlipping}
                  title={pn === 0 ? "Cover" : `Page ${pn}`}
                  className={`rounded-full transition-all duration-300 ${
                    pn === currentPage
                      ? "w-7 h-2.5 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/80 shadow-md shadow-[var(--accent-gold)]/30"
                      : pn === 0
                        ? "w-2.5 h-2.5 bg-[var(--bg-primary)]/30 hover:bg-[var(--bg-primary)]/50"
                        : "w-2.5 h-2.5 bg-black/10 hover:bg-black/20 dark:bg-white/15 dark:hover:bg-white/30"
                  }`}
                />
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goNext}
            disabled={currentPage >= totalLeaves - 1 || isFlipping}
            className="h-11 w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/80 dark:bg-[#112233]/80 backdrop-blur-sm hover:bg-white dark:hover:bg-[#1a2e42]"
          >
            <ChevronRight size={22} />
          </Button>
        </div>

        {/* Zoom controls */}
        <div className="mt-3 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="h-7 w-7 text-[var(--text-muted)]">
            <ZoomOut size={13} />
          </Button>
          <div className="h-1 w-20 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent-gold)] transition-all" style={{ width: `${((zoom - 0.5) / 1) * 100}%` }} />
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="h-7 w-7 text-[var(--text-muted)]">
            <ZoomIn size={13} />
          </Button>
        </div>

        <p className="mt-2 text-[10px] text-[var(--text-muted)]/60">
          ← → arrow keys or swipe to flip • Ctrl+K to search • Click to fullscreen
        </p>
      </div>

      {/* ── Search no-results ── */}
      {search && filtered.length === 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 dark:bg-[#112233]/95 backdrop-blur-md px-4 py-3 text-center">
          <p className="text-sm text-[var(--text-muted)]">No students found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
