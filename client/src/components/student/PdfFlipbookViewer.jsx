import { useState, useEffect, useRef, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  AlertTriangle,
  RotateCcw,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

function PdfPage({ page, isActive, flipSpeed, onClick }) {
  return (
    <div
      className="absolute inset-0 cursor-pointer"
      style={{
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
        transform: isActive ? "rotateY(0deg)" : "rotateY(-180deg)",
        transition: `transform ${flipSpeed}s ease-in-out`,
        zIndex: isActive ? 10 : 1,
      }}
      onClick={onClick}
    >
      <div className="flex h-full w-full items-center justify-center bg-white shadow-lg">
        {page.cover_image_url ? (
          <img
            src={page.cover_image_url}
            alt={page.title}
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg
                className="h-10 w-10 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 13h1.2l.9 2.6.9-2.6h1.2l-1.5 4h-1.2L8.5 13zm4.5 0h1v4h-1v-4zm2 0h1.2l1.3 2.5V13h1v4h-1.2l-1.3-2.5V17h-1v-4z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {page.title}
            </h3>
            {page.description && (
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {page.description}
              </p>
            )}
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Click to view PDF • {page.page_count || 1} page(s)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function PdfEmbed({ page, zoom, onZoomChange }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const containerRef = useRef(null)

  const handleZoomIn = () => onZoomChange(Math.min(zoom + 0.25, 3))
  const handleZoomOut = () => onZoomChange(Math.max(zoom - 0.25, 0.5))

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
    const link = document.createElement("a")
    link.href = page.file_url
    link.download = page.file_name
    link.target = "_blank"
    link.click()
  }

  return (
    <div ref={containerRef} className="relative h-full w-full bg-[var(--bg-page)]">
      <div className="absolute right-2 top-2 z-10 flex gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
        >
          <ZoomOut size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
        >
          <ZoomIn size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onZoomChange(1)}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
        >
          <RotateCcw size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleFullscreen}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
        >
          <Maximize2 size={14} />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={handleDownload}
          className="h-8 w-8 bg-white/90 backdrop-blur-sm"
        >
          <Download size={14} />
        </Button>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-page)]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="animate-spin text-[var(--bg-primary)]" />
            <p className="text-sm text-[var(--text-muted)]">Loading PDF...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-page)]">
          <div className="flex flex-col items-center gap-2 text-center">
            <AlertTriangle size={24} className="text-red-500" />
            <p className="text-sm text-[var(--text-primary)]">Failed to load PDF</p>
            <p className="text-xs text-[var(--text-muted)]">{error}</p>
          </div>
        </div>
      )}

      <iframe
        src={`${page.file_url}#toolbar=0&navpanes=0&scrollbar=1&zoom=${zoom * 100}`}
        className="h-full w-full border-0"
        title={page.title}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError("Could not load PDF")
        }}
        style={{ display: loading || error ? "none" : "block" }}
      />
    </div>
  )
}

export default function PdfFlipbookViewer({ pdfPages, settings }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [viewMode, setViewMode] = useState("flipbook")
  const [zoom, setZoom] = useState(1)
  const [showPdf, setShowPdf] = useState(false)

  const flipSpeed = settings?.flip_speed || 0.5
  const totalPages = pdfPages.length

  const goToPage = useCallback(
    (index) => {
      if (isFlipping) return
      if (index < 0 || index >= totalPages) return

      setIsFlipping(true)
      setShowPdf(false)

      setTimeout(() => {
        setCurrentIndex(index)
        setIsFlipping(false)
      }, flipSpeed * 1000)
    },
    [totalPages, isFlipping, flipSpeed]
  )

  const goNext = useCallback(
    () => goToPage(currentIndex + 1),
    [goToPage, currentIndex]
  )

  const goPrev = useCallback(
    () => goToPage(currentIndex - 1),
    [goToPage, currentIndex]
  )

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewMode === "flipbook") {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault()
          goNext()
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault()
          goPrev()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goNext, goPrev, viewMode])

  if (totalPages === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-[var(--border-light)]">
        <div className="text-center">
          <p className="text-sm text-[var(--text-muted)]">No PDF pages uploaded</p>
          <p className="text-xs text-[var(--text-muted)]">Upload PDFs to view them here</p>
        </div>
      </div>
    )
  }

  const currentPage = pdfPages[currentIndex]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "flipbook" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setViewMode("flipbook")
              setShowPdf(false)
            }}
          >
            3D Flipbook
          </Button>
          <Button
            variant={viewMode === "embed" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("embed")}
          >
            PDF Viewer
          </Button>
        </div>

        {viewMode === "flipbook" && (
          <span className="text-xs text-[var(--text-muted)]">
            {currentIndex + 1} / {totalPages}
          </span>
        )}
      </div>

      {viewMode === "flipbook" ? (
        <div
          className="relative mx-auto w-full max-w-3xl"
          style={{ perspective: "2000px" }}
        >
          <div
            className="relative overflow-hidden rounded-lg border border-[var(--border-light)] bg-white shadow-xl"
            style={{ aspectRatio: "3/2" }}
          >
            <div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
            >
              {pdfPages.map((page, index) => (
                <PdfPage
                  key={page.id}
                  page={page}
                  isActive={index === currentIndex}
                  isFlipping={isFlipping}
                  flipSpeed={flipSpeed}
                  onClick={() => {
                    if (index === currentIndex) {
                      setShowPdf(true)
                    }
                  }}
                />
              ))}
            </div>

            {showPdf && (
              <div className="absolute inset-0 z-20">
                <PdfEmbed
                  page={currentPage}
                  zoom={zoom}
                  onZoomChange={setZoom}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPdf(false)}
                  className="absolute left-2 top-2 z-30 bg-white/90 backdrop-blur-sm"
                >
                  Back to Flipbook
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={goPrev}
              disabled={currentIndex <= 0 || isFlipping}
              className="h-10 w-10 rounded-full"
            >
              <ChevronLeft size={20} />
            </Button>

            <div className="flex items-center gap-1.5">
              {pdfPages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  disabled={isFlipping}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-6 bg-[var(--bg-primary)]"
                      : "w-2 bg-[var(--border-light)] hover:bg-[var(--text-muted)]"
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goNext}
              disabled={currentIndex >= totalPages - 1 || isFlipping}
              className="h-10 w-10 rounded-full"
            >
              <ChevronRight size={20} />
            </Button>
          </div>

          <p className="mt-3 text-center text-[10px] text-[var(--text-muted)]">
            Use arrow keys or click buttons to navigate • Click a page to view PDF
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {pdfPages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setCurrentIndex(index)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-left transition-colors ${
                  index === currentIndex
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
            <PdfEmbed
              page={currentPage}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>
        </div>
      )}
    </div>
  )
}
