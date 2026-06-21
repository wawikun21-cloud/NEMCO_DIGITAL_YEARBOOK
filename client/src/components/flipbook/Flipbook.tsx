import { useCallback, useMemo } from "react"
import type { FlipbookProps } from "./types"
import { useFlipbookEngine } from "./useFlipbookEngine"
import { isWebGLAvailable } from "./WebGLPageRenderer"
import { searchPdf } from "./pdfRenderer"
import FlipbookToolbar from "./FlipbookToolbar"
import FlipbookThumbnails from "./FlipbookThumbnails"
import FlipbookTOC from "./FlipbookTOC"
import FlipbookSearch from "./FlipbookSearch"
import FlipbookWebGLMode from "./FlipbookWebGLMode"
import FlipbookCSSMode from "./FlipbookCSSMode"

export default function Flipbook(props: FlipbookProps) {
  const {
    pdfUrl,
    pages,
    mode = "webgl",
    viewMode: initialViewMode = "double",
    sound = true,
    tableOfContent,
    theme,
    className = "",
    onPageChange,
    onReady,
    singlePageBreakpoint = 768,
    flipSpeed = 0.6,
    showToolbar = true,
    defaultZoom = 1,
    maxZoom = 3,
    minZoom = 0.5,
  } = props

  const { state, actions, containerRef, effectiveViewMode } = useFlipbookEngine({
    pdfUrl,
    pages,
    mode,
    viewMode: initialViewMode,
    sound,
    onPageChange,
    onReady,
    singlePageBreakpoint,
    flipSpeed,
    defaultZoom,
    maxZoom,
    minZoom,
  })

  // Determine actual rendering mode (auto-fallback if WebGL not available)
  const actualMode = useMemo(() => {
    if (mode === "css") return "css"
    if (!isWebGLAvailable()) return "css"
    return "webgl"
  }, [mode])

  // PDF search handler
  const handleSearch = useCallback(async (query: string) => {
    if (!pdfUrl) return []
    const { loadPdf } = await import("./pdfRenderer")
    const doc = await loadPdf(pdfUrl)
    return searchPdf(doc, query)
  }, [pdfUrl])

  const hasPdf = !!pdfUrl
  const hasTOC = !!(tableOfContent && tableOfContent.length > 0)

  // CSS variable overrides from theme
  const cssVars: Record<string, string> = {}
  if (theme?.toolbarBg) cssVars["--flipbook-toolbar-bg"] = theme.toolbarBg
  if (theme?.btnColor) cssVars["--flipbook-btn-color"] = theme.btnColor
  if (theme?.btnHoverBg) cssVars["--flipbook-btn-hover-bg"] = theme.btnHoverBg
  if (theme?.accentColor) cssVars["--flipbook-accent"] = theme.accentColor
  if (theme?.panelBg) cssVars["--flipbook-panel-bg"] = theme.panelBg
  if (theme?.panelBorder) cssVars["--flipbook-panel-border"] = theme.panelBorder
  if (theme?.textPrimary) cssVars["--flipbook-text-primary"] = theme.textPrimary
  if (theme?.textMuted) cssVars["--flipbook-text-muted"] = theme.textMuted

  return (
    <div
      ref={containerRef}
      className={`flipbook-root relative overflow-hidden rounded-xl ${className}`}
      style={{
        ...cssVars,
        background: "var(--flipbook-bg, #1a1a2e)",
        minHeight: "400px",
      }}
    >
      {/* Main content area */}
      <div className="relative flex h-full w-full items-center justify-center">
        {!state.bookReady ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-white/10" />
              <svg
                className="relative h-10 w-10 animate-pulse text-white/60"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
            </div>
            <p className="text-sm text-white/40">Loading flipbook…</p>
          </div>
        ) : state.totalPages === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16">
            <svg
              className="h-10 w-10 text-white/20"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <p className="text-sm text-white/40">No pages to display</p>
          </div>
        ) : actualMode === "webgl" ? (
          <FlipbookWebGLMode
            state={state}
            actions={actions}
            viewMode={effectiveViewMode}
            flipSpeed={flipSpeed}
          />
        ) : (
          <FlipbookCSSMode
            state={state}
            actions={actions}
            viewMode={effectiveViewMode}
            flipSpeed={flipSpeed}
          />
        )}
      </div>

      {/* Toolbar */}
      {showToolbar && state.bookReady && state.totalPages > 0 && (
        <FlipbookToolbar
          state={state}
          actions={actions}
          theme={theme}
          viewMode={effectiveViewMode}
          hasPdf={hasPdf}
          hasTOC={hasTOC}
        />
      )}

      {/* Thumbnails panel */}
      {state.showThumbnails && (
        <FlipbookThumbnails
          state={state}
          actions={actions}
          viewMode={effectiveViewMode}
          onClose={actions.toggleThumbnails}
        />
      )}

      {/* TOC panel */}
      {state.showTOC && hasTOC && tableOfContent && (
        <FlipbookTOC
          items={tableOfContent}
          currentPage={state.currentPage}
          onNavigate={actions.goToPage}
          onClose={actions.toggleTOC}
        />
      )}

      {/* Search panel */}
      {state.showSearch && hasPdf && (
        <FlipbookSearch
          onSearch={handleSearch}
          onNavigate={actions.goToPage}
          onClose={actions.toggleSearch}
        />
      )}

      {/* Interaction hint */}
      {state.bookReady && state.totalPages > 0 && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 text-center">
          <p className="text-[10px] text-white/25">
            Click edges or drag to flip • Arrow keys to navigate
          </p>
        </div>
      )}
    </div>
  )
}
