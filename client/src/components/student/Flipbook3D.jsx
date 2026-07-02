import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  RotateCcw,
  Download,
  FileText,
  BookOpen,
  Grid3X3,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import * as pdfjsLib from "pdfjs-dist"
import { resolveFileUrl } from "@/utils/yearbookEditionHelpers"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString()

function usePdfRenderer(fileUrl) {
  const [pdfDoc, setPdfDoc] = useState(null)
  const [pageCount, setPageCount] = useState(0)
  const [renderedPages, setRenderedPages] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const renderCacheRef = useRef({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setRenderedPages({})
    renderCacheRef.current = {}

    pdfjsLib.getDocument(fileUrl).promise
      .then((doc) => {
        if (cancelled) return
        setPdfDoc(doc)
        setPageCount(doc.numPages)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || "Failed to load PDF")
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [fileUrl])

  const renderPage = useCallback(
    async (pageNum, scale = 2) => {
      if (!pdfDoc) return null
      const cacheKey = `${pageNum}-${scale}`
      if (renderCacheRef.current[cacheKey]) {
        return renderCacheRef.current[cacheKey]
      }

      try {
        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement("canvas")
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext("2d")

        await page.render({ canvasContext: ctx, viewport }).promise

        const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
        renderCacheRef.current[cacheKey] = dataUrl
        setRenderedPages((prev) => ({ ...prev, [pageNum]: dataUrl }))
        return dataUrl
      } catch {
        return null
      }
    },
    [pdfDoc]
  )

  const preloadRange = useCallback(
    async (centerPage, range = 3) => {
      if (!pdfDoc) return
      const tasks = []
      for (let i = Math.max(1, centerPage - range); i <= Math.min(pageCount, centerPage + range); i++) {
        if (!renderCacheRef.current[`${i}-2`]) {
          tasks.push(renderPage(i))
        }
      }
      await Promise.allSettled(tasks)
    },
    [pdfDoc, pageCount, renderPage]
  )

  return { pdfDoc, pageCount, renderedPages, loading, error, renderPage, preloadRange }
}

function Page3D({
  frontImage,
  backImage,
  pageIndex,
  currentPage,
  totalPages,
  isFlipping,
  flipDirection,
  flipSpeed,
  onClick,
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
    if (isTurning) return totalPages + 10
    if (isFlipped) return pageIndex
    return totalPages - pageIndex
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
        pointerEvents: isCurrent && !isFlipping ? "auto" : "none",
      }}
      onClick={onClick}
    >
      <div
        className="absolute inset-0 bg-white rounded-r-sm shadow-md overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          boxShadow: "2px 0 8px rgba(0,0,0,0.1), inset -3px 0 6px rgba(0,0,0,0.05)",
        }}
      >
        {frontImage ? (
          <img
            src={frontImage}
            alt={`Page ${pageIndex * 2 + 1}`}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={20} className="animate-spin text-[var(--bg-primary)]" />
              <p className="text-[10px] text-[var(--text-muted)]">Rendering…</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
          {pageIndex * 2 + 1}
        </div>
      </div>

      <div
        className="absolute inset-0 bg-white rounded-l-sm shadow-md overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.1), inset 3px 0 6px rgba(0,0,0,0.05)",
        }}
      >
        {backImage ? (
          <img
            src={backImage}
            alt={`Page ${pageIndex * 2 + 2}`}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={20} className="animate-spin text-[var(--bg-primary)]" />
              <p className="text-[10px] text-[var(--text-muted)]">Rendering…</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
          {pageIndex * 2 + 2}
        </div>
      </div>
    </div>
  )
}

function BookSpine({ thickness }) {
  return (
    <div
      className="absolute left-0 top-0 h-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500 rounded-l-sm"
      style={{
        width: `${thickness}px`,
        transform: "translateX(-50%)",
        transformStyle: "preserve-3d",
        zIndex: 9999,
        boxShadow: "inset -2px 0 4px rgba(0,0,0,0.3), -2px 0 8px rgba(0,0,0,0.2)",
      }}
    >
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20"
        style={{ borderRadius: "2px 0 0 2px" }}
      />
    </div>
  )
}

