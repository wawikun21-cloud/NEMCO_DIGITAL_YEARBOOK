import { useState, useEffect, useRef, useCallback, useMemo, forwardRef } from "react"
import HTMLFlipBook from "react-pageflip"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPublicFlipbook } from "@/services/flipbookService"
import DownloadPdfButton from "@/components/student/DownloadPdfButton"
import DownloadFlipbookButton from "@/components/student/DownloadFlipbookButton"
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

  const recomputeAspectRatio = useCallback(() => {
    const values = Object.values(dimsRef.current)
    if (values.length === 0) return
    const avgRatio = values.reduce((sum, d) => sum + d.width / d.height, 0) / values.length
    setAspectRatio(avgRatio)
  }, [])

  function processQueue() {
    while (concurrencyRef.current < 3 && queueRef.current.length > 0) {
      const task = queueRef.current.shift()
      concurrencyRef.current++
      task().finally(() => {
        concurrencyRef.current--
        processQueue()
      })
    }
  }

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
      processQueue()
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

  return { images, loading, aspectRatio, pdfPageCounts, renderEager, enqueueLazy }
}

const StudentPage = forwardRef(function StudentPage({ profile, pageNum, totalPages, visible }, ref) {
  if (!profile || !visible) return <div ref={ref} className="flex h-full w-full items-center justify-center bg-white" />
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
        {profile.bio && <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-secondary)] text-center max-w-xs">{profile.bio}</p>}
        {profile.quote && <blockquote className="mt-3 border-l-2 border-[var(--bg-primary)]/40 pl-2.5 text-[11px] italic text-[var(--text-muted)] max-w-xs text-center">"{profile.quote}"</blockquote>}
      </div>
      <div className="text-center pt-2"><span className="text-[9px] text-[var(--text-muted)]/50">{pageNum} / {totalPages}</span></div>
    </div>
  )
})

const StudentBackPage = forwardRef(function StudentBackPage({ profile, visible }, ref) {
  if (!profile || !visible) return <div ref={ref} className="flex h-full w-full bg-[#fafafa]" />
  const pr = profile
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-[#fafafa] p-5 text-center">
      <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)]/5 flex items-center justify-center mb-3"><GraduationCap size={20} className="text-[var(--bg-primary)]/30" /></div>
      <p className="text-[10px] text-[var(--text-muted)]/40 italic max-w-[200px]">"{pr.quote || "The future belongs to those who believe in the beauty of their dreams."}"</p>
    </div>
  )
})

const BookCover = forwardRef(function BookCover({ title, subtitle, onClick }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#132F45] to-[#0d1f33] p-6 text-center relative overflow-hidden" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)" }} />
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent-gold)] to-transparent" />
      <div className="relative z-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10"><GraduationCap size={36} className="text-[var(--accent-gold)]" /></div>
        <h1 className="text-2xl font-extrabold text-white sm:text-3xl tracking-tight leading-tight">{title || "NEMCO Digital Yearbook"}</h1>
        {subtitle && <p className="mt-2 text-sm text-white/60 font-light">{subtitle}</p>}
      </div>
    </div>
  )
})

const BackCover = forwardRef(function BackCover({ title }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0d1f33] via-[#132F45] to-[#1a3a5c] p-6 text-center">
      <Heart size={32} className="mb-3 text-[var(--accent-gold)]/60" />
      <p className="text-lg font-bold text-white/80">{title || "NEMCO"}</p>
      <p className="mt-1 text-xs text-white/40">Digital Yearbook</p>
      <div className="mt-4 h-px w-16 bg-white/10" />
      <p className="mt-4 text-[10px] text-white/30">Made with ❤ by NEMCO</p>
    </div>
  )
})

const SectionPage = forwardRef(function SectionPage({ name }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--bg-primary)]/3 via-white to-[var(--bg-primary)]/3 p-6">
      <div className="h-px w-16 bg-[var(--bg-primary)]/20 mb-4" />
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-primary)]/8 mb-3"><Sparkles size={20} className="text-[var(--bg-primary)]" /></div>
      <h3 className="text-lg font-bold text-[var(--text-primary)]">{name}</h3>
      <div className="mt-2 h-0.5 w-12 rounded-full bg-[var(--accent-gold)]/40" />
      <div className="h-px w-16 bg-[var(--bg-primary)]/20 mt-4" />
    </div>
  )
})

