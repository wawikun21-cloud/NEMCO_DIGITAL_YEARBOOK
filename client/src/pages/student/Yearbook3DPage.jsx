import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react"
import HTMLFlipBook from "react-pageflip"

const BOOK_3D_STYLES_ID = "book-3d-depth-styles"

function injectBook3DStyles() {
  if (typeof document === "undefined") return
  if (document.getElementById(BOOK_3D_STYLES_ID)) return
  const style = document.createElement("style")
  style.id = BOOK_3D_STYLES_ID
   style.textContent = `
     .book-resting-shadow {
      filter: drop-shadow(0 24px 48px rgba(0,0,0,0.22)) drop-shadow(0 10px 20px rgba(0,0,0,0.12));
    }
    .book-page-edge {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 12px;
      pointer-events: none;
    }
    .book-page-edge-left {
      left: -6px;
      background: linear-gradient(to right,
        rgba(0,0,0,0.06) 0%,
        rgba(255,255,255,0.08) 30%,
        rgba(0,0,0,0.04) 60%,
        rgba(240,238,235,0.9) 100%
      );
    }
    .book-page-edge-right {
      right: -6px;
      background: linear-gradient(to left,
        rgba(0,0,0,0.06) 0%,
        rgba(255,255,255,0.08) 30%,
        rgba(0,0,0,0.04) 60%,
        rgba(240,238,235,0.9) 100%
      );
    }
    .book-page-edge::after {
      content: '';
      position: absolute;
      top: 2px;
      bottom: 2px;
      left: 3px;
      right: 3px;
      background: repeating-linear-gradient(
        to bottom,
        rgba(0,0,0,0.03) 0px,
        rgba(255,255,255,0.05) 1px,
        rgba(0,0,0,0.03) 2px,
        rgba(245,243,240,0.8) 3px
      );
      border-radius: 1px;
    }
    .book-spine-shadow-left {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      width: 28px;
      pointer-events: none;
      background: linear-gradient(to right, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.06) 50%, transparent 100%);
    }
    .book-spine-shadow-right {
      position: absolute;
      top: 0;
      bottom: 0;
      right: 0;
      width: 28px;
      pointer-events: none;
      background: linear-gradient(to left, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.06) 50%, transparent 100%);
    }

    .book-hardcover {
      box-shadow: inset 0 0 34px rgba(0,0,0,0.45);
      border: 1px solid rgba(255,255,255,0.06);
    }

    .stf__parent._cover .stf__block {
      backface-visibility: visible !important;
      transform-style: preserve-3d !important;
    }
    .stf__parent._cover .stf__block > * {
      backface-visibility: visible !important;
    }
   `
  document.head.appendChild(style)
}
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
  Loader2,
  Volume2,
  VolumeX,
  List,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/hooks/useTheme"
import { getPublicFlipbook, getYearbookCatalog } from "@/services/flipbookService"
import { supabase } from "@/lib/supabaseClient"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import DownloadPdfButton from "@/components/student/DownloadPdfButton"
import DownloadFlipbookButton from "@/components/student/DownloadFlipbookButton"
import { useAuth } from "@/contexts/AuthContext"
import { dedupeBatchLabels, newestBatchLabel, normalizeEditionFilter } from "@/utils/yearbookEditionHelpers"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString()

function usePdfPageImages(pdfPages) {
  const [images, setImages] = useState({})
  const [loading, setLoading] = useState(false)
  const [aspectRatio, setAspectRatio] = useState(null)
  const [pdfPageCounts, setPdfPageCounts] = useState({})
  const cacheRef = useRef({})
  const dimsRef = useRef({})
  const concurrencyRef = useRef(0)
  const queueRef = useRef([])
  const docsRef = useRef({})
  const loadedRef = useRef(false)
  const processQueueRef = useRef(null)
  const aspectRatioRef = useRef(null)

  const recomputeAspectRatio = useCallback(() => {
    const dims = Object.values(dimsRef.current)
    if (dims.length === 0) {
      if (aspectRatioRef.current !== null) {
        aspectRatioRef.current = null
        setAspectRatio(null)
      }
      return
    }
    const totalWidth = dims.reduce((sum, d) => sum + (d?.width || 0), 0)
    const totalHeight = dims.reduce((sum, d) => sum + (d?.height || 0), 0)
    if (totalHeight === 0) return
    const ratio = totalWidth / totalHeight
    if (aspectRatioRef.current !== ratio) {
      aspectRatioRef.current = ratio
      setAspectRatio(ratio)
    }
  }, [])

  useEffect(() => {
    processQueueRef.current = () => {
      while (concurrencyRef.current < 3 && queueRef.current.length > 0) {
        const task = queueRef.current.shift()
        concurrencyRef.current++
        task().finally(() => {
          concurrencyRef.current--
          processQueueRef.current()
        })
      }
    }
  }, [])

  const renderPage = useCallback((pdfId, pageNum, scale) => {
    const key = `${pdfId}-${pageNum}`
    if (cacheRef.current[key]) return Promise.resolve(cacheRef.current[key])
    const pdfDoc = docsRef.current[pdfId]
    if (!pdfDoc) return Promise.resolve(null)

    return (async () => {
      const page = await pdfDoc.getPage(pageNum)
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement("canvas")
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext("2d")
      await page.render({ canvasContext: ctx, viewport }).promise
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
      cacheRef.current[key] = dataUrl
      dimsRef.current[key] = { width: viewport.width, height: viewport.height }
      recomputeAspectRatio()
      setImages((prev) => ({ ...prev, [key]: dataUrl }))
      return dataUrl
    })()
  }, [recomputeAspectRatio])

  const renderEager = useCallback((pdfId, pageNum) => {
    if (!loadedRef.current) return
    const key = `${pdfId}-${pageNum}`
    if (cacheRef.current[key]) return
    concurrencyRef.current++
    renderPage(pdfId, pageNum, 1.5).finally(() => {
      concurrencyRef.current--
      processQueueRef.current()
    })
  }, [renderPage])

  const enqueueLazy = useCallback((pdfId, pageNum) => {
    if (!loadedRef.current) return
    const key = `${pdfId}-${pageNum}`
    if (cacheRef.current[key]) return
    queueRef.current.push(() => renderPage(pdfId, pageNum, 1.0))
  }, [renderPage])

  useEffect(() => {
    if (!pdfPages || pdfPages.length === 0) {
      setImages({})
      setAspectRatio(null)
      setPdfPageCounts({})
      docsRef.current = {}
      loadedRef.current = false
      return
    }
    let cancelled = false
    setLoading(true)
    queueRef.current = []
    concurrencyRef.current = 0
    loadedRef.current = false

    async function loadDocs() {
      const newPageCounts = {}
      const newImages = {}
      const allDocTasks = []

      for (const pdf of pdfPages) {
        allDocTasks.push((async () => {
          try {
            const loadingTask = pdfjsLib.getDocument(pdf.file_url)
            const pdfDoc = await loadingTask.promise
            docsRef.current[pdf.id] = pdfDoc
            newPageCounts[pdf.id] = pdfDoc.numPages
            for (let p = 1; p <= pdfDoc.numPages; p++) {
              const key = `${pdf.id}-${p}`
              if (cacheRef.current[key]) {
                newImages[key] = cacheRef.current[key]
              }
            }
          } catch { /* skip */ }
        })())
      }

      await Promise.allSettled(allDocTasks)

      if (cancelled) return

      setImages((prev) => ({ ...prev, ...newImages }))
      setPdfPageCounts(newPageCounts)
      loadedRef.current = true
      setLoading(false)
    }

    loadDocs()
    return () => { cancelled = true }
  }, [pdfPages])

  return { images, loading, aspectRatio, pdfPageCounts, renderEager, enqueueLazy, dims: dimsRef }
}
  