function ThumbnailStrip({
  thumbnails,
  currentPage,
  onPageSelect,
}) {
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      const activeThumb = scrollRef.current.querySelector(`[data-page="${currentPage}"]`)
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
      }
    }
  }, [currentPage])

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto py-2 px-1 styled-scroll"
      style={{ scrollbarWidth: "thin" }}
    >
      {thumbnails.map((thumb, index) => (
        <button
          key={index}
          data-page={index}
          onClick={() => onPageSelect(index)}
          className={`shrink-0 rounded border-2 transition-all ${
            index === currentPage
              ? "border-[var(--bg-primary)] shadow-md scale-105"
              : "border-transparent hover:border-[var(--bg-primary)]/40 opacity-70 hover:opacity-100"
          }`}
          style={{ width: "60px", aspectRatio: "3/4" }}
        >
          {thumb ? (
            <img
              src={thumb}
              alt={`Page ${index + 1}`}
              className="h-full w-full object-cover rounded-sm"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 rounded-sm">
              <span className="text-[9px] text-gray-400">{index + 1}</span>
            </div>
          )}
        </button>
      ))}
    </div>
  )
}

export default function Flipbook3D({ pdfPages, settings }) {
  const [currentSheet, setCurrentSheet] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [fitScale, setFitScale] = useState(1)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [viewMode, setViewMode] = useState("flipbook")
  const [showPdf, setShowPdf] = useState(false)
  const [renderedPages, setRenderedPages] = useState({})
  const [allPagesRendered, setAllPagesRendered] = useState(false)
  const [bookAspectRatio, setBookAspectRatio] = useState(null)
  const [firstPdfDimensions, setFirstPdfDimensions] = useState(null)
  const containerRef = useRef(null)
  const touchStartRef = useRef(null)
  const renderCacheRef = useRef({})

  const flipSpeed = settings?.flip_speed || 0.6

  const expandedPages = useMemo(() => {
    const pages = []
    for (const pdf of pdfPages) {
      const count = pdf.page_count > 0 ? pdf.page_count : 1
      for (let i = 1; i <= count; i++) {
        pages.push({
          ...pdf,
          sheetPageNum: i,
          sheetTotalPages: count,
          isMultiPage: count > 1,
        })
      }
    }
    return pages
  }, [pdfPages])

  const totalSheets = Math.ceil(expandedPages.length / 2)
  const currentSheetData = expandedPages[currentSheet * 2] || null

  /* ── Compute fitScale: scale PDF pixel size to fit the available viewport ── */
  useEffect(() => {
    if (!firstPdfDimensions) { setFitScale(1); return }

    function computeFitScale() {
      const vh = window.innerHeight
      const vw = window.innerWidth
      const reserved = 280
      const availableHeight = Math.max(vh - reserved, 200)
      const availableWidth = vw * 0.8
      const scaleH = availableHeight / firstPdfDimensions.height
      const scaleW = availableWidth / firstPdfDimensions.width
      const scale = Math.min(scaleH, scaleW)
      setFitScale(scale)
    }

    computeFitScale()
    window.addEventListener("resize", computeFitScale)
    return () => window.removeEventListener("resize", computeFitScale)
  }, [firstPdfDimensions])

  const bookDisplayWidth = firstPdfDimensions ? `${firstPdfDimensions.width * fitScale}px` : "30vw"
  const bookDisplayHeight = firstPdfDimensions ? `${firstPdfDimensions.height * fitScale}px` : "auto"

  /* ── Pre-render ALL pages of ALL PDFs before showing flipbook ── */
  useEffect(() => {
    if (expandedPages.length === 0) {
      setAllPagesRendered(true)
      return
    }

    let cancelled = false
    setAllPagesRendered(false)
    setRenderedPages({})
    renderCacheRef.current = {}
    setFirstPdfDimensions(null)
    setBookAspectRatio(null)

    async function renderAllPages() {
      const allImages = {}
      let firstRatio = null

      for (const page of expandedPages) {
        try {
          const resolvedUrl = resolveFileUrl(page.file_url)
          const loadingTask = pdfjsLib.getDocument(resolvedUrl)
          const pdfDoc = await loadingTask.promise

          for (let p = 1; p <= pdfDoc.numPages; p++) {
            const cacheKey = `${page.file_url}-${p}-2`
            if (renderCacheRef.current[cacheKey]) {
              allImages[cacheKey] = renderCacheRef.current[cacheKey]
              continue
            }

            const pdfPage = await pdfDoc.getPage(p)
            const viewport = pdfPage.getViewport({ scale: 2 })
            const canvas = document.createElement("canvas")
            canvas.width = viewport.width
            canvas.height = viewport.height
            const ctx = canvas.getContext("2d")
            await pdfPage.render({ canvasContext: ctx, viewport }).promise
            const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
            renderCacheRef.current[cacheKey] = dataUrl
            allImages[cacheKey] = dataUrl

            if (!firstRatio) {
              firstRatio = viewport.width / viewport.height
              if (!cancelled) {
                setFirstPdfDimensions({ width: viewport.width, height: viewport.height })
                setBookAspectRatio(`${viewport.width}/${viewport.height}`)
              }
            }
          }
        } catch {
          // skip broken PDF
        }
      }

      if (!cancelled) {
        setRenderedPages(allImages)
        setAllPagesRendered(true)
      }
    }

    renderAllPages()
    return () => { cancelled = true }
  }, [expandedPages])

  const thumbnails = useMemo(() => {
    return expandedPages.map((page) => {
      const cacheKey = `${page.file_url}-${page.sheetPageNum}-2`
      return renderedPages[cacheKey] || null
    })
  }, [expandedPages, renderedPages])

  const goToSheet = useCallback(
    (index, direction) => {
      if (isFlipping) return
      if (index < 0 || index >= totalSheets) return

      setIsFlipping(true)
      setFlipDirection(direction)
      setShowPdf(false)

      setTimeout(() => {
        setCurrentSheet(index)
        setIsFlipping(false)
        setFlipDirection(null)
      }, flipSpeed * 1000)
    },
    [totalSheets, isFlipping, flipSpeed]
  )

  const goNext = useCallback(() => {
    if (currentSheet < totalSheets - 1) {
      goToSheet(currentSheet + 1, "next")
    }
  }, [currentSheet, totalSheets, goToSheet])

  const goPrev = useCallback(() => {
    if (currentSheet > 0) {
      goToSheet(currentSheet - 1, "prev")
    }
  }, [currentSheet, goToSheet])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode !== "flipbook") return
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev, viewMode])

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

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5))
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        containerRef.current.requestFullscreen()
      }
    }
  }

  const handleDownload = () => {
    if (currentSheetData) {
      const link = document.createElement("a")
      link.href = resolveFileUrl(currentSheetData.file_url)
      link.download = currentSheetData.file_name
      link.target = "_blank"
      link.click()
    }
  }

  if (totalSheets === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--border-light)]">
        <div className="text-center">
          <FileText size={32} className="mx-auto mb-2 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">No PDF pages uploaded</p>
          <p className="text-xs text-[var(--text-muted)]">Upload PDFs to view them as a 3D flipbook</p>
        </div>
      </div>
    )
  }

  const effectiveAspectRatio = bookAspectRatio || "3/2"

  const bookNumericRatio = useMemo(() => {
    const parts = effectiveAspectRatio.split("/")
    return parseFloat(parts[0]) / parseFloat(parts[1])
  }, [effectiveAspectRatio])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "flipbook" ? "default" : "outline"}
            size="sm"
            onClick={() => { setViewMode("flipbook"); setShowPdf(false) }}
            className="gap-1.5"
          >
            <BookOpen size={14} />
            3D Flipbook
          </Button>
          <Button
            variant={viewMode === "embed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("embed")}
            className="gap-1.5"
          >
            <FileText size={14} />
            PDF Viewer
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {viewMode === "flipbook" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowThumbnails(!showThumbnails)}
              className="h-8 w-8"
              title="Toggle thumbnails"
            >
              <Grid3X3 size={14} />
            </Button>
          )}
          <span className="text-xs text-[var(--text-muted)]">
            {currentSheet + 1} / {totalSheets}
            {currentSheetData?.isMultiPage && (
              <span className="ml-1">({currentSheetData.title})</span>
            )}
          </span>
        </div>
      </div>

      {showThumbnails && viewMode === "flipbook" && (
        <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-2">
          <ThumbnailStrip
            thumbnails={thumbnails}
            currentPage={currentSheet}
            onPageSelect={(idx) => goToSheet(idx, idx > currentSheet ? "next" : "prev")}
          />
        </div>
      )}

      {viewMode === "flipbook" ? (
        !allPagesRendered ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-[var(--bg-primary)]/20" />
              <BookOpen size={40} className="relative text-[var(--bg-primary)] animate-pulse" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">Rendering all pages…</p>
            <div className="h-1 w-32 rounded-full bg-[var(--border-light)] overflow-hidden mt-2">
              <div className="h-full rounded-full bg-[var(--bg-primary)] animate-pulse" style={{ width: "60%" }} />
            </div>
          </div>
        ) : (
        <div
          ref={containerRef}
          className="relative mx-auto w-full"
          style={{
            perspective: "3000px",
            perspectiveOrigin: "50% 50%",
          }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="relative mx-auto transition-transform duration-200 shrink-0"
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              width: bookDisplayWidth,
              height: bookDisplayHeight,
            }}
          >
            <div
              className="relative h-full w-full rounded-lg"
              style={{
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200"
                style={{
                  transform: "translateZ(-2px)",
                  boxShadow: "0 0 20px rgba(0,0,0,0.1)",
                }}
              />

              <BookSpine thickness={12} />

              {expandedPages
                .slice(0, totalSheets * 2)
                .reduce((sheets, page, i) => {
                  if (i % 2 === 0) {
                    sheets.push([page, expandedPages[i + 1] || null])
                  }
                  return sheets
                }, [])
                .map((sheetPair, sheetIndex) => {
                  const frontPage = sheetPair[0]
                  const backPage = sheetPair[1]

                  if (!frontPage) return null

                  const frontKey = `${frontPage.file_url}-${frontPage.sheetPageNum}-2`
                  const backKey = backPage ? `${backPage.file_url}-${backPage.sheetPageNum}-2` : null
                  const frontImage = renderedPages[frontKey]
                  const backImage = backKey ? renderedPages[backKey] : null

                  return (
                    <Page3D
                      key={`sheet-${sheetIndex}`}
                      frontImage={frontImage}
                      backImage={backImage}
                      pageIndex={sheetIndex}
                      currentPage={currentSheet}
                      totalPages={totalSheets}
                      isFlipping={isFlipping}
                      flipDirection={flipDirection}
                      flipSpeed={flipSpeed}
                      onClick={() => {
                        if (sheetIndex === currentSheet) {
                          setShowPdf(true)
                        }
                      }}
                    />
                  )
                })}
            </div>
          </div>

          {showPdf && currentSheetData && (
            <div className="absolute inset-0 z-50 bg-white rounded-lg overflow-hidden">
              <div className="flex items-center justify-between border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={14} className="text-red-500 shrink-0" />
                  <span className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {currentSheetData.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} className="h-7 w-7">
                    <ZoomOut size={12} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={handleResetZoom} className="h-7 w-7">
                    <RotateCcw size={12} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} className="h-7 w-7">
                    <ZoomIn size={12} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={handleFullscreen} className="h-7 w-7">
                    <Maximize2 size={12} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={handleDownload} className="h-7 w-7">
                    <Download size={12} />
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => setShowPdf(false)} className="h-7 w-7">
                    <X size={12} />
                  </Button>
                </div>
              </div>
              <iframe
                src={`${resolveFileUrl(currentSheetData.file_url)}#toolbar=1&navpanes=0&scrollbar=1&zoom=${zoom * 100}`}
                className="h-[calc(100%-40px)] w-full border-0"
                title={currentSheetData.title}
              />
            </div>
          )}

          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              disabled={currentSheet <= 0 || isFlipping}
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
                  const start = Math.max(0, Math.min(currentSheet - 4, totalSheets - 9))
                  pageNum = start + i
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToSheet(pageNum, pageNum > currentSheet ? "next" : "prev")}
                    disabled={isFlipping}
                    className={`h-2 rounded-full transition-all ${
                      pageNum === currentSheet
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
              disabled={currentSheet >= totalSheets - 1 || isFlipping}
              className="h-10 w-10 rounded-full shadow-md"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3">
            <Button variant="ghost" size="icon-sm" onClick={handleZoomOut} disabled={zoom <= 0.5} className="h-8 w-8">
              <ZoomOut size={14} />
            </Button>
            <span className="text-[10px] text-[var(--text-muted)] w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="ghost" size="icon-sm" onClick={handleZoomIn} disabled={zoom >= 2.5} className="h-8 w-8">
              <ZoomIn size={14} />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleFullscreen} className="h-8 w-8">
              <Maximize2 size={14} />
            </Button>
          </div>

          <p className="mt-2 text-center text-[10px] text-[var(--text-muted)]">
            Use arrow keys or swipe to navigate • Click a page to open full PDF viewer
          </p>
        </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {pdfPages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => {
                  let sheetIdx = 0
                  for (let i = 0; i < index; i++) {
                    sheetIdx += Math.ceil((pdfPages[i].page_count > 0 ? pdfPages[i].page_count : 1) / 2)
                  }
                  setCurrentSheet(sheetIdx)
                }}
                className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                  currentSheetData?.id === page.id
                    ? "border-[var(--bg-primary)] bg-[var(--bg-primary)]/10"
                    : "border-[var(--border-light)] hover:border-[var(--bg-primary)]/50"
                }`}
              >
                <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                  {page.title}
                </p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {page.page_count || 1} page(s)
                </p>
              </button>
            ))}
          </div>

          <div
            className="overflow-hidden rounded-lg border border-[var(--border-light)] bg-white shadow-xl"
            style={{ height: "70vh" }}
          >
            {currentSheetData && (
              <div className="relative h-full w-full">
                <div className="absolute right-2 top-2 z-10 flex gap-1">
                  <Button variant="outline" size="icon-sm" onClick={handleZoomOut} disabled={zoom <= 0.5} className="h-8 w-8 bg-white/90 backdrop-blur-sm">
                    <ZoomOut size={14} />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={handleZoomIn} disabled={zoom >= 3} className="h-8 w-8 bg-white/90 backdrop-blur-sm">
                    <ZoomIn size={14} />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={handleFullscreen} className="h-8 w-8 bg-white/90 backdrop-blur-sm">
                    <Maximize2 size={14} />
                  </Button>
                  <Button variant="outline" size="icon-sm" onClick={handleDownload} className="h-8 w-8 bg-white/90 backdrop-blur-sm">
                    <Download size={14} />
                  </Button>
                </div>
                <iframe
                  src={`${resolveFileUrl(currentSheetData.file_url)}#toolbar=0&navpanes=0&scrollbar=1&zoom=${zoom * 100}`}
                  className="h-full w-full border-0"
                  title={currentSheetData.title}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
