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
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getPublicFlipbook } from "@/services/flipbookService"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString()

/* ─── PDF page image renderer — renders ALL pages of each PDF ─── */
function usePdfPageImages(pdfPages) {
  const [images, setImages] = useState({})
  const [pageAspectRatios, setPageAspectRatios] = useState({})
  const [realPageCounts, setRealPageCounts] = useState({})
  const [pdfPixelSize, setPdfPixelSize] = useState(null)
  const [loading, setLoading] = useState(false)
  const cacheRef = useRef({})
  const ratioCacheRef = useRef({})

  useEffect(() => {
    if (!pdfPages || pdfPages.length === 0) {
      setImages({})
      setPageAspectRatios({})
      setRealPageCounts({})
      setPdfPixelSize(null)
      return
    }

    let cancelled = false
    setLoading(true)

    async function renderPages() {
      const newImages = {}
      const newRatios = {}
      const newCounts = {}
      const tasks = []
      let firstSize = null

      for (const pdf of pdfPages) {
        tasks.push((async () => {
          try {
            const loadingTask = pdfjsLib.getDocument(pdf.file_url)
            const pdfDoc = await loadingTask.promise
            const totalPages = pdfDoc.numPages
            newCounts[pdf.id] = totalPages

            for (let p = 1; p <= totalPages; p++) {
              const key = `${pdf.id}-${p}`
              if (cacheRef.current[key]) {
                newImages[key] = cacheRef.current[key]
                continue
              }
              const page = await pdfDoc.getPage(p)
              const viewport = page.getViewport({ scale: 2.0 })
              const canvas = document.createElement("canvas")
              canvas.width = viewport.width
              canvas.height = viewport.height
              const ctx = canvas.getContext("2d")
              await page.render({ canvasContext: ctx, viewport }).promise
              const dataUrl = canvas.toDataURL("image/jpeg", 0.9)
              cacheRef.current[key] = dataUrl
              newImages[key] = dataUrl

              if (p === 1) {
                const aspect = viewport.width / viewport.height
                ratioCacheRef.current[pdf.id] = aspect
                newRatios[pdf.id] = aspect
                if (!firstSize) {
                  firstSize = { width: viewport.width, height: viewport.height }
                }
              }
            }
          } catch {
            // skip broken PDF
          }
        })())
      }

      await Promise.allSettled(tasks)
      if (!cancelled) {
        setImages((prev) => ({ ...prev, ...newImages }))
        setPageAspectRatios((prev) => ({ ...prev, ...newRatios }))
        setRealPageCounts((prev) => ({ ...prev, ...newCounts }))
        if (firstSize) setPdfPixelSize(firstSize)
        setLoading(false)
      }
    }

    renderPages()
    return () => { cancelled = true }
  }, [pdfPages])

  return { images, loading, pageAspectRatios, realPageCounts, pdfPixelSize }
}

/* ─── Student page content ─── */
function StudentPage({ profile, pageNum, totalPages }) {
  if (!profile) return <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Empty page</div>
  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()

  return (
    <div className="flex h-full w-full flex-col p-5 sm:p-6">
      <div className="flex flex-1 flex-col items-center">
        <div className="w-full h-1 rounded-full bg-gradient-to-r from-transparent via-[var(--bg-primary)]/20 to-transparent mb-4" />
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={name} className="h-24 w-24 rounded-full object-cover ring-4 ring-[var(--bg-primary)]/10 shadow-lg sm:h-32 sm:w-32" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[var(--bg-primary)]/10 to-[var(--bg-primary)]/20 text-4xl font-bold text-[var(--bg-primary)] ring-4 ring-[var(--bg-primary)]/10 shadow-lg sm:h-32 sm:w-32 sm:text-5xl">
            {initial}
          </div>
        )}
        <h2 className="mt-4 text-lg font-bold text-[var(--text-primary)] sm:text-xl">{name}</h2>
        {profile.student_number && <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{profile.student_number}</p>}
        <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
          {profile.course_or_strand && <span className="rounded-full bg-[var(--bg-primary)]/8 px-2.5 py-0.5 text-[10px] font-medium text-[var(--bg-primary)]">{profile.course_or_strand}</span>}
          {profile.year_level && <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{profile.year_level}</span>}
          {profile.section && <span className="rounded-full bg-[var(--bg-subtle)] px-2.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">{profile.section}</span>}
        </div>
        {profile.bio && <p className="mt-3 text-[11px] leading-relaxed text-[var(--text-secondary)] text-center max-w-xs">{profile.bio}</p>}
        {profile.quote && (
          <blockquote className="mt-3 border-l-2 border-[var(--bg-primary)]/40 pl-2.5 text-[11px] italic text-[var(--text-muted)] max-w-xs text-center">
            &ldquo;{profile.quote}&rdquo;
          </blockquote>
        )}
      </div>
      <div className="text-center pt-2">
        <span className="text-[9px] text-[var(--text-muted)]/50">{pageNum} / {totalPages}</span>
      </div>
    </div>
  )
}

/* ─── PDF page content (rendered as image) ─── */
function PdfPageContent({ imageUrl, title, pageNum, isLoading }) {
  return (
    <div className="flex h-full w-full flex-col bg-white">
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
      <div className="text-center py-1.5 border-t border-gray-100">
        <span className="text-[9px] text-[var(--text-muted)]/50">{title} • Page {pageNum}</span>
      </div>
    </div>
  )
}

/* ─── Cover ─── */
function BookCover({ title, subtitle }) {
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

/* ─── Section divider ─── */
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

/* ═══════════════════════════════════════════════════════════════
   GLOBAL CURL KEYFRAMES (injected once)
   These are shared between PageLeaf animations and desk shadow.
   ═══════════════════════════════════════════════════════════════ */

const CURL_STYLE_ID = 'curl-global-keyframes'
if (!document.getElementById(CURL_STYLE_ID)) {
  const gs = document.createElement('style')
  gs.id = CURL_STYLE_ID
  gs.textContent = `
    @keyframes curl-desk-shadow {
      0%   { transform: scaleX(1) scaleY(1) rotateX(60deg); opacity: 0.06; }
      30%  { transform: scaleX(1.4) scaleY(1.6) rotateX(60deg); opacity: 0.14; }
      50%  { transform: scaleX(1.6) scaleY(2) rotateX(60deg); opacity: 0.18; }
      70%  { transform: scaleX(1.4) scaleY(1.6) rotateX(60deg); opacity: 0.14; }
      100% { transform: scaleX(1) scaleY(1) rotateX(60deg); opacity: 0.06; }
    }
  `
  document.head.appendChild(gs)
}

/* ═══════════════════════════════════════════════════════════════
   REALISTIC PAGE CURL — single page with moving fold clip
   
   Core technique: ONE page element that rotates with the flip.
   A separate "flat" overlay stays in place and reveals content
   progressively as the fold line sweeps across.
   
   The visual curl comes from:
   1. The page lifts with rotateY + translateZ + scaleX
   2. A dark fold shadow follows the curl point
   3. A bright edge highlight at the fold
   4. The flat portion is revealed by the curled page moving away
   5. Proper easing: slow start, fast middle, slow end (paper physics)
   ═══════════════════════════════════════════════════════════════ */

function buildCurlKeyframes(flipSpeed) {
  const id = `curl-${flipSpeed.toString().replace(".", "_")}`
  if (document.getElementById(id)) return id

  const style = document.createElement("style")
  style.id = id
  style.textContent = `
    /* ── Page flip: slow start → fast middle → slow end ── */
    @keyframes ${id}-flip-fwd {
      0%   { transform: rotateY(0deg)    translateZ(0px)    scaleX(1.00); }
      5%   { transform: rotateY(-2deg)   translateZ(5px)    scaleX(0.99); }
      12%  { transform: rotateY(-10deg)  translateZ(22px)   scaleX(0.96); }
      22%  { transform: rotateY(-24deg)  translateZ(48px)   scaleX(0.91); }
      32%  { transform: rotateY(-42deg)  translateZ(72px)   scaleX(0.86); }
      42%  { transform: rotateY(-66deg)  translateZ(88px)   scaleX(0.82); }
      50%  { transform: rotateY(-90deg)  translateZ(95px)   scaleX(0.80); }
      58%  { transform: rotateY(-114deg) translateZ(88px)   scaleX(0.82); }
      68%  { transform: rotateY(-138deg) translateZ(72px)   scaleX(0.86); }
      78%  { transform: rotateY(-156deg) translateZ(48px)   scaleX(0.91); }
      88%  { transform: rotateY(-170deg) translateZ(22px)   scaleX(0.96); }
      95%  { transform: rotateY(-178deg) translateZ(5px)    scaleX(0.99); }
      100% { transform: rotateY(-180deg) translateZ(0px)    scaleX(1.00); }
    }
    @keyframes ${id}-flip-bwd {
      0%   { transform: rotateY(-180deg) translateZ(0px)    scaleX(1.00); }
      5%   { transform: rotateY(-178deg) translateZ(5px)    scaleX(0.99); }
      12%  { transform: rotateY(-170deg) translateZ(22px)   scaleX(0.96); }
      22%  { transform: rotateY(-156deg) translateZ(48px)   scaleX(0.91); }
      32%  { transform: rotateY(-138deg) translateZ(72px)   scaleX(0.86); }
      42%  { transform: rotateY(-114deg) translateZ(88px)   scaleX(0.82); }
      50%  { transform: rotateY(-90deg)  translateZ(95px)   scaleX(0.80); }
      58%  { transform: rotateY(-66deg)  translateZ(88px)   scaleX(0.82); }
      68%  { transform: rotateY(-42deg)  translateZ(72px)   scaleX(0.86); }
      78%  { transform: rotateY(-24deg)  translateZ(48px)   scaleX(0.91); }
      88%  { transform: rotateY(-10deg)  translateZ(22px)   scaleX(0.96); }
      95%  { transform: rotateY(-2deg)   translateZ(5px)    scaleX(0.99); }
      100% { transform: rotateY(0deg)    translateZ(0px)    scaleX(1.00); }
    }

    /* ── Fold line position ── */
    @keyframes ${id}-fold-fwd {
      0%   { left: 0%;   opacity: 0; }
      5%   { opacity: 0.5; }
      50%  { left: 50%; opacity: 1; }
      95%  { opacity: 0.5; }
      100% { left: 100%; opacity: 0; }
    }
    @keyframes ${id}-fold-bwd {
      0%   { left: 100%; opacity: 0; }
      5%   { opacity: 0.5; }
      50%  { left: 50%;  opacity: 1; }
      95%  { opacity: 0.5; }
      100% { left: 0%;   opacity: 0; }
    }

    /* ── Curl shadow sweep ── */
    @keyframes ${id}-shadow-fwd {
      0%   { background-position: -100% 0; opacity: 0; }
      10%  { opacity: 0.2; }
      30%  { opacity: 0.4; }
      50%  { opacity: 0.5; background-position: 50% 0; }
      70%  { opacity: 0.35; }
      90%  { opacity: 0.1; }
      100% { background-position: 200% 0; opacity: 0; }
    }
    @keyframes ${id}-shadow-bwd {
      0%   { background-position: 200% 0; opacity: 0; }
      10%  { opacity: 0.1; }
      30%  { opacity: 0.35; }
      50%  { opacity: 0.5; background-position: 50% 0; }
      70%  { opacity: 0.4; }
      90%  { opacity: 0.2; }
      100% { background-position: -100% 0; opacity: 0; }
    }

    /* ── Sheen sweep ── */
    @keyframes ${id}-sheen-fwd {
      0%   { background-position: -150% 0; opacity: 0; }
      20%  { opacity: 0.15; }
      40%  { opacity: 0.35; }
      50%  { opacity: 0.45; }
      60%  { opacity: 0.35; }
      80%  { opacity: 0.15; }
      100% { background-position: 250% 0; opacity: 0; }
    }
    @keyframes ${id}-sheen-bwd {
      0%   { background-position: 250% 0; opacity: 0; }
      20%  { opacity: 0.15; }
      40%  { opacity: 0.35; }
      50%  { opacity: 0.45; }
      60%  { opacity: 0.35; }
      80%  { opacity: 0.15; }
      100% { background-position: -150% 0; opacity: 0; }
    }

    /* ── Fold edge glow ── */
    @keyframes ${id}-glow-fwd {
      0%   { left: -2%;  opacity: 0; }
      10%  { left: 8%;   opacity: 0.6; }
      30%  { left: 28%;  opacity: 0.9; }
      50%  { left: 50%;  opacity: 1; }
      70%  { left: 72%;  opacity: 0.9; }
      90%  { left: 92%;  opacity: 0.6; }
      100% { left: 102%; opacity: 0; }
    }
    @keyframes ${id}-glow-bwd {
      0%   { left: 102%; opacity: 0; }
      10%  { left: 92%;  opacity: 0.6; }
      30%  { left: 72%;  opacity: 0.9; }
      50%  { left: 50%;  opacity: 1; }
      70%  { left: 28%;  opacity: 0.9; }
      90%  { left: 8%;   opacity: 0.6; }
      100% { left: -2%;  opacity: 0; }
    }

    /* ── Desk shadow pulse ── */
    @keyframes ${id}-desk-shadow {
      0%   { transform: scaleX(1) scaleY(1); opacity: 0.06; }
      25%  { transform: scaleX(1.3) scaleY(1.5); opacity: 0.12; }
      50%  { transform: scaleX(1.5) scaleY(1.8); opacity: 0.16; }
      75%  { transform: scaleX(1.3) scaleY(1.5); opacity: 0.12; }
      100% { transform: scaleX(1) scaleY(1); opacity: 0.06; }
    }
  `
  document.head.appendChild(style)
  return id
}

/* ═══════════════════════════════════════════════════
   3D PAGE LEAF — single page with curl overlays
   ═══════════════════════════════════════════════════ */
function PageLeaf({ frontContent, backContent, pageIndex, currentPage, totalLeaves, isFlipping, flipDirection, flipSpeed }) {
  const isFlipped = pageIndex < currentPage

  const isTurning = isFlipping && (
    (flipDirection === "next" && pageIndex === currentPage) ||
    (flipDirection === "prev" && pageIndex === currentPage - 1)
  )

  const curlAnimId = useMemo(() => buildCurlKeyframes(flipSpeed), [flipSpeed])

  const getZ = () => {
    if (isTurning) return totalLeaves + 10
    if (isFlipped) return pageIndex
    return totalLeaves - pageIndex
  }

  const isForward = flipDirection === "next"
  const animDir = isForward ? "fwd" : "bwd"

  const getRestTransform = () => {
    if (isTurning) return undefined
    return isFlipped ? "rotateY(-180deg)" : "rotateY(0deg)"
  }

  return (
    <div
      className="absolute inset-0"
      style={{
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
        transform: getRestTransform(),
        zIndex: getZ(),
      }}
    >
      {/* ═══════════════════════════════════════════════
          MAIN PAGE — the single page that flips
          ═══════════════════════════════════════════════ */}
      <div
        className="absolute inset-0"
        style={{
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
          animation: isTurning
            ? `${curlAnimId}-flip-${animDir} ${flipSpeed}s cubic-bezier(0.22, 0.02, 0.28, 1) forwards`
            : undefined,
        }}
      >
        {/* Front face */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            borderRadius: "1px 4px 4px 1px",
            background: "#fff",
            boxShadow: isTurning
              ? "8px 0 45px rgba(0,0,0,0.2), 3px 0 18px rgba(0,0,0,0.08), inset -3px 0 8px rgba(0,0,0,0.04)"
              : "2px 0 12px rgba(0,0,0,0.06), inset -3px 0 6px rgba(0,0,0,0.03)",
          }}
        >
          {frontContent}

          {/* Paper texture */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.012]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }} />

          {/* Page edge */}
          <div className="absolute right-0 top-0 bottom-0 w-[2px] pointer-events-none" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.02), rgba(0,0,0,0.06))" }} />

          {/* ── Fold shadow — dark band at the curl point ── */}
          {isTurning && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                width: "24%",
                background: "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.14) 40%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.14) 60%, rgba(0,0,0,0.06) 80%, rgba(0,0,0,0) 100%)",
                animation: `${curlAnimId}-fold-${animDir} ${flipSpeed}s ease-in-out forwards`,
                mixBlendMode: "multiply",
                filter: "blur(4px)",
              }}
            />
          )}

          {/* ── Fold edge glow ── */}
          {isTurning && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                width: "2px",
                background: "linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 75%, rgba(255,255,255,0.05) 100%)",
                animation: `${curlAnimId}-glow-${animDir} ${flipSpeed}s ease-in-out forwards`,
                boxShadow: "0 0 8px rgba(255,255,255,0.3)",
              }}
            />
          )}

          {/* ── Curl shadow overlay ── */}
          {isTurning && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: isForward
                  ? "linear-gradient(85deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.07) 42%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.07) 58%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0) 100%)"
                  : "linear-gradient(275deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.07) 42%, rgba(0,0,0,0.12) 50%, rgba(0,0,0,0.07) 58%, rgba(0,0,0,0.02) 75%, rgba(0,0,0,0) 100%)",
                backgroundSize: "200% 100%",
                mixBlendMode: "multiply",
                borderRadius: "1px 4px 4px 1px",
                animation: `${curlAnimId}-shadow-${animDir} ${flipSpeed}s ease-in-out forwards`,
              }}
            />
          )}

          {/* ── Light sheen ── */}
          {isTurning && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(105deg, transparent 0%, transparent 30%, rgba(255,255,255,0.1) 42%, rgba(255,255,255,0.25) 48%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.25) 52%, rgba(255,255,255,0.1) 58%, transparent 70%, transparent 100%)",
                backgroundSize: "200% 100%",
                mixBlendMode: "overlay",
                borderRadius: "1px 4px 4px 1px",
                animation: `${curlAnimId}-sheen-${animDir} ${flipSpeed}s ease-in-out forwards`,
              }}
            />
          )}
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            borderRadius: "4px 1px 1px 4px",
            background: "#f8f8f8",
            boxShadow: isTurning
              ? "-6px 0 30px rgba(0,0,0,0.12), inset 3px 0 8px rgba(0,0,0,0.04)"
              : "-2px 0 12px rgba(0,0,0,0.05), inset 3px 0 6px rgba(0,0,0,0.03)",
          }}
        >
          {backContent}
          <div className="absolute left-0 top-0 bottom-0 w-[2px] pointer-events-none" style={{ background: "linear-gradient(to left, rgba(0,0,0,0.02), rgba(0,0,0,0.06))" }} />
          <div className="absolute inset-0 pointer-events-none opacity-[0.012]" style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
          }} />
        </div>
      </div>
    </div>
  )
}

/* ─── Book spine ─── */
function Spine() {
  return (
    <div
      className="absolute left-0 top-[-3px] bottom-[-3px]"
      style={{
        width: "18px",
        transform: "translateX(-9px)",
        zIndex: 10000,
        background: "linear-gradient(90deg, #2d3748 0%, #4a5568 20%, #718096 45%, #4a5568 75%, #2d3748 100%)",
        borderRadius: "4px 0 0 4px",
        boxShadow: "inset -3px 0 10px rgba(0,0,0,0.5), -4px 0 16px rgba(0,0,0,0.3)",
      }}
    >
      <div className="absolute inset-0 rounded-l" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 15%, rgba(0,0,0,0.1) 100%)" }} />
      <div className="absolute top-[12%] left-0 right-0 h-px bg-white/[0.04]" />
      <div className="absolute top-[88%] left-0 right-0 h-px bg-black/10" />
    </div>
  )
}

/* ─── Page thumbnails ─── */
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
              ) : pg?.type === "back-cover" ? (
                <Heart size={12} className="text-[var(--bg-primary)]/30" />
              ) : pg?.type === "section" ? (
                <Sparkles size={12} className="text-[var(--bg-primary)]/40" />
              ) : pg?.type === "pdf" ? (
                <div className="flex flex-col items-center gap-0.5">
                  <BookOpen size={10} className="text-[var(--bg-primary)]/50" />
                  <span className="text-[6px] text-[var(--text-muted)]/50">PDF</span>
                </div>
              ) : pg?.data?.profile ? (
                <div className="flex flex-col items-center gap-0.5">
                  {pg.data.profile.avatar_url ? (
                    <img src={pg.data.profile.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-white/20" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-primary)]/15 text-[9px] font-bold text-[var(--bg-primary)]">
                      {(pg.data.profile.display_name || "?").charAt(0)}
                    </div>
                  )}
                  <p className="w-full truncate text-center text-[6px] text-[var(--text-muted)]">
                    {(pg.data.profile.display_name || "").split(" ")[0]}
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

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
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
  const [bookDisplaySize, setBookDisplaySize] = useState(null)
  const [autoFlip, setAutoFlip] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [cornerHover, setCornerHover] = useState(false)
  const containerRef = useRef(null)
  const bookRef = useRef(null)
  const touchRef = useRef(null)
  const dragRef = useRef({ startX: 0, startY: 0, isDragging: false })
  const autoFlipTimerRef = useRef(null)
  const audioCtxRef = useRef(null)

  const flipSpeed = data?.settings?.flip_speed || 0.7

  /* ── Page flip sound (synthesized paper rustle) ── */
  const playFlipSound = useCallback(() => {
    if (!soundEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const now = ctx.currentTime

      // Noise burst for paper rustle
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        const t = i / bufferSize
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 8) * 0.3
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.value = 3000
      filter.Q.value = 0.8

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

      noise.connect(filter).connect(gain).connect(ctx.destination)
      noise.start(now)
      noise.stop(now + 0.15)
    } catch {
      // Audio not available
    }
  }, [soundEnabled])

  useEffect(() => {
    getPublicFlipbook().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const pdfPages = useMemo(() => (data?.pdfPages || []), [data?.pdfPages])
  const { images: pdfImages, pageAspectRatios, loading: pdfLoading, realPageCounts, pdfPixelSize } = usePdfPageImages(pdfPages)

  const profiles = (data?.profiles || []).filter((p) => p.profile)
  const sections = (data?.sections || [])

  const filtered = useMemo(() => {
    if (!search) return profiles
    return profiles.filter((p) => {
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
  }, [profiles, search])

  /* ── Build the complete page list ──
     Order: Cover → [Section Divider + Students + PDF pages interleaved] → Back Cover
     
     PDF pages are inserted into the book based on their sort_order relative to student pages.
     The source_type setting controls whether we show profiles, PDFs, or both.
  */
  const pageList = useMemo(() => {
    const sourceType = data?.sourceType || "profiles"
    const pages = [{ type: "cover" }]

    if (sourceType === "profiles") {
      // Profiles only
      if (sections.length > 0) {
        const sectionMap = new Map()
        const unsectioned = []
        for (const fp of filtered) {
          const sn = fp.section_name || ""
          if (sn) {
            if (!sectionMap.has(sn)) sectionMap.set(sn, [])
            sectionMap.get(sn).push(fp)
          } else unsectioned.push(fp)
        }
        for (const sec of sections) {
          pages.push({ type: "section", name: sec.name })
          for (const sp of (sectionMap.get(sec.name) || [])) pages.push({ type: "student", data: sp })
        }
        for (const up of unsectioned) pages.push({ type: "student", data: up })
      } else {
        for (const fp of filtered) pages.push({ type: "student", data: fp })
      }
    } else if (sourceType === "pdfs") {
      // PDFs only — each PDF becomes a page, multi-page PDFs become multiple pages
      for (const pdf of pdfPages) {
        const count = realPageCounts[pdf.id] || pdf.page_count || 1
        for (let i = 1; i <= count; i++) {
          pages.push({ type: "pdf", data: pdf, pageNum: i })
        }
      }
    } else {
      // Combined — interleave sections, students, and PDFs by sort order
      // Strategy: sections first with their students, then PDF pages inserted between sections
      // PDFs with section_name go into their matching section; others go at the end
      if (sections.length > 0) {
        const sectionMap = new Map()
        const unsectioned = []
        for (const fp of filtered) {
          const sn = fp.section_name || ""
          if (sn) {
            if (!sectionMap.has(sn)) sectionMap.set(sn, [])
            sectionMap.get(sn).push(fp)
          } else unsectioned.push(fp)
        }

        // Group PDFs by section
        const pdfSectionMap = new Map()
        const unsectionedPdfs = []
        for (const pdf of pdfPages) {
          const sn = pdf.section_name || ""
          if (sn) {
            if (!pdfSectionMap.has(sn)) pdfSectionMap.set(sn, [])
            pdfSectionMap.get(sn).push(pdf)
          } else unsectionedPdfs.push(pdf)
        }

        for (const sec of sections) {
          pages.push({ type: "section", name: sec.name })
          // Students in this section
          for (const sp of (sectionMap.get(sec.name) || [])) pages.push({ type: "student", data: sp })
          // PDFs in this section
          for (const pdf of (pdfSectionMap.get(sec.name) || [])) {
            const count = realPageCounts[pdf.id] || pdf.page_count || 1
            for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i })
          }
        }
        // Unsectioned students
        for (const up of unsectioned) pages.push({ type: "student", data: up })
        // Unsectioned PDFs
        for (const pdf of unsectionedPdfs) {
          const count = realPageCounts[pdf.id] || pdf.page_count || 1
          for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i })
        }
      } else {
        // No sections — interleave students and PDFs by order
        let pi = 0
        for (let i = 0; i < filtered.length; i++) {
          pages.push({ type: "student", data: filtered[i] })
          // Insert a PDF page after every 2 student pages
          if ((i + 1) % 2 === 0 && pi < pdfPages.length) {
            const pdf = pdfPages[pi]
            pages.push({ type: "pdf", data: pdf, pageNum: 1 })
            pi++
          }
        }
        // Remaining PDFs
        while (pi < pdfPages.length) {
          const pdf = pdfPages[pi]
          const count = realPageCounts[pdf.id] || pdf.page_count || 1
          for (let i = 1; i <= count; i++) pages.push({ type: "pdf", data: pdf, pageNum: i })
          pi++
        }
      }
    }

    pages.push({ type: "back-cover" })
    return pages
  }, [filtered, sections, pdfPages, data?.sourceType, realPageCounts])

  const totalLeaves = pageList.length

  /* ── Compute book aspect ratio from actual PDF image dimensions ──
     We measure the rendered pixel dimensions of the first PDF page image
     to get the true aspect ratio. The book container matches this so
     pages aren't stretched. Student-only books use a classic 3/2.
     We add ~8% width to account for the spine visual.  */
  const bookAspectRatio = useMemo(() => {
    // Find the first PDF image that has been rendered
    const firstPdfImageKey = pdfPages.length > 0 ? `${pdfPages[0].id}-1` : null
    if (firstPdfImageKey && pdfImages[firstPdfImageKey]) {
      // Use the natural image aspect ratio from the rendered data URL
      const img = new Image()
      img.src = pdfImages[firstPdfImageKey]
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        const pageRatio = img.naturalWidth / img.naturalHeight
        // Add ~10% for the spine visual width
        const bookRatio = pageRatio * 1.1
        // Clamp to reasonable range
        const clamped = Math.max(0.6, Math.min(1.3, bookRatio))
        return `${clamped * 100}/100`
      }
    }
    // Fallback: use viewport ratios from the hook
    const ratios = Object.values(pageAspectRatios)
    if (ratios.length > 0) {
      const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
      const withSpine = avg * 1.1
      const clamped = Math.max(0.6, Math.min(1.3, withSpine))
      return `${clamped * 100}/100`
    }
     return "3/2"
   }, [pdfImages, pageAspectRatios, pdfPages])

   const bookNumericRatio = useMemo(() => {
     const parts = bookAspectRatio.split("/")
     const w = parseFloat(parts[0])
     const h = parseFloat(parts[1])
     return w / h
   }, [bookAspectRatio])

   /* ── Compute book display size to fit the available container ──
      Uses the PDF's natural pixel dimensions (or a sensible default)
      and scales them down to fit within the container width/height.
      This prevents 0-height when pdfPixelSize is null and prevents
      oversized books when raw PDF pixels are too large. */
   useEffect(() => {
     function computeSize() {
       const container = containerRef.current
       if (!container) return

       // Available space: use the container's parent or the container itself
       const parent = container.parentElement
       const availW = parent ? parent.clientWidth - 32 : window.innerWidth - 64 // padding
       const availH = parent
         ? parent.clientHeight - 200 // room for nav controls
         : window.innerHeight - 300

       // Base dimensions from PDF natural pixels, or sensible defaults
       const baseW = pdfPixelSize ? pdfPixelSize.width : 600
       const baseH = pdfPixelSize ? pdfPixelSize.height : baseW / bookNumericRatio

       // Fit within available space
       const scale = Math.min(availW / baseW, availH / baseH, 1)
       setBookDisplaySize({
         width: Math.round(baseW * scale),
         height: Math.round(baseH * scale),
       })
     }

     computeSize()
     window.addEventListener("resize", computeSize)
     return () => window.removeEventListener("resize", computeSize)
   }, [pdfPixelSize, bookNumericRatio])

   const goTo = useCallback(
     (idx, dir) => {
       if (isFlipping || idx < 0 || idx >= totalLeaves) return
       playFlipSound()
       setIsFlipping(true)
       setFlipDirection(dir)
       setTimeout(() => {
         setCurrentPage(idx)
         setIsFlipping(false)
         setFlipDirection(null)
       }, flipSpeed * 1000)
     },
     [totalLeaves, isFlipping, flipSpeed, playFlipSound]
   )

   const goNext = useCallback(() => { if (currentPage < totalLeaves - 1) goTo(currentPage + 1, "next") }, [currentPage, totalLeaves, goTo])
   const goPrev = useCallback(() => { if (currentPage > 0) goTo(currentPage - 1, "prev") }, [currentPage, goTo])

   /* ── Auto-flip timer ── */
   useEffect(() => {
     if (autoFlip && data && !isFlipping) {
       const interval = (data.settings?.auto_flip_speed || 5) * 1000
       autoFlipTimerRef.current = setTimeout(() => {
         if (currentPage < totalLeaves - 1) {
           goTo(currentPage + 1, "next")
         } else {
           setAutoFlip(false)
         }
       }, interval)
     }
     return () => {
       if (autoFlipTimerRef.current) clearTimeout(autoFlipTimerRef.current)
     }
   }, [autoFlip, currentPage, isFlipping, data, totalLeaves, goTo])

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

   /* ── Scroll wheel flip ── */
   const scrollCooldownRef = useRef(false)
   useEffect(() => {
     const handler = (e) => {
       if (scrollCooldownRef.current) return
       if (Math.abs(e.deltaY) < 30) return
       e.preventDefault()
       scrollCooldownRef.current = true
       setTimeout(() => { scrollCooldownRef.current = false }, flipSpeed * 1000 + 200)
       if (e.deltaY > 0) goNext()
       else goPrev()
     }
     const el = containerRef.current
     if (el) {
       el.addEventListener("wheel", handler, { passive: false })
       return () => el.removeEventListener("wheel", handler)
     }
   }, [goNext, goPrev, flipSpeed])

   /* ── Mouse drag to flip ── */
   const onPointerDown = useCallback((e) => {
     if (e.button !== 0) return
     dragRef.current = { startX: e.clientX, startY: e.clientY, isDragging: true }
   }, [])
   const onPointerUp = useCallback((e) => {
     if (!dragRef.current.isDragging) return
     dragRef.current.isDragging = false
     const dx = e.clientX - dragRef.current.startX
     const dy = e.clientY - dragRef.current.startY
     if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
       if (dx < 0) goNext()
       else goPrev()
     }
   }, [goNext, goPrev])
   const onPointerLeave = useCallback(() => {
     dragRef.current.isDragging = false
   }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

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

  /* ── Render front content for a page ── */
  function renderFront(page, idx) {
    if (page.type === "cover") return <BookCover title={data?.settings?.title} subtitle={data?.settings?.subtitle} />
    if (page.type === "back-cover") return <BackCover title={data?.settings?.title} />
    if (page.type === "section") return <SectionPage name={page.name} />
    if (page.type === "student") return <StudentPage profile={page.data.profile} layoutTemplate={page.data.layout_template} pageNum={idx} totalPages={totalLeaves - 2} />
    if (page.type === "pdf") {
      const img = pdfImages[`${page.data.id}-${page.pageNum}`]
      return <PdfPageContent imageUrl={img} title={page.data.title} pageNum={page.pageNum} isLoading={!img && pdfLoading} />
    }
    return null
  }

  /* ── Render back content for a page ── */
  function renderBack(page) {
    if (page.type === "student") {
      const pr = page.data.profile
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#fafafa] p-5 text-center">
          <div className="h-10 w-10 rounded-full bg-[var(--bg-primary)]/5 flex items-center justify-center mb-3">
            <GraduationCap size={20} className="text-[var(--bg-primary)]/30" />
          </div>
          <p className="text-[10px] text-[var(--text-muted)]/40 italic max-w-[200px]">&ldquo;{pr.quote || "The future belongs to those who believe in the beauty of their dreams."}&rdquo;</p>
        </div>
      )
    }
    if (page.type === "pdf") {
      return (
        <div className="flex h-full w-full flex-col items-center justify-center bg-[#fafafa] p-5 text-center">
          <BookOpen size={24} className="text-[var(--bg-primary)]/15 mb-2" />
          <p className="text-[10px] text-[var(--text-muted)]/30">{page.data.title}</p>
          <p className="text-[9px] text-[var(--text-muted)]/20 mt-0.5">Page {page.pageNum} of {page.data.page_count || 1}</p>
        </div>
      )
    }
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#fafafa]">
        <div className="h-[85%] w-[85%] rounded border border-dashed border-gray-200/50" />
      </div>
    )
  }

  /* ── Loading / error / disabled ── */
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

  const hasContent = filtered.length > 0 || pdfPages.length > 0
  if (!hasContent) return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-page)]">
      <div className="text-center"><BookOpen size={32} className="mx-auto mb-2 text-[var(--text-muted)]" /><p className="text-sm font-medium text-[var(--text-primary)]">No content yet</p><p className="text-xs text-[var(--text-muted)]">Add student profiles or PDF pages to the yearbook.</p></div>
    </div>
  )

  const allPdfPagesRendered = pdfPages.length === 0 || (pdfLoading === false && Object.keys(pdfImages).length > 0)

  const coverClosed = currentPage === 0

  return (
    <div
      ref={containerRef}
       className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50" : "min-h-screen"}`}
      style={{
        background: isFullscreen
          ? "linear-gradient(135deg, rgba(30,20,10,0.95) 0%, rgba(15,25,40,0.97) 50%, rgba(10,15,30,0.95) 100%)"
          : "linear-gradient(135deg, #faf8f5 0%, #f0ede8 30%, #e8e4de 60%, #f0ede8 100%)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Ambient light orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 right-1/4 h-64 w-64 rounded-full bg-amber-500/[0.04] blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-48 w-48 rounded-full bg-[var(--bg-primary)]/[0.04] blur-3xl" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 border-b border-black/5 bg-white/70 dark:bg-[#112233]/80 backdrop-blur-md">
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
            <div className="ml-auto flex items-center gap-2">
              {/* Sound toggle */}
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setSoundEnabled(!soundEnabled)} title={soundEnabled ? "Mute flip sound" : "Enable flip sound"}>
                {soundEnabled ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                )}
              </Button>
              {/* Auto-flip toggle */}
              <Button variant="ghost" size="icon-sm" className="h-8 w-8 text-[var(--text-muted)]" onClick={() => setAutoFlip(!autoFlip)} title={autoFlip ? "Stop auto-flip" : "Auto-flip pages"}>
                {autoFlip ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Progress bar at top of book area ── */}
      <div className="relative z-10 mx-auto w-full max-w-2xl px-8">
        <div className="h-0.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)]/80 to-[var(--accent-gold)] transition-all duration-500 ease-out"
            style={{ width: `${totalLeaves > 1 ? (currentPage / (totalLeaves - 1)) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {showStrip && (
        <div className="relative z-10 border-b border-black/5 bg-white/50 dark:bg-[#112233]/60 backdrop-blur-sm">
          <PageStrip pages={pageList} currentPage={currentPage} onSelect={(i) => goTo(i, i > currentPage ? "next" : "prev")} />
        </div>
      )}

       {/* ── 3D Book ── */}
       <div className="relative z-10 flex flex-col items-center justify-center px-4 py-6 overflow-hidden">
         {/* Left padding to hide page overflow during flip */}
         <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-transparent pointer-events-none z-0" />
         {!allPdfPagesRendered ? (
           <div className="flex flex-col items-center gap-3" style={{ minHeight: "30vh" }}>
             <div className="relative">
               <div className="absolute inset-0 animate-ping rounded-full bg-[var(--accent-gold)]/20" />
               <BookMarked size={40} className="relative text-[var(--accent-gold)] animate-pulse" />
             </div>
             <p className="text-sm text-white/60 font-light">Rendering all pages…</p>
             <div className="h-1 w-32 rounded-full bg-white/10 overflow-hidden mt-2">
               <div className="h-full rounded-full bg-[var(--accent-gold)] animate-pulse" style={{ width: "60%" }} />
             </div>
           </div>
         ) : (
         <>
              {/* ── Clickable book wrapper with drag support ── */}
               <div
                 ref={bookRef}
                 className="relative transition-transform duration-400 ease-out shrink-0 select-none "
                 style={{
                   perspective: "1200px",
                   perspectiveOrigin: "50% 50%",
                   width: bookDisplaySize ? `${bookDisplaySize.width}px` : "30vw",
                   height: bookDisplaySize ? `${bookDisplaySize.height}px` : "45vw",
                  transform: `scale(${zoom})`,
                  transformOrigin: "center center",
                  cursor: cornerHover ? "pointer" : "default",
                  paddingLeft: "32px",
                  marginLeft: "-32px",
                }}
                onMouseDown={onPointerDown}
                onMouseUp={onPointerUp}
                onMouseLeave={() => { onPointerLeave(); setCornerHover(false) }}
                onMouseMove={(e) => {
                  const rect = bookRef.current?.getBoundingClientRect()
                  if (!rect) return
                  const x = (e.clientX - rect.left) / rect.width
                  const y = (e.clientY - rect.top) / rect.height
                  setCornerHover(x > 0.8 && y > 0.85)
                }}
              >
            <div className="relative h-full w-full" style={{ transformStyle: "preserve-3d" }}>
              {/* Desk shadow — grows during flip */}
              <div
                className="absolute inset-x-[-5%] bottom-[-10%] h-[30%] rounded-[50%]"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(0,0,0,0.08) 0%, transparent 70%)",
                  filter: "blur(6px)",
                  transform: "rotateX(60deg)",
                  transition: `opacity ${flipSpeed * 0.3}s ease, transform ${flipSpeed * 0.3}s ease`,
                  opacity: isFlipping ? 0.7 : 1,
                }}
              />

              {/* Animated desk shadow pulse during flip */}
              {isFlipping && (
                <div
                  className="absolute inset-x-[-10%] bottom-[-12%] h-[35%] rounded-[50%] pointer-events-none"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(0,0,0,0.12) 0%, transparent 60%)",
                    filter: "blur(10px)",
                    transform: "rotateX(60deg)",
                    animation: `curl-desk-shadow ${flipSpeed}s ease-in-out forwards`,
                  }}
                />
              )}

              {/* Dynamic page-turn shadow on the desk */}
              {isFlipping && (
                <div
                  className="absolute bottom-[-8%] rounded-[50%] pointer-events-none"
                  style={{
                    left: flipDirection === "next" ? "10%" : "50%",
                    width: "40%",
                    height: "20%",
                    background: "radial-gradient(ellipse at center, rgba(0,0,0,0.15) 0%, transparent 70%)",
                    filter: "blur(10px)",
                    transition: `left ${flipSpeed * 0.5}s ease`,
                  }}
                />
              )}

             {/* All page leaves */}
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
               />
             ))}

              <Spine />
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-black/[0.03] to-transparent rounded-t-lg pointer-events-none" />

              {/* ── Click-to-flip zones (invisible overlays) ── */}
              <div
                className="absolute inset-0 z-50 flex"
                style={{ pointerEvents: isFlipping ? "none" : "auto" }}
              >
                {/* Left half = prev */}
                <div
                  className="h-full cursor-pointer"
                  style={{ width: "50%" }}
                  onClick={(e) => { e.stopPropagation(); goPrev() }}
                  title="Previous page"
                />
                {/* Right half = next */}
                <div
                  className="h-full cursor-pointer"
                  style={{ width: "50%" }}
                  onClick={(e) => { e.stopPropagation(); goNext() }}
                  title="Next page"
                />
              </div>

              {/* ── Corner peel hover indicator ── */}
              {cornerHover && !isFlipping && currentPage < totalLeaves - 1 && (
                <div
                  className="absolute bottom-0 right-0 pointer-events-none z-40"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.03) 100%)",
                    borderRadius: "0 0 6px 0",
                    transition: "opacity 0.2s ease",
                  }}
                />
              )}
            </div>
          </div>

          {/* ── Progress bar ── */}
          <div className="mt-4 w-full max-w-xs">
            <div className="h-1 rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/70 transition-all duration-500 ease-out"
                style={{ width: `${totalLeaves > 1 ? (currentPage / (totalLeaves - 1)) * 100 : 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[var(--text-muted)]/50">Cover</span>
              <span className="text-[9px] text-[var(--text-muted)]/50">
                {coverClosed ? "Cover" : `Page ${currentPage} of ${totalLeaves - 1}`}
              </span>
              <span className="text-[9px] text-[var(--text-muted)]/50">End</span>
            </div>
          </div>

         {/* ── Navigation ── */}
         <div className="mt-6 flex items-center gap-5">
           <Button variant="outline" size="icon" onClick={goPrev} disabled={currentPage <= 0 || isFlipping}
             className="h-11 w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/90 backdrop-blur-sm hover:bg-white">
             <ChevronLeft size={22} />
           </Button>

           <div className="flex items-center gap-1.5">
             {Array.from({ length: Math.min(totalLeaves, 11) }, (_, i) => {
               let pn
               if (totalLeaves <= 11) pn = i
               else { const s = Math.max(0, Math.min(currentPage - 5, totalLeaves - 11)); pn = s + i }
               return (
                 <button key={pn} onClick={() => goTo(pn, pn > currentPage ? "next" : "prev")} disabled={isFlipping}
                   title={pn === 0 ? "Cover" : `Page ${pn}`}
                   className={`rounded-full transition-all duration-300 ${
                     pn === currentPage
                       ? "w-7 h-2.5 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/80 shadow-md shadow-[var(--accent-gold)]/30"
                       : pn === 0
                         ? "w-2.5 h-2.5 bg-[var(--bg-primary)]/25 hover:bg-[var(--bg-primary)]/50"
                         : "w-2.5 h-2.5 bg-black/10 hover:bg-black/20"
                   }`}
                 />
               )
             })}
           </div>

           <Button variant="outline" size="icon" onClick={goNext} disabled={currentPage >= totalLeaves - 1 || isFlipping}
             className="h-11 w-11 rounded-full shadow-lg shadow-black/10 border-black/10 bg-white/90 backdrop-blur-sm hover:bg-white">
             <ChevronRight size={22} />
           </Button>
         </div>

         {/* Zoom */}
         <div className="mt-3 flex items-center gap-3">
           <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.5))} className="h-7 w-7 text-[var(--text-muted)]"><ZoomOut size={13} /></Button>
           <div className="h-1 w-20 rounded-full bg-black/10 overflow-hidden">
             <div className="h-full rounded-full bg-[var(--accent-gold)] transition-all" style={{ width: `${((zoom - 0.5) / 1) * 100}%` }} />
           </div>
           <Button variant="ghost" size="icon-sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 1.5))} className="h-7 w-7 text-[var(--text-muted)]"><ZoomIn size={13} /></Button>
         </div>

           <p className="mt-2 text-[10px] text-[var(--text-muted)]/60">
             Click left/right • drag • scroll • ← → keys • Ctrl+K search
           </p>
         </>
         )}
       </div>

      {search && filtered.length === 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-black/5 bg-white/90 backdrop-blur-md px-4 py-3 text-center">
          <p className="text-sm text-[var(--text-muted)]">No students found matching &ldquo;{search}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