const StudentPage = forwardRef(function StudentPage({ profile, pageNum, totalPages, visible, isLeftPage }, ref) {
  if (!profile || !visible) return <div ref={ref} className="flex h-full w-full items-center justify-center bg-white" />
  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()
  return (
    <div ref={ref} className="flex h-full w-full flex-col bg-white p-5 sm:p-6 relative book-page-curve-shading">
      <div className="book-page-edge book-page-edge-right" />
      {isLeftPage ? <div className="book-spine-shadow-right" /> : <div className="book-spine-shadow-left" />}
      <div className="flex flex-1 flex-col items-center relative z-[4]">
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
      <div className="text-center pt-2 relative z-[4]"><span className="text-[9px] text-[var(--text-muted)]/50">{pageNum} / {totalPages}</span></div>
    </div>
  )
})

const StudentBackPage = forwardRef(function StudentBackPage({ profile, visible, isLeftPage }, ref) {
  if (!profile || !visible) return <div ref={ref} className="flex h-full w-full bg-[#fafafa]" />
  const pr = profile
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-[#fafafa] p-5 sm:p-6 text-center relative book-page-curve-shading">
      <div className="book-page-edge book-page-edge-left" />
      {isLeftPage ? <div className="book-spine-shadow-right" /> : <div className="book-spine-shadow-left" />}
      <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)]/5 flex items-center justify-center mb-3 relative z-[4]"><GraduationCap size={20} className="text-[var(--bg-primary)]/30" /></div>
      <p className="text-[10px] text-[var(--text-muted)]/40 italic max-w-[200px] relative z-[4]">"{pr.quote || "The future belongs to those who believe in the beauty of their dreams."}"</p>
    </div>
  )
})

const BookCover = forwardRef(function BookCover({ title, subtitle }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#132F45] to-[#0d1f33] p-5 sm:p-6 text-center relative book-hardcover">
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, transparent 40%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.04), inset -1px -1px 3px rgba(0,0,0,0.15)" }} />
      <div className="flex flex-col items-center justify-center flex-1 min-h-0 relative z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"><GraduationCap size={36} className="text-[var(--accent-gold)]" /></div>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight leading-tight">{title || "NEMCO Digital Yearbook"}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/60 font-light">{subtitle}</p>}
      </div>
    </div>
  )
})

const BackCover = forwardRef(function BackCover({ title }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0d1f33] via-[#132F45] to-[#1a3a5c] p-5 sm:p-6 text-center relative">
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 40%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 2px 2px 4px rgba(255,255,255,0.04), inset -1px -1px 3px rgba(0,0,0,0.15)" }} />
      <Heart size={32} className="mb-3 text-[var(--accent-gold)]/60" />
      <p className="text-lg font-bold text-white/80 relative z-10">{title || "NEMCO"}</p>
      <p className="mt-1 text-xs text-white/40 relative z-10">Digital Yearbook</p>
    </div>
  )
})

const InsideCover = forwardRef(function InsideCover({ isLeftPage }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-[#f8f7f5] p-5 sm:p-6 relative book-page-curve-shading">
      <div className="book-page-edge book-page-edge-left" />
      {isLeftPage ? <div className="book-spine-shadow-right" /> : <div className="book-spine-shadow-left" />}
    </div>
  )
})

const SectionPage = forwardRef(function SectionPage({ name, isLeftPage }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/3 via-white to-[var(--bg-primary)]/3 p-5 sm:p-6 relative book-page-curve-shading">
      <div className="book-page-edge book-page-edge-right" />
      {isLeftPage ? <div className="book-spine-shadow-right" /> : <div className="book-spine-shadow-left" />}
      <div className="h-px w-16 bg-[var(--bg-primary)]/20 mb-4 relative z-[4]" />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]/8 mb-3 relative z-[4]"><Sparkles size={20} className="text-[var(--bg-primary)]" /></div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] relative z-[4]">{name}</h3>
      <div className="mt-2 h-0.5 w-12 rounded-full bg-[var(--accent-gold)]/40 relative z-[4]" />
      <div className="h-px w-16 bg-[var(--bg-primary)]/20 mt-4 relative z-[4]" />
    </div>
  )
})

const PdfPageContent = forwardRef(function PdfPageContent({ imageUrl, title, pageNum, isLoading, isLeftPage }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col bg-white p-5 sm:p-6 relative book-page-curve-shading">
      <div className="book-page-edge book-page-edge-right" />
      {isLeftPage ? <div className="book-spine-shadow-right" /> : <div className="book-spine-shadow-left" />}
      <div className="flex-1 relative flex items-center justify-center z-[4]">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-contain" draggable={false} />
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={18} className="animate-spin text-[var(--bg-primary)]/40" />
            <span className="text-[10px] text-[var(--text-muted)]/50">Loading page {pageNum}…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <BookOpen size={20} className="text-[var(--bg-primary)]/20" />
            <span className="text-[10px] text-[var(--text-muted)]/40">{title}</span>
          </div>
        )}
      </div>
      <div className="text-center py-1.5 border-t border-gray-100 z-[4]"><span className="text-[9px] text-[var(--text-muted)]/50">{title} • Page {pageNum}</span></div>
    </div>
  )
})