const PdfPageContent = forwardRef(function PdfPageContent({ imageUrl, title, pageNum, isLoading }, ref) {
  return (
    <div ref={ref} className="flex h-full w-full flex-col bg-white">
      <div className="flex-1 relative flex items-center justify-center">
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
      <div className="text-center py-1.5 border-t border-gray-100"><span className="text-[9px] text-[var(--text-muted)]/50">{title} • Page {pageNum}</span></div>
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
  const [coverReady, setCoverReady] = useState(false)
  const [pendingPage, setPendingPage] = useState(null)
  const [bookState, setBookState] = useState("read")

  const containerRef = useRef(null)
  const bookRef = useRef(null)
  const audioCtxRef = useRef(null)
  const searchInputRef = useRef(null)
  const prevSearchOpen = useRef(false)

  useEffect(() => {
    let cancelled = false
    getPublicFlipbook()
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setCoverReady(true)
        }
      })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setDataLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (data?.settings?.flip_speed) setFlipSpeed(data.settings.flip_speed)
  }, [data?.settings?.flip_speed])

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
        let pageIdx = 1
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

  const pdfPages = useMemo(() => (data?.pdfPages || []), [data?.pdfPages])
  const { images: pdfImages, loading: pdfLoading, aspectRatio: pdfAspectRatio, pdfPageCounts, renderEager, enqueueLazy } = usePdfPageImages(pdfPages)

  const profiles = (data?.profiles || []).filter((p) => p.profile)
  const sections = (data?.sections || [])

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
    const pages = [{ type: "cover" }]
    if (sourceType === "profiles") {
      if (sections.length > 0) {
        const sectionMap = new Map(), unsectioned = []
        for (const fp of profiles) { const sn = fp.section_name || ""; if (sn) { if (!sectionMap.has(sn)) sectionMap.set(sn, []); sectionMap.get(sn).push(fp) } else unsectioned.push(fp) }
        for (const sec of sections) {
          pages.push({ type: "section", name: sec.name })
          for (const sp of (sectionMap.get(sec.name) || [])) {
            pages.push({ type: "student", data: sp })
            pages.push({ type: "student-back", data: sp })
          }
        }
        for (const up of unsectioned) {
          pages.push({ type: "student", data: up })
          pages.push({ type: "student-back", data: up })
        }
      } else {
        for (const fp of profiles) {
          pages.push({ type: "student", data: fp })
          pages.push({ type: "student-back", data: fp })
        }
      }
    } else if (sourceType === "pdfs") {
      for (const pdf of pdfPages) { const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i }) }
    } else {
      if (sections.length > 0) {
        const sectionMap = new Map(), unsectioned = []
        for (const fp of profiles) { const sn = fp.section_name || ""; if (sn) { if (!sectionMap.has(sn)) sectionMap.set(sn, []); sectionMap.get(sn).push(fp) } else unsectioned.push(fp) }
        const pdfSectionMap = new Map(), unsectionedPdfs = []
        for (const pdf of pdfPages) { const sn = pdf.section_name || ""; if (sn) { if (!pdfSectionMap.has(sn)) pdfSectionMap.set(sn, []); pdfSectionMap.get(sn).push(pdf) } else unsectionedPdfs.push(pdf) }
        for (const sec of sections) {
          pages.push({ type: "section", name: sec.name })
          for (const sp of (sectionMap.get(sec.name) || [])) {
            pages.push({ type: "student", data: sp })
            pages.push({ type: "student-back", data: sp })
          }
          for (const pdf of (pdfSectionMap.get(sec.name) || [])) { const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i }) }
        }
        for (const up of unsectioned) {
          pages.push({ type: "student", data: up })
          pages.push({ type: "student-back", data: up })
        }
        for (const pdf of unsectionedPdfs) { const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i }) }
      } else {
        let pi = 0
        for (let i = 0; i < profiles.length; i++) {
          pages.push({ type: "student", data: profiles[i] })
          pages.push({ type: "student-back", data: profiles[i] })
          if ((i + 1) % 2 === 0 && pi < pdfPages.length) { pages.push({ type: "pdf", data: pdfPages[pi], pageNum: 1 }); pi++ }
        }
        while (pi < pdfPages.length) { const pdf = pdfPages[pi]; const count = pdfPageCounts[pdf.id] || pdf.page_count || 1; for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i }); pi++ }
      }
    }
    pages.push({ type: "back-cover" })
    return pages
  }, [profiles, sections, pdfPages, data?.sourceType, pdfPageCounts])

  const displayPageList = useMemo(() => {
    if (!filtered) return bookPageList
    return bookPageList.filter((pg) => {
      if (pg.type === "cover" || pg.type === "back-cover" || pg.type === "section" || pg.type === "pdf") return true
      if (pg.type === "student" || pg.type === "student-back") return filteredIdSet.has(pg.data.profile?.id)
      return true
    })
  }, [bookPageList, filtered, filteredIdSet])

  const totalPages = bookPageList.length

  const pdfListStable = pdfPages.length === 0 || !pdfLoading

  useEffect(() => {
    if (!pdfPages.length || !data) return
    const pdfIndices = []
    bookPageList.forEach((pg, idx) => {
      if (pg.type === "pdf") pdfIndices.push({ idx, pdfId: pg.data.id, pageNum: pg.pageNum })
    })
    for (const { idx, pdfId, pageNum } of pdfIndices) {
      const dist = Math.abs(idx - currentPage)
      if (dist <= 2) {
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
      setCurrentPage(targetPage)
      playFlipSound()
      const params = new URLSearchParams(window.location.search)
      params.set("page", targetPage.toString())
      window.history.replaceState(null, "", `${window.location.pathname}?${params}`)
    } else {
      pf.flip(targetPage, "bottom")
    }
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
      if (pf && currentPage !== 0) {
        pf.turnToPage(currentPage)
      }
    }
  }, [currentPage])

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

  const handleCoverClick = useCallback(() => {
    if (currentPage === 0 && bookState === "read") {
      goNext()
    }
  }, [currentPage, bookState, goNext])

  const isFlipping = bookState === "flipping"

  const bookAspectRatio = pdfAspectRatio || 3 / 4
  const bookWidth = 400
  const bookHeight = Math.round(bookWidth / bookAspectRatio)

  const pageLabel = currentPage === 0 ? "Cover" : currentPage === totalPages - 1 ? "Back Cover" : `${currentPage} / ${totalPages - 1}`

  if (dataLoading && !coverReady) return (
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

  return (
    <div ref={containerRef} className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"}`}
      style={{ background: isFullscreen ? "linear-gradient(135deg, rgba(30,20,10,0.95) 0%, rgba(15,25,40,0.97) 50%, rgba(10,15,30,0.95) 100%)" : "linear-gradient(135deg, #faf8f5 0%, #f0ede8 30%, #e8e4de 60%, #f0ede8 100%)" }}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-64 w-64 rounded-full bg-amber-500/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-[var(--bg-primary)]/[0.04] blur-3xl" />
      </div>

      <div aria-live="polite" className="sr-only">{pageLabel}</div>

      <header className="relative z-10 border-b border-black/5 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-primary)]/70 shadow-lg shadow-[var(--bg-primary)]/20">
              <BookMarked size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{data?.settings?.title || "NEMCO Digital Yearbook"}</h1>
              {data?.settings?.subtitle && <p className="text-[10px] text-[var(--text-muted)] leading-tight">{data.settings.subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {searchOpen ? (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <Input ref={searchInputRef} type="text" placeholder="Search students…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 w-44 pl-9 pr-8 text-xs" />
                <button onClick={() => { setSearchOpen(false); setSearch("") }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]" aria-label="Close search"><X size={14} /></button>
              </div>
            ) : (
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setSearchOpen(true)} aria-label="Search (Ctrl+K)"><Search size={15} /></Button>
            )}
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setShowStrip(!showStrip)} aria-label="Page thumbnails"><Grid3X3 size={15} /></Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </Button>
            <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setSoundEnabled(!soundEnabled)} aria-label={soundEnabled ? "Mute" : "Sound on"}>
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </Button>
            {pdfPages.length > 0 && (
              <span className="rounded-md bg-[var(--bg-primary)]/10 px-2 py-1 text-[10px] font-medium text-[var(--bg-primary)]">PDF</span>
            )}
          </div>
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-2xl px-8">
        <div className="h-0.5 rounded-full bg-black/10 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)]/80 to-[var(--accent-gold)] transition-all duration-500 ease-out"
            style={{ width: `${totalPages > 1 ? (currentPage / (totalPages - 1)) * 100 : 0}%` }} />
        </div>
      </div>

      {showStrip && (
        <div className="relative z-10 border-b border-black/5 bg-white/50 backdrop-blur-sm">
          <PageStrip pages={displayPageList} currentPage={displayCurrentPage} onSelect={handleStripSelect} disabled={isFlipping} />
        </div>
      )}

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-6 overflow-hidden">
        {pdfPages.length > 0 && pdfLoading && (
          <div className="flex flex-col items-center gap-3 mb-4">
            <div className="relative"><div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-gold)]/20" /><BookMarked size={40} className="relative text-[var(--accent-gold)] animate-pulse" /></div>
            <p className="text-sm text-[var(--text-muted)] font-light">Rendering PDF pages…</p>
            <div className="h-1 w-32 rounded-full bg-black/10 overflow-hidden mt-2"><div className="h-full rounded-full bg-[var(--accent-gold)] animate-pulse" style={{ width: "60%" }} /></div>
          </div>
        )}

        <div style={{ transform: `scale(${zoom})`, transformOrigin: "center center", width: "100%", display: "flex", justifyContent: "center" }}>
          {pdfListStable ? (
          <HTMLFlipBook
            key={bookPageList.length}
            ref={bookRef}
            width={bookWidth}
            height={bookHeight}
            size="stretch"
            minWidth={250}
            maxWidth={600}
            minHeight={350}
            maxHeight={800}
            showCover={true}
            drawShadow={true}
            maxShadowOpacity={0.5}
            flippingTime={Math.round(flipSpeed * 1000)}
            usePortrait={true}
            startPage={initialPage !== null ? initialPage : 0}
            clickEventForward={true}
            mobileScrollSupport={true}
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

              if (page.type === "cover") {
                return (
                  <BookCover key="cover" title={data?.settings?.title} subtitle={data?.settings?.subtitle} onClick={handleCoverClick} />
                )
              }
              if (page.type === "back-cover") {
                return (
                  <BackCover key="back-cover" title={data?.settings?.title} />
                )
              }
              if (page.type === "section") {
                return (
                  <SectionPage key={`section-${page.name}`} name={page.name} />
                )
              }
              if (page.type === "student") {
                return (
                  <StudentPage key={`student-${page.data.profile?.id || idx}`} profile={page.data.profile} pageNum={idx} totalPages={totalPages - 2} visible={visible} />
                )
              }
              if (page.type === "student-back") {
                return (
                  <StudentBackPage key={`student-back-${page.data.profile?.id || idx}`} profile={page.data.profile} visible={visible} />
                )
              }
              if (page.type === "pdf") {
                const img = pdfImages[`${page.data.id}-${page.pageNum}`]
                return (
                  <PdfPageContent key={`pdf-${page.data.id}-${page.pageNum}`} imageUrl={img} title={page.data.title} pageNum={page.pageNum} isLoading={!img && pdfLoading} />
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

        <div className="mt-4 w-full max-w-xs">
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

        <div className="mt-6 flex items-center gap-5">
          <Button variant="outline" size="icon" onClick={goPrev} disabled={currentPage <= 0 || isFlipping}
            className="h-11 w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/90 backdrop-blur-sm hover:bg-white"
            aria-label="Previous page">
            <ChevronLeft size={22} />
          </Button>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(totalPages, 11) }, (_, i) => {
              let pn
              if (totalPages <= 11) pn = i
              else { const s = Math.max(0, Math.min(currentPage - 5, totalPages - 11)); pn = s + i }
              return (
                <button key={pn} onClick={() => jumpToPage(pn)} disabled={isFlipping}
                  aria-label={pn === 0 ? "Cover" : `Page ${pn}`}
                  className={`rounded-full transition-all duration-300 ${pn === currentPage ? "w-7 h-2.5 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/80 shadow-md shadow-[var(--accent-gold)]/30" : pn === 0 ? "w-2.5 h-2.5 bg-[var(--bg-primary)]/25 hover:bg-[var(--bg-primary)]/50" : "w-2.5 h-2.5 bg-black/10 hover:bg-black/20"}`} />
              )
            })}
          </div>
          <Button variant="outline" size="icon" onClick={goNext} disabled={currentPage >= totalPages - 1 || isFlipping}
            className="h-11 w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/90 backdrop-blur-sm hover:bg-white"
            aria-label="Next page">
            <ChevronRight size={22} />
          </Button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="h-7 w-7 text-[var(--text-muted)]" aria-label="Zoom out"><ZoomOut size={13} /></Button>
          <div className="h-1 w-20 rounded-full bg-black/10 overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-gold)] transition-all" style={{ width: `${((zoom - 0.5) / 1) * 100}%` }} /></div>
          <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="h-7 w-7 text-[var(--text-muted)]" aria-label="Zoom in"><ZoomIn size={13} /></Button>
        </div>

        <p className="mt-2 text-[10px] text-[var(--text-muted)]/60">Click left/right • drag • scroll • ← → keys • Ctrl+K search</p>

        <div className="mt-4 flex items-center gap-3">
          <DownloadPdfButton pageList={displayPageList} pdfImages={pdfImages} data={data} />
          <DownloadFlipbookButton pageList={displayPageList} pdfImages={pdfImages} data={data} />
        </div>
      </div>

      {search && filtered.length === 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 backdrop-blur-md px-4 py-3 text-center">
          <p className="text-sm text-[var(--text-muted)]">No students found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