function PageStrip({ pages, currentPage, onSelect, disabled }) {
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
          <button key={i} data-p={i} onClick={() => onSelect(i)} disabled={disabled} aria-label={i === 0 ? "Cover" : `Page ${i}`}
            className={`shrink-0 rounded-md border-2 transition-all duration-200 ${active ? "border-[var(--accent-gold)] shadow-lg shadow-[var(--accent-gold)]/20 scale-110 z-10" : "border-white/20 hover:border-white/50 opacity-50 hover:opacity-90"} ${disabled ? "pointer-events-none" : ""}`}
            style={{ width: "48px", aspectRatio: "3/4" }}>
            <div className={`flex h-full w-full items-center justify-center rounded-sm overflow-hidden ${i === 0 ? "bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/70" : "bg-[var(--bg-surface)]"}`}>
              {i === 0 ? <BookMarked size={12} className="text-white/80" /> :
                pg?.type === "back-cover" ? <Heart size={12} className="text-[var(--bg-primary)]/30" /> :
                  pg?.type === "section" ? <Sparkles size={12} className="text-[var(--bg-primary)]/40" /> :
                    pg?.type === "pdf" ? <div className="flex flex-col items-center gap-0.5"><BookOpen size={10} className="text-[var(--bg-primary)]/50" /><span className="text-[6px] text-[var(--text-muted)]/50">PDF</span></div> :
                      pg?.type === "student-back" ? <div className="flex items-center justify-center"><GraduationCap size={10} className="text-[var(--bg-primary)]/30" /></div> :
                        pg?.data?.profile ? (
                          <div className="flex flex-col items-center gap-0.5">
                            {pg.data.profile.avatar_url ? <img src={pg.data.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" /> : <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-primary)]/15 text-[9px] font-bold text-[var(--bg-primary)]">{(pg.data.profile.display_name || "?").charAt(0)}</div>}
                            <p className="w-full truncate text-center text-[6px] text-[var(--text-muted)]">{(pg.data.profile.display_name || "").split(" ")[0]}</p>
                          </div>
                        ) : <span className="text-[8px] text-gray-400">{i}</span>}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default function Yearbook3DPage() {
  const { theme } = useTheme()
  const { profile: authProfile, role } = useAuth()
  const isStudentView = role !== "admin"
  const headerDark = theme === "dark"
  const [initialPage] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const pageParam = params.get("page")
    if (pageParam !== null) {
      const p = parseInt(pageParam, 10)
      if (!isNaN(p) && p >= 0) return p
    }
    return null
  })

  const [data, setData] = useState(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(initialPage !== null ? initialPage : 0)
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [showStrip, setShowStrip] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [flipSpeed, setFlipSpeed] = useState(0.7)
  const [pendingPage, setPendingPage] = useState(null)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
    const [bookState, setBookState] = useState("read")
   const [bookTranslateX, setBookTranslateX] = useState(0)
  const [showToc, setShowToc] = useState(false)
  const tocRef = useRef(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedBatch, setSelectedBatch] = useState(null)
   const [filtersReady, setFiltersReady] = useState(false)
   const [availableDepartments, setAvailableDepartments] = useState([])
   const [availableBatches, setAvailableBatches] = useState([])
   const [departmentBatchMatrix, setDepartmentBatchMatrix] = useState({})
  const bookWrapperRef = useRef(null)
  const recomputeCenteringRef = useRef(() => {})

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
      recomputeCenteringRef.current()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const containerRef = useRef(null)
  const bookRef = useRef(null)
  const audioCtxRef = useRef(null)
  const searchInputRef = useRef(null)
  const prevSearchOpen = useRef(false)

  useEffect(() => {
    injectBook3DStyles()
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadProfileAndCatalog() {
      let courseStrand = null

      if (isStudentView) {
        try {
          const { data: sessionData } = await supabase.auth.getSession()
          const userId = sessionData?.session?.user?.id

          if (userId) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("course_or_strand")
              .eq("id", userId)
              .maybeSingle()
            if (profile) {
              courseStrand = profile.course_or_strand?.trim() || null
              if (!cancelled) setStudentProfile(profile)
            }
          }
        } catch {
          // Fall back to auth profile if Supabase read fails
        }

        if (!courseStrand && authProfile?.course_or_strand) {
          courseStrand = authProfile.course_or_strand.trim()
        }
      }

      let catalog = null
      try {
        catalog = await getYearbookCatalog()
        if (!cancelled) {
          setAvailableDepartments(catalog.departments || [])
          setAvailableBatches(catalog.batches || [])
          setDepartmentBatchMatrix(catalog.departmentBatchMatrix || {})
        }
      } catch {
        // Catalog load is optional; filters still work without dropdown data
      }

      if (!cancelled) {
        if (isStudentView) {
          setSelectedDepartment(courseStrand)
        }
        const initDept = courseStrand || null
        const matrix = catalog?.departmentBatchMatrix || {}
        const initBatches = initDept
          ? (matrix[initDept] || [])
          : (catalog?.batches || [])
        setSelectedBatch(newestBatchLabel(initBatches))
        setFiltersReady(true)
      }
    }

    loadProfileAndCatalog()
  }, [authProfile?.course_or_strand, isStudentView])

   
  // Loading state is set synchronously before fetch to trigger skeleton UI
  useEffect(() => {
    if (!filtersReady) return
    let cancelled = false
    setDataLoading(true)
    getPublicFlipbook(selectedDepartment, selectedBatch)
      .then((result) => {
        if (!cancelled) {
          setData(result)
        }
      })
      .catch((e) => {
        if (!cancelled) {
          if (e.message?.includes("401") || e.message?.includes("Unauthorized")) {
            try { supabase.auth.signOut() } catch { /* */ }
          }
          setError(e.message)
        }
      })
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [filtersReady, selectedDepartment, selectedBatch])

  useEffect(() => {
    if (!data) return
    const timer = setTimeout(() => recomputeCenteringRef.current(), 100)
    return () => clearTimeout(timer)
  }, [data])

   
  // Sync flip speed from settings — persists to backend on change
  useEffect(() => {
    if (data?.settings?.flip_speed) setFlipSpeed(data.settings.flip_speed)
  }, [data?.settings?.flip_speed])

   
  // Navigate to student page on URL param — runs once when data loads
  useEffect(() => {
    if (!data) return
    const params = new URLSearchParams(window.location.search)
    const studentParam = params.get("student")
    if (studentParam) {
      const profiles = (data?.profiles || []).filter((pr) => pr.profile)
      const idx = profiles.findIndex((pr) => {
        const slug = (pr.profile.display_name || pr.profile.full_name || "").toLowerCase().replace(/\s+/g, "-")
        return slug === studentParam.toLowerCase() || pr.profile.id === studentParam || pr.id === studentParam
      })
      if (idx >= 0) {
         let pageIdx = 2
        const sections = data?.sections || []
        if (sections.length > 0) {
          const secMap = new Map()
          for (const fp of profiles) {
            const sn = fp.section_name || ""
            if (sn) {
              if (!secMap.has(sn)) secMap.set(sn, [])
              secMap.get(sn).push(fp)
            }
          }
          const targetSec = profiles[idx]?.section_name || ""
          for (const sec of sections) {
            pageIdx++
            if (sec.name === targetSec) {
              const secProfiles = secMap.get(sec.name) || []
              const localIdx = secProfiles.findIndex((sp) => sp === profiles[idx])
              if (localIdx >= 0) pageIdx += localIdx * 2
              break
            }
            pageIdx += (secMap.get(sec.name) || []).length * 2
          }
        } else {
          pageIdx = idx * 2 + 1
        }
        setPendingPage(pageIdx)
      }
    }
  }, [data])

  useEffect(() => {
    if (pendingPage !== null && bookRef.current) {
      const pf = bookRef.current.pageFlip()
      if (pf) {
        pf.turnToPage(pendingPage)
        setCurrentPage(pendingPage)
      }
      setPendingPage(null)
    }
  }, [pendingPage])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

   useEffect(() => {
     if (searchOpen && !prevSearchOpen.current && searchInputRef.current) {
       searchInputRef.current.focus()
     }
     prevSearchOpen.current = searchOpen
   }, [searchOpen])

   useEffect(() => {
     if (!showToc) return
     const handler = (e) => {
       if (tocRef.current && !tocRef.current.contains(e.target)) {
         setShowToc(false)
       }
     }
     document.addEventListener("mousedown", handler)
     return () => document.removeEventListener("mousedown", handler)
   }, [showToc])

  const pdfPages = useMemo(() => (data?.pdfPages || []), [data?.pdfPages])
  const sections = useMemo(() => (data?.sections || []), [data?.sections])
  const courseStrandOptions = useMemo(() => {
    return [...availableDepartments].sort()
  }, [availableDepartments])

  const batchOptions = useMemo(() => {
    const normalizedDept = normalizeEditionFilter(selectedDepartment)
    if (normalizedDept) {
      const matrixBatches = departmentBatchMatrix[normalizedDept] || []
      const filtered = availableBatches.filter((b) => matrixBatches.includes(b))
      return filtered.length > 0 ? filtered : matrixBatches
    }
    return availableBatches
  }, [availableBatches, departmentBatchMatrix, selectedDepartment])

  useEffect(() => {
    if (!selectedDepartment) return
    const normalizedDept = normalizeEditionFilter(selectedDepartment)
    const matrixBatches = departmentBatchMatrix[normalizedDept] || []
    const validBatches = dedupeBatchLabels(matrixBatches)
    if (selectedBatch && !validBatches.includes(selectedBatch)) {
      setSelectedBatch(newestBatchLabel(validBatches))
    }
  }, [selectedDepartment, departmentBatchMatrix])

  const { images: pdfImages, loading: pdfLoading, aspectRatio: pdfAspectRatio, pdfPageCounts, renderEager, enqueueLazy, dims: pdfImageDimensions } = usePdfPageImages(pdfPages)

  const profiles = (data?.profiles || []).filter((p) => p.profile)

  const filtered = useMemo(() => {
    if (!search) return null
    return profiles.filter((p) => {
      const q = search.toLowerCase(); const pr = p.profile
      return (pr.display_name || "").toLowerCase().includes(q) || (pr.full_name || "").toLowerCase().includes(q) ||
        (pr.student_number || "").toLowerCase().includes(q) || (pr.course_or_strand || "").toLowerCase().includes(q) ||
        (p.section_name || "").toLowerCase().includes(q)
    })
  }, [profiles, search])

  const filteredIdSet = useMemo(() => {
    if (!filtered) return null
    return new Set(filtered.map((p) => p.profile?.id))
  }, [filtered])

  const bookPageList = useMemo(() => {
     const sourceType = data?.sourceType || "profiles"
     const contentPages = []
     if (sourceType === "profiles") {
       if (sections.length > 0) {
         const sectionMap = new Map(), unsectioned = []
         for (const fp of profiles) { const sn = fp.section_name || ""; if (sn) { if (!sectionMap.has(sn)) sectionMap.set(sn, []); sectionMap.get(sn).push(fp) } else unsectioned.push(fp) }
         for (const sec of sections) {
           contentPages.push({ type: "section", name: sec.name })
           for (const sp of (sectionMap.get(sec.name) || [])) {
             contentPages.push({ type: "student", data: sp })
             contentPages.push({ type: "student-back", data: sp })
           }
         }
         for (const up of unsectioned) {
           contentPages.push({ type: "student", data: up })
           contentPages.push({ type: "student-back", data: up })
         }
       } else {
         for (const fp of profiles) {
           contentPages.push({ type: "student", data: fp })
           contentPages.push({ type: "student-back", data: fp })
         }
       }
     } else if (sourceType === "pdfs") {
       for (const pdf of pdfPages) { const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) contentPages.push({ type: "pdf", data: pdf, pageNum: i }) }
     } else {
       if (sections.length > 0) {
         const sectionMap = new Map(), unsectioned = []
         for (const fp of profiles) { const sn = fp.section_name || ""; if (sn) { if (!sectionMap.has(sn)) sectionMap.set(sn, []); sectionMap.get(sn).push(fp) } else unsectioned.push(fp) }
         const pdfSectionMap = new Map(), unsectionedPdfs = []
         for (const pdf of pdfPages) { const sn = pdf.section_name || ""; if (sn) { if (!pdfSectionMap.has(sn)) pdfSectionMap.set(sn, []); pdfSectionMap.get(sn).push(pdf) } else unsectionedPdfs.push(pdf) }
         for (const sec of sections) {
           contentPages.push({ type: "section", name: sec.name })
           for (const sp of (sectionMap.get(sec.name) || [])) {
             contentPages.push({ type: "student", data: sp })
             contentPages.push({ type: "student-back", data: sp })
           }
           for (const pdf of (pdfSectionMap.get(sec.name) || [])) { const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) contentPages.push({ type: "pdf", data: pdf, pageNum: i }) }
         }
         for (const up of unsectioned) {
           contentPages.push({ type: "student", data: up })
           contentPages.push({ type: "student-back", data: up })
         }
         for (const pdf of unsectionedPdfs) { const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) contentPages.push({ type: "pdf", data: pdf, pageNum: i }) }
       } else {
         let pi = 0
         for (let i = 0; i < profiles.length; i++) {
           contentPages.push({ type: "student", data: profiles[i] })
           contentPages.push({ type: "student-back", data: profiles[i] })
           if ((i + 1) % 2 === 0 && pi < pdfPages.length) { contentPages.push({ type: "pdf", data: pdfPages[pi], pageNum: 1 }); pi++ }
         }
         while (pi < pdfPages.length) { const pdf = pdfPages[pi]; const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) contentPages.push({ type: "pdf", data: pdf, pageNum: i }); pi++ }
       }
     }
       const firstPdfPage = pdfPages.length > 0 ? { type: "pdf", data: pdfPages[0], pageNum: 1 } : null
       if (firstPdfPage) {
         const firstKey = `${firstPdfPage.data.id}-${firstPdfPage.pageNum}`
         const filteredContent = contentPages.filter((p) => `${p.data?.id}-${p.pageNum}` !== firstKey)
         return [{ type: "cover", _designPage: firstPdfPage }, { type: "inside-cover" }, ...filteredContent, { type: "back-cover" }]
       }
       return [{ type: "cover", _designPage: null }, { type: "inside-cover" }, ...contentPages, { type: "back-cover" }]
   }, [profiles, sections, pdfPages, data?.sourceType, pdfPageCounts])

  const displayPageList = useMemo(() => {
    if (!filtered) return bookPageList
    return bookPageList.filter((pg) => {
       if (pg.type === "cover" || pg.type === "inside-cover" || pg.type === "back-cover" || pg.type === "section" || pg.type === "pdf") return true
      if (pg.type === "student" || pg.type === "student-back") return filteredIdSet.has(pg.data.profile?.id)
      return true
    })
  }, [bookPageList, filtered, filteredIdSet])

  const totalPages = bookPageList.length

  const recomputeCentering = useCallback(() => {
    if (windowWidth < 640) return
    const wrapper = bookWrapperRef.current
    if (!wrapper) return
    const wrapperRect = wrapper.getBoundingClientRect()
    if (wrapperRect.width <= 0) return

    const items = wrapper.querySelectorAll('.stf__item')
    const visibleItems = []
    for (const el of items) {
      const style = window.getComputedStyle(el)
      if (style.display !== 'none') {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) visibleItems.push(r)
      }
    }
    if (visibleItems.length === 0) { setBookTranslateX(0); return }

    const firstItem = visibleItems[0]
    const lastItem = visibleItems[visibleItems.length - 1]
    const contentLeft = firstItem.left
    const contentRight = lastItem.left + lastItem.width
    const contentCenter = (contentLeft + contentRight) / 2
    const wrapperCenter = wrapperRect.left + wrapperRect.width / 2
    const diffPx = contentCenter - wrapperCenter
    const offsetPct = -(diffPx / wrapperRect.width) * 100
    setBookTranslateX(offsetPct)
  }, [windowWidth])

  useEffect(() => {
    recomputeCenteringRef.current = recomputeCentering
  }, [recomputeCentering])

  useEffect(() => {
    const wrapper = bookWrapperRef.current
    if (!wrapper) return
    let debounceTimer = null
    const ro = new ResizeObserver(() => {
      if (bookState !== "read") return
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        recomputeCenteringRef.current()
      }, 100)
    })
    ro.observe(wrapper)
    const innerBook = wrapper.querySelector('.stf__wrapper') || wrapper.querySelector('.stf__parent')
    if (innerBook) ro.observe(innerBook)
    return () => {
      ro.disconnect()
      clearTimeout(debounceTimer)
    }
  }, [bookPageList.length, bookState])

  const pdfListStable = pdfPages.length === 0 || !pdfLoading

  useEffect(() => {
    if (!pdfPages.length || !data) return
    const pdfIndices = []
    bookPageList.forEach((pg, idx) => {
      if (pg.type === "pdf") pdfIndices.push({ idx, pdfId: pg.data.id, pageNum: pg.pageNum })
    })
    const coverPage = bookPageList.find((pg) => pg.type === "cover")
    if (coverPage?._designPage?.type === "pdf") {
      const dp = coverPage._designPage
      pdfIndices.push({ idx: 0, pdfId: dp.data.id, pageNum: dp.pageNum, isCover: true })
    }
    for (const { idx, pdfId, pageNum } of pdfIndices) {
      const dist = Math.abs(idx - currentPage)
      if (dist <= 2 || pdfIndices.length === 1) {
        renderEager(pdfId, pageNum)
      } else {
        enqueueLazy(pdfId, pageNum)
      }
    }
  }, [currentPage, pdfPages, data, bookPageList, renderEager, enqueueLazy])

  const playFlipSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioCtxRef.current; const now = ctx.currentTime
      const bufferSize = ctx.sampleRate * 0.15; const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const d = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-(i / bufferSize) * 8) * 0.3
      const noise = ctx.createBufferSource(); noise.buffer = buffer
      const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 3000; filter.Q.value = 0.8
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.08, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      noise.connect(filter).connect(gain).connect(ctx.destination); noise.start(now); noise.stop(now + 0.15)
    } catch { /* */ }
  }, [soundEnabled])

  const jumpToPage = useCallback((targetPage) => {
    if (!bookRef.current) return
    const pf = bookRef.current.pageFlip()
    if (!pf) return
    const currentIdx = pf.getCurrentPageIndex()
    if (targetPage === currentIdx) return
    if (targetPage < 0 || targetPage >= pf.getPageCount()) return
    const distance = Math.abs(targetPage - currentIdx)
    if (distance > 5) {
      pf.turnToPage(targetPage)
    } else {
      pf.flip(targetPage, "bottom")
    }
    setCurrentPage(targetPage)
    playFlipSound()
    const params = new URLSearchParams(window.location.search)
    params.set("page", targetPage.toString())
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`)
  }, [playFlipSound])

  const goNext = useCallback(() => {
    if (!bookRef.current) return
    const pf = bookRef.current.pageFlip()
    if (!pf) return
    pf.flipNext()
  }, [])

  const goPrev = useCallback(() => {
    if (!bookRef.current) return
    const pf = bookRef.current.pageFlip()
    if (!pf) return
    pf.flipPrev()
  }, [])

  const onFlip = useCallback((e) => {
    const newPage = e.data
    setCurrentPage(newPage)
    playFlipSound()
    const params = new URLSearchParams(window.location.search)
    params.set("page", newPage.toString())
    window.history.replaceState(null, "", `${window.location.pathname}?${params}`)
  }, [playFlipSound])

  const onChangeState = useCallback((e) => {
    setBookState(e.data)
  }, [])

  const onInit = useCallback(() => {
     if (bookRef.current) {
        const pf = bookRef.current.pageFlip()
        if (pf && initialPage !== null && initialPage !== 0) {
          pf.turnToPage(initialPage)
        }
      }
    }, [initialPage])

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

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  const bookToFilteredIndex = useMemo(() => {
    if (!filtered) return null
    const map = new Map()
    let displayIdx = 0
    bookPageList.forEach((pg, bookIdx) => {
      const isStudent = pg.type === "student" || pg.type === "student-back"
      const visible = !isStudent || filteredIdSet.has(pg.data.profile?.id)
      if (visible) {
        map.set(bookIdx, displayIdx)
        displayIdx++
      }
    })
    return map
  }, [bookPageList, filtered, filteredIdSet])

  const filteredToBookIndex = useMemo(() => {
    if (!filtered) return null
    const map = new Map()
    let displayIdx = 0
    bookPageList.forEach((pg, bookIdx) => {
      const isStudent = pg.type === "student" || pg.type === "student-back"
      const visible = !isStudent || filteredIdSet.has(pg.data.profile?.id)
      if (visible) {
        map.set(displayIdx, bookIdx)
        displayIdx++
      }
    })
    return map
  }, [bookPageList, filtered, filteredIdSet])

  const displayCurrentPage = filteredToBookIndex
    ? (bookToFilteredIndex.get(currentPage) ?? 0)
    : currentPage

  const handleStripSelect = useCallback((displayIdx) => {
    if (filteredToBookIndex) {
      const bookIdx = filteredToBookIndex.get(displayIdx)
      if (bookIdx !== undefined) jumpToPage(bookIdx)
    } else {
      jumpToPage(displayIdx)
    }
  }, [filteredToBookIndex, jumpToPage])

  const isFlipping = bookState === "flipping"

  const bookAspectRatio = pdfAspectRatio || 3 / 4
  // Responsive book sizing: derive from viewport instead of a fixed px value so the
  // book never overflows on small screens. Horizontal padding budget: 32px normal, 40px fullscreen.
  const availableBookWidth = windowWidth - (isFullscreen ? 40 : 32)
  const bookWidth = isFullscreen
    ? Math.max(240, Math.min(600, availableBookWidth))
    : Math.max(220, Math.min(400, availableBookWidth))
  const bookHeight = Math.round(bookWidth / bookAspectRatio)
  const bookMaxWidth = isFullscreen ? 900 : 600
  const bookMaxHeight = isFullscreen ? 1200 : 800

  const pageLabel = currentPage === 0 ? "Cover" : currentPage === totalPages - 1 ? "Back Cover" : `${currentPage} / ${totalPages - 1}`

  if (dataLoading && !data) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0d1f33] to-[#132F45]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative"><div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-gold)]/20" /><BookMarked size={40} className="relative text-[var(--accent-gold)] animate-pulse" /></div>
        <p className="text-sm text-white/60 font-light">Opening your yearbook…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><AlertTriangle size={32} className="mx-auto mb-2 text-red-500" /><p className="text-sm font-medium text-[var(--text-primary)]">Failed to load yearbook</p><p className="text-xs text-[var(--text-muted)]">{error}</p></div>
    </div>
  )

  if (data && !data?.settings?.enabled) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><BookMarked size={32} className="mx-auto mb-2 text-[var(--text-muted)]" /><p className="text-sm font-medium text-[var(--text-primary)]">Yearbook not available</p><p className="text-xs text-[var(--text-muted)]">The digital yearbook has not been published yet.</p></div>
    </div>
  )

  if (data && profiles.length === 0 && pdfPages.length === 0) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><BookOpen size={32} className="mx-auto mb-2 text-[var(--text-muted)]" /><p className="text-sm font-medium text-[var(--text-primary)]">No content yet</p><p className="text-xs text-[var(--text-muted)]">Add student profiles or PDF pages to the yearbook.</p></div>
    </div>
  )

  if (data && data?.sourceType === "pdfs" && pdfPages.length === 0 && (selectedDepartment || selectedBatch)) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center px-4"><BookMarked size={32} className="mx-auto mb-2 text-[var(--text-muted)]" /><p className="text-sm font-medium text-[var(--text-primary)]">No yearbook available</p><p className="text-xs text-[var(--text-muted)] mb-3">
        {selectedDepartment && selectedBatch
          ? `No yearbook found for ${selectedDepartment} (${selectedBatch}).`
          : selectedDepartment
          ? `No yearbook found for ${selectedDepartment}.`
          : `No yearbook found for batch ${selectedBatch}.`}
      </p>
        {courseStrandOptions.length > 0 && (
          <p className="text-xs text-[var(--text-muted)]">Try selecting a different course/strand or batch from the filter above.</p>
        )}
      </div>
    </div>
  )

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"}`}
      style={{ background: isFullscreen ? "linear-gradient(135deg, rgba(30,20,10,0.95) 0%, rgba(15,25,40,0.97) 50%, rgba(10,15,30,0.95) 100%)" : "linear-gradient(135deg, #faf8f5 0%, #f0ede8 30%, #e8e4de 60%, #f0ede8 100%)" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-64 w-64 rounded-full bg-amber-500/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-[var(--bg-primary)]/[0.04] blur-3xl" />
      </div>

      <div aria-live="polite" className="sr-only">{pageLabel}</div>

       <header className={`relative z-20 border-b ${headerDark ? "border-white/[0.08] bg-[#0f1a2e] shadow-xl shadow-black/30" : "border-black/[0.06] bg-[#fdfbf7] shadow-lg shadow-black/[0.04]"} ${isFullscreen ? "hidden" : ""}`}>
          <div className={`absolute inset-0 pointer-events-none ${headerDark ? "bg-gradient-to-b from-white/[0.03] to-transparent" : "bg-gradient-to-b from-amber-500/[0.02] to-transparent"}`} />
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 sm:px-4 py-2.5 sm:py-3 relative">
            <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
              <div className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl shadow-lg ring-1 ${headerDark ? "bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/70 shadow-[var(--bg-primary)]/30 ring-white/10" : "bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/80 shadow-[var(--bg-primary)]/20 ring-black/10"}`}>
                <BookMarked size={16} className="text-white sm:hidden" />
                <BookMarked size={20} className="hidden text-white sm:block" />
              </div>
              <div className="min-w-0">
                <h1 className={`truncate text-sm sm:text-base font-bold leading-tight tracking-tight ${headerDark ? "text-[#f0e6d3]" : "text-[#1a2a3a]"}`}>{data?.settings?.title || "NEMCO Digital Yearbook"}</h1>
                {data?.settings?.subtitle && <p className={`hidden truncate text-[11px] leading-tight sm:block ${headerDark ? "text-[#f0e6d3]/50" : "text-[#1a2a3a]/50"}`}>{data.settings.subtitle}</p>}
              </div>
            </div>
             <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
               {profiles.length > 0 && (
                 searchOpen ? (
                   <div className="relative">
                     <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${headerDark ? "text-[#f0e6d3]/40" : "text-[#1a2a3a]/40"}`} />
                     <Input ref={searchInputRef} type="text" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className={`h-7 w-32 sm:h-8 sm:w-44 pl-9 pr-8 text-xs ${headerDark ? "bg-white/[0.08] border-white/[0.15] text-[#f0e6d3] placeholder:text-[#f0e6d3]/30 focus:bg-white/[0.12]" : "bg-white border-black/10 text-[#1a2a3a] placeholder:text-[#1a2a3a]/30 focus:bg-amber-50/50"}`} />
                     <button onClick={() => { setSearchOpen(false); setSearch("") }} className={`absolute right-2 top-1/2 -translate-y-1/2 ${headerDark ? "text-[#f0e6d3]/40 hover:text-[#f0e6d3]" : "text-[#1a2a3a]/40 hover:text-[#1a2a3a]"}`} aria-label="Close search"><X size={14} /></button>
                   </div>
                 ) : (
                   <Button variant="ghost" size="icon-sm" className={`h-7 w-7 sm:h-8 sm:w-8 ${headerDark ? "text-[#f0e6d3]/60 hover:text-[#f0e6d3] hover:bg-white/[0.08]" : "text-[#1a2a3a]/55 hover:text-[#1a2a3a] hover:bg-black/[0.04]"}`} onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl+K)"><Search size={15} /></Button>
                 )
               )}
               <Button variant="ghost" size="icon-sm" className={`hidden h-7 w-7 sm:flex sm:h-8 sm:w-8 ${headerDark ? "text-[#f0e6d3]/60 hover:text-[#f0e6d3] hover:bg-white/[0.08]" : "text-[#1a2a3a]/55 hover:text-[#1a2a3a] hover:bg-black/[0.04]"}`} onClick={() => setShowStrip(!showStrip)} aria-label="Page thumbnails"><Grid3X3 size={15} /></Button>
              <Button variant="ghost" size="icon-sm" className={`h-7 w-7 sm:h-8 sm:w-8 ${headerDark ? "text-[#f0e6d3]/60 hover:text-[#f0e6d3] hover:bg-white/[0.08]" : "text-[#1a2a3a]/55 hover:text-[#1a2a3a] hover:bg-black/[0.04]"}`} onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
                {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </Button>
              <Button variant="ghost" size="icon-sm" className={`hidden h-7 w-7 sm:flex sm:h-8 sm:w-8 ${headerDark ? "text-[#f0e6d3]/60 hover:text-[#f0e6d3] hover:bg-white/[0.08]" : "text-[#1a2a3a]/55 hover:text-[#1a2a3a] hover:bg-black/[0.04]"}`} onClick={() => setSoundEnabled(!soundEnabled)} aria-label={soundEnabled ? "Mute" : "Sound on"}>
                {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              </Button>
               {profiles.length > 0 && (
                 <div className="relative" ref={tocRef}>
                   <Button variant="ghost" size="icon-sm" className={`h-7 w-7 sm:h-8 sm:w-8 ${headerDark ? `text-[#f0e6d3]/60 hover:text-[#f0e6d3] hover:bg-white/[0.08] ${showToc ? "bg-white/[0.1] text-[#f0e6d3]" : ""}` : `text-[#1a2a3a]/55 hover:text-[#1a2a3a] hover:bg-black/[0.04] ${showToc ? "bg-black/[0.06] text-[#1a2a3a]" : ""}`}`} onClick={() => setShowToc(!showToc)} aria-label="Table of contents">
                     <List size={15} />
                   </Button>
                   {showToc && (
                     <div className={`absolute right-0 top-full mt-2 w-64 max-h-80 overflow-y-auto rounded-xl backdrop-blur-xl shadow-2xl z-[100] styled-scroll ${headerDark ? "border border-white/[0.08] bg-[#0f1a2e]/95 shadow-black/50" : "border border-black/[0.08] bg-[#fdfbf7]/95 shadow-black/10"}`}>
                       <div className={`p-3 border-b ${headerDark ? "border-white/[0.08]" : "border-black/[0.06]"}`}>
                         <p className={`text-[11px] font-semibold uppercase tracking-wider ${headerDark ? "text-[#f0e6d3]/80" : "text-[#1a2a3a]/70"}`}>Table of Contents</p>
                       </div>
                       <div className="p-1.5">
                         {displayPageList.map((pg, idx) => {
                           const bookIdx = filteredToBookIndex ? filteredToBookIndex.get(idx) : idx
                           const isActive = bookIdx === currentPage
                           const label = pg.type === "cover" ? "Cover" :
                             pg.type === "back-cover" ? "Back Cover" :
                             pg.type === "inside-cover" ? "Inside Cover" :
                             pg.type === "section" ? pg.name :
                             pg.type === "pdf" ? `PDF: ${pg.data?.title || "Document"} — Page ${pg.pageNum}` :
                             pg.type === "student" ? `${pg.data.profile?.display_name || pg.data.profile?.full_name || "Student"}` :
                             pg.type === "student-back" ? `${pg.data.profile?.display_name || pg.data.profile?.full_name || "Student"} (back)` :
                             `Page ${idx}`
                           return (
                             <button
                               key={idx}
                               onClick={() => { handleStripSelect(idx); setShowToc(false) }}
                               className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${headerDark ? (isActive ? "bg-white/[0.12] text-[#f0e6d3] font-medium" : "text-[#f0e6d3]/60 hover:bg-white/[0.06] hover:text-[#f0e6d3]") : (isActive ? "bg-amber-100/80 text-[#1a2a3a] font-medium" : "text-[#1a2a3a]/55 hover:bg-black/[0.04] hover:text-[#1a2a3a]")}`}
                             >
                               <span className="flex items-center gap-2">
                                 <span className={`w-5 text-right text-[10px] ${isActive ? "text-[var(--accent-gold)]" : (headerDark ? "text-[#f0e6d3]/30" : "text-[#1a2a3a]/30")}`}>{idx + 1}</span>
                                 <span className="truncate flex-1">{label}</span>
                               </span>
                             </button>
                           )
                         })}
                       </div>
                     </div>
                   )}
                 </div>
               )}
           {pdfPages.length > 0 && (
                 <span className={`hidden rounded-md px-2 py-1 text-[10px] font-medium ring-1 sm:inline ${headerDark ? "bg-white/[0.08] text-[#f0e6d3]/70 ring-white/[0.1]" : "bg-amber-100/60 text-[#1a2a3a]/60 ring-amber-200/50"}`}>PDF</span>
               )}
             </div>
           </div>

           {/* Dedicated filter row: separated from the icon toolbar above so it can
               wrap freely on narrow screens without ever overlapping other controls. */}
           {courseStrandOptions.length > 0 && (
             <div className="relative mx-auto max-w-5xl px-3 pb-3 sm:px-4">
               <div className="flex flex-wrap items-center gap-1.5">
                 <Select value={selectedDepartment || ""} onValueChange={setSelectedDepartment}>
                   <SelectTrigger className={`h-7 min-w-[110px] flex-1 text-xs sm:max-w-[200px] sm:min-w-[140px] sm:flex-initial ${headerDark ? "bg-white/[0.08] border-white/[0.15] text-[#f0e6d3]" : "bg-white border-black/10 text-[#1a2a3a]"}`}>
                     <SelectValue placeholder="Course / Strand" />
                   </SelectTrigger>
                   <SelectContent>
                     {courseStrandOptions.map((d) => (
                       <SelectItem key={d} value={d}>{d}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>

                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className={`h-7 min-w-[90px] flex-1 text-xs sm:w-[120px] sm:flex-initial ${headerDark ? "bg-white/[0.08] border-white/[0.15] text-[#f0e6d3]" : "bg-white border-black/10 text-[#1a2a3a]"}`}>
                      <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batchOptions.map((b) => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedBatch && (
                    <button
                      onClick={() => setSelectedBatch(newestBatchLabel(batchOptions))}
                      className={`inline-flex items-center justify-center h-7 w-7 shrink-0 rounded-md transition-colors ${headerDark ? "text-[#f0e6d3]/50 hover:text-[#f0e6d3] hover:bg-white/[0.06]" : "text-[#1a2a3a]/40 hover:text-[#1a2a3a] hover:bg-black/[0.04]"}`}
                      aria-label="Reset batch"
                    >
                      <XCircle size={13} />
                    </button>
                  )}

                   {studentProfile?.course_or_strand && availableDepartments.includes(studentProfile.course_or_strand.trim()) && (
                     <button
                       onClick={() => {
                         setSelectedDepartment(studentProfile.course_or_strand.trim())
                         setSelectedBatch(newestBatchLabel(availableBatches))
                       }}
                       className={`inline-flex shrink-0 items-center gap-1 rounded-md px-2 h-7 text-[10px] font-medium transition-colors ${headerDark ? "bg-[var(--bg-primary)]/20 text-[#f0e6d3] hover:bg-[var(--bg-primary)]/30" : "bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] hover:bg-[var(--bg-primary)]/15"}`}
                     >
                       My Yearbook
                     </button>
                   )}
               </div>
             </div>
           )}
          </header>

         <div className="relative z-10 mx-auto w-full max-w-2xl px-8">
          <div className={`h-0.5 rounded-full overflow-hidden ${headerDark ? "bg-white/[0.08]" : "bg-black/[0.06]"}`}>
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)]/80 to-[var(--accent-gold)] transition-all duration-500 ease-out"
            style={{ width: `${totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0}%` }} />
        </div>
      </div>

      {showStrip && !isFullscreen && (
        <div className="relative z-10 border-b border-black/5 bg-white/50 backdrop-blur-sm">
          <PageStrip pages={displayPageList} currentPage={displayCurrentPage} onSelect={handleStripSelect} disabled={isFlipping} />
        </div>
      )}

      <div className={`relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 overflow-y-auto overflow-x-visible ${isFullscreen ? "p-2" : ""}`}>
        {pdfPages.length > 0 && pdfLoading && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative"><div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-gold)]/20" /><BookMarked size={40} className="relative text-[var(--accent-gold)] animate-pulse" /></div>
            <p className="text-sm text-[var(--text-muted)] font-light">Rendering PDF pages…</p>
            <div className="h-1 w-32 rounded-full bg-black/10 overflow-hidden mt-2"><div className="h-full rounded-full bg-[var(--accent-gold)] animate-pulse" style={{ width: "60%" }} /></div>
          </div>
        )}

          <div ref={bookWrapperRef} className="book-resting-shadow" style={{ transform: `translateX(${bookTranslateX}%) scale(${zoom})`, transformOrigin: "center center", width: "100%", display: "flex", justifyContent: "center", maxWidth: "100vw", overflow: "visible", transition: isFlipping ? "none" : "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)" }}>
           {pdfListStable ? (
            <HTMLFlipBook
              key={`${bookPageList.length}-${isFullscreen}`}
             ref={bookRef}
             width={bookWidth}
             height={bookHeight}
             size="stretch"
             minWidth={250}
             maxWidth={bookMaxWidth}
             minHeight={350}
             maxHeight={bookMaxHeight}
                showCover={true}
             drawShadow={true}
             maxShadowOpacity={0.5}
             flippingTime={Math.round(flipSpeed * 1000)}
             usePortrait={true}
             startPage={initialPage !== null ? initialPage : 0}
             clickEventForward={true}
             mobileScrollSupport={false}
             useMouseEvents={true}
             showPageCorners={true}
              disableFlipByClick={false}
              swipeDistance={30}
             autoSize={true}
             renderOnlyPageLengthChange={false}
             onFlip={onFlip}
             onChangeState={onChangeState}
             onInit={onInit}
             className="mx-auto"
             style={{ maxWidth: "100%" }}
           >
             {bookPageList.map((page, idx) => {
               const isStudent = page.type === "student" || page.type === "student-back"
               const visible = !isStudent || !filteredIdSet || filteredIdSet.has(page.data.profile?.id)
               const isLeftPage = idx % 2 === 0

                if (page.type === "cover") {
                  const dp = page._designPage
                  if (!dp) {
                    return <BookCover key="cover" title={data?.settings?.title} subtitle={data?.settings?.subtitle} />
                  }
                  if (dp.type === "section") {
                    return (
                      <div key="cover" className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/3 via-white to-[var(--bg-primary)]/3 p-5 sm:p-6 relative book-page-curve-shading">
                        <div className="book-page-edge book-page-edge-right" />
                        <div className="h-px w-16 bg-[var(--bg-primary)]/20 mb-4 relative z-[4]" />
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]/8 mb-3 relative z-[4]"><Sparkles size={20} className="text-[var(--bg-primary)]" /></div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)] relative z-[4]">{dp.name}</h3>
                        <div className="mt-2 h-0.5 w-12 rounded-full bg-[var(--accent-gold)]/40 relative z-[4]" />
                        <div className="h-px w-16 bg-[var(--bg-primary)]/20 mt-4 relative z-[4]" />
                      </div>
                    )
                  }
                  if (dp.type === "student") {
                    const pr = dp.data.profile
                    const name = pr.display_name || pr.full_name || "Unknown"
                    const initial = name.charAt(0).toUpperCase()
                    return (
                      <div key="cover" className="flex h-full w-full flex-col bg-white p-5 sm:p-6 relative book-page-curve-shading">
                        <div className="book-page-edge book-page-edge-right" />
                        <div className="flex flex-1 flex-col items-center relative z-[4]">
                          <div className="w-full h-1 rounded-full bg-gradient-to-r from-transparent via-[var(--bg-primary)]/20 to-transparent mb-4" />
                          {pr.avatar_url ? (
                            <img src={pr.avatar_url} alt={name} className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--bg-primary)]/10 shadow-lg sm:h-32 sm:w-32" />
                          ) : (
                            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--bg-primary)]/10 to-[var(--bg-primary)]/20 text-4xl font-bold text-[var(--bg-primary)] ring-4 ring-[var(--bg-primary)]/10 shadow-lg sm:h-32 sm:w-32 sm:text-5xl">{initial}</div>
                          )}
                          <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)] sm:text-xl">{name}</h2>
                          {pr.student_number && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{pr.student_number}</p>}
                          <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
                            {pr.course_or_strand && <span className="rounded-full bg-[var(--bg-primary)]/8 px-2.5 py-0.5 text-[10px] font-medium text-[var(--bg-primary)]">{pr.course_or_strand}</span>}
                            {pr.year_level && <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{pr.year_level}</span>}
                            {pr.section && <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{pr.section}</span>}
                          </div>
                          <div className="mt-3 flex-1 overflow-y-auto styled-scroll min-h-0">
                            {pr.bio && <p className="text-[11px] leading-relaxed text-[var(--text-secondary)] text-center max-w-xs px-2">{pr.bio}</p>}
                            {pr.quote && <blockquote className="mt-3 border-l-2 border-[var(--bg-primary)]/40 pl-2.5 text-[11px] italic text-[var(--text-muted)] max-w-xs text-center">"{pr.quote}"</blockquote>}
                          </div>
                        </div>
                      </div>
                    )
                  }
                  if (dp.type === "student-back") {
                    const pr = dp.data.profile
                    return (
                      <div key="cover" className="flex h-full w-full flex-col items-center justify-center bg-[#fafafa] p-5 sm:p-6 text-center relative book-page-curve-shading">
                        <div className="book-page-edge book-page-edge-left" />
                        <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)]/5 flex items-center justify-center mb-3 relative z-[4]"><GraduationCap size={20} className="text-[var(--bg-primary)]/30" /></div>
                        <p className="text-[10px] text-[var(--text-muted)]/40 italic max-w-[200px] relative z-[4]">"{pr.quote || "The future belongs to those who believe in the beauty of their dreams."}"</p>
                      </div>
                    )
                  }
                  if (dp.type === "pdf") {
                    const img = pdfImages[`${dp.data.id}-${dp.pageNum}`]
                    return (
                      <div key="cover" className="flex h-full w-full flex-col bg-white p-5 sm:p-6 relative book-page-curve-shading">
                        <div className="book-page-edge book-page-edge-right" />
                        <div className="flex-1 relative flex items-center justify-center z-[4]">
                          {img ? (
                            <img src={img} alt={dp.data.title} className="h-full w-full object-contain" draggable={false} />
                          ) : pdfLoading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 size={18} className="animate-spin text-[var(--bg-primary)]/40" />
                              <span className="text-[10px] text-[var(--text-muted)]/50">Loading page {dp.pageNum}…</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <BookOpen size={20} className="text-[var(--bg-primary)]/20" />
                              <span className="text-[10px] text-[var(--text-muted)]/40">{dp.data.title}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center py-1.5 border-t border-gray-100 z-[4]"><span className="text-[9px] text-[var(--text-muted)]/50">{dp.data.title} • Page {dp.pageNum}</span></div>
                      </div>
                    )
                  }
                  return <BookCover key="cover" title={data?.settings?.title} subtitle={data?.settings?.subtitle} />
                }
                if (page.type === "inside-cover") {
                  return <InsideCover key="inside-cover" isLeftPage={isLeftPage} />
                }
                if (page.type === "back-cover") {
                 return (
                   <BackCover key="back-cover" title={data?.settings?.title} />
                 )
               }
               if (page.type === "section") {
                 return (
                   <SectionPage key={`section-${page.name}`} name={page.name} isLeftPage={isLeftPage} />
                 )
               }
               if (page.type === "student") {
                 return (
                   <StudentPage key={`student-${page.data.profile?.id || idx}`} profile={page.data.profile} pageNum={idx} totalPages={totalPages - 3} visible={visible} isLeftPage={isLeftPage} />
                 )
               }
               if (page.type === "student-back") {
                 return (
                   <StudentBackPage key={`student-back-${page.data.profile?.id || idx}`} profile={page.data.profile} visible={visible} isLeftPage={isLeftPage} />
                 )
               }
               if (page.type === "pdf") {
                 const img = pdfImages[`${page.data.id}-${page.pageNum}`]
                 return (
                   <PdfPageContent key={`pdf-${page.data.id}-${page.pageNum}`} imageUrl={img} title={page.data.title} pageNum={page.pageNum} isLoading={!img && pdfLoading} isLeftPage={isLeftPage} />
                 )
               }
               return <div key={`page-${idx}`} />
             })}
           </HTMLFlipBook>
           ) : (
             <div className="flex flex-col items-center gap-3">
               <Loader2 size={32} className="animate-spin text-[var(--accent-gold)]" />
               <p className="text-sm text-[var(--text-muted)] font-light">Preparing pages…</p>
             </div>
           )}
         </div>

        <div className={`mt-4 w-full max-w-xs ${isFullscreen ? "hidden" : ""}`}>
          <div className="h-1 rounded-full bg-black/10 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/70 transition-all duration-500 ease-out"
              style={{ width: `${totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-[var(--text-muted)]/50">Cover</span>
            <span className="text-[9px] text-[var(--text-muted)]/50">{currentPage === 0 ? "Cover" : currentPage === totalPages - 1 ? "Back Cover" : `Page ${currentPage} of ${totalPages - 1}`}</span>
            <span className="text-[9px] text-[var(--text-muted)]/50">End</span>
          </div>
        </div>

        <div className={`mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-5 ${isFullscreen ? "hidden" : ""}`}>
          <Button variant="outline" size="icon" onClick={goPrev} disabled={currentPage <= 0 || isFlipping}
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/90 backdrop-blur-sm hover:bg-white"
            aria-label="Previous page">
            <ChevronLeft size={18} className="sm:hidden" />
            <ChevronLeft size={22} className="hidden sm:block" />
          </Button>
          <div className="flex items-center gap-1 sm:gap-1.5">
            {Array.from({ length: Math.min(totalPages, 11) }, (_, i) => {
              let pn
              if (totalPages <= 11) pn = i
              else { const s = Math.max(0, Math.min(currentPage - 5, totalPages - 11)); pn = s + i }
              return (
                <button key={pn} onClick={() => jumpToPage(pn)} disabled={isFlipping}
                  aria-label={pn === 0 ? "Cover" : `Page ${pn}`}
                  className={`rounded-full transition-all duration-300 ${pn === currentPage ? "w-6 sm:w-7 h-2 sm:h-2.5 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/80 shadow-md shadow-[var(--accent-gold)]/30" : pn === 0 ? "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-[var(--bg-primary)]/25 hover:bg-[var(--bg-primary)]/50" : "w-2 sm:w-2.5 h-2 sm:h-2.5 bg-black/10 hover:bg-black/20"}`} />
              )
            })}
          </div>
          <Button variant="outline" size="icon" onClick={goNext} disabled={currentPage >= totalPages - 1 || isFlipping}
            className="h-9 w-9 sm:h-11 sm:w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/90 backdrop-blur-sm hover:bg-white"
            aria-label="Next page">
            <ChevronRight size={18} className="sm:hidden" />
            <ChevronRight size={22} className="hidden sm:block" />
          </Button>
        </div>

        <div className={`mt-3 flex items-center gap-3 ${isFullscreen ? "hidden" : ""}`}>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="h-7 w-7 text-[var(--text-muted)]" aria-label="Zoom out"><ZoomOut size={13} /></Button>
          <div className="h-1 w-20 rounded-full bg-black/10 overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-gold)] transition-all" style={{ width: `${((zoom - 0.5) / 1) * 100}%` }} /></div>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="h-7 w-7 text-[var(--text-muted)]" aria-label="Zoom in"><ZoomIn size={13} /></Button>
        </div>

        <p className={`mt-2 text-[10px] text-[var(--text-muted)]/60 ${isFullscreen ? "hidden" : ""}`}>Click left/right • drag • scroll • ← → keys • Ctrl+K search</p>

        <div className={`mt-4 flex items-center gap-3 ${isFullscreen ? "hidden" : ""}`}>
          <DownloadPdfButton pageList={displayPageList} pdfImages={pdfImages} data={data} pdfImageDimensions={pdfImageDimensions} />
          <DownloadFlipbookButton pageList={displayPageList} pdfImages={pdfImages} data={data} />
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-black/60 backdrop-blur-md px-4 py-2">
          <button onClick={goPrev} disabled={currentPage <= 0 || isFlipping} className="text-white/80 hover:text-white disabled:opacity-30 transition-colors" aria-label="Previous page">
            <ChevronLeft size={20} />
          </button>
          <span className="text-white/60 text-xs min-w-[60px] text-center">{currentPage === 0 ? "Cover" : currentPage === totalPages - 1 ? "End" : `${currentPage}/${totalPages - 1}`}</span>
          <button onClick={goNext} disabled={currentPage >= totalPages - 1 || isFlipping} className="text-white/80 hover:text-white disabled:opacity-30 transition-colors" aria-label="Next page">
            <ChevronRight size={20} />
          </button>
          <button onClick={toggleFullscreen} className="text-white/80 hover:text-white ml-2 transition-colors" aria-label="Exit fullscreen">
            <Minimize2 size={16} />
          </button>
        </div>
      )}

      {search && filtered.length === 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 backdrop-blur-md px-4 py-3 text-center">
          <p className="text-sm text-[var(--text-muted)]">No students found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}