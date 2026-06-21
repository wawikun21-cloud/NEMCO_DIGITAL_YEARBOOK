import { useRef, useCallback, useEffect, useState } from "react"
import type { FlipbookState, FlipbookActions, ViewMode } from "./types"

interface FlipbookCSSModeProps {
  state: FlipbookState
  actions: FlipbookActions
  viewMode: ViewMode
  flipSpeed?: number
}

export default function FlipbookCSSMode({
  state,
  actions,
  viewMode,
  flipSpeed = 0.6,
}: FlipbookCSSModeProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const totalPages = state.totalPages
  const currentPage = state.currentPage
  const isDouble = viewMode === "double"

  // Get the images for the current spread
  const leftPage = isDouble && currentPage > 0 ? currentPage - 1 : currentPage
  const rightPage = isDouble ? currentPage + 1 : currentPage
  const leftImage = state.pageImages.get(leftPage)
  const rightImage = state.pageImages.get(rightPage)

  // Touch / drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (state.isFlipping) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const relX = x / rect.width

    // Only trigger drag from edges
    if (relX > 0.15 && relX < 0.85) return

    touchStartRef.current = { x: e.clientX, y: e.clientY }
    setIsDragging(true)
    setDragOffset(0)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }, [state.isFlipping])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchStartRef.current || !isDragging) return
    const delta = e.clientX - touchStartRef.current.x
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const progress = Math.max(-1, Math.min(1, delta / (rect.width * 0.5)))
    setDragOffset(progress)
  }, [isDragging])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!touchStartRef.current || !isDragging) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)

    if (dragOffset > 0.3) {
      actions.goPrev()
    } else if (dragOffset < -0.3) {
      actions.goNext()
    }

    touchStartRef.current = null
    setIsDragging(false)
    setDragOffset(0)
  }, [isDragging, dragOffset, actions])

  // Click to flip
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (isDragging) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const relX = x / rect.width

    if (relX < 0.2) {
      actions.goPrev()
    } else if (relX > 0.8) {
      actions.goNext()
    }
  }, [isDragging, actions])

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const delta = e.changedTouches[0].clientX - touchStartRef.current.x
    if (Math.abs(delta) > 50) {
      if (delta < 0) actions.goNext()
      else actions.goPrev()
    }
    touchStartRef.current = null
  }, [actions])

  const pageStyle: React.CSSProperties = {
    transformStyle: "preserve-3d" as const,
    transformOrigin: "left center",
    transition: state.isFlipping
      ? `transform ${flipSpeed}s cubic-bezier(0.645, 0.045, 0.355, 1)`
      : isDragging
        ? "none"
        : "none",
    transform: isDragging && dragOffset < 0
      ? `rotateY(${dragOffset * 30}deg)`
      : state.isFlipping && state.flipDirection === "next"
        ? "rotateY(-180deg)"
        : "rotateY(0deg)",
  }

  const backPageStyle: React.CSSProperties = {
    ...pageStyle,
    transformOrigin: "right center",
    transform: isDragging && dragOffset > 0
      ? `rotateY(${dragOffset * 30}deg)`
      : state.isFlipping && state.flipDirection === "prev"
        ? "rotateY(180deg)"
        : "rotateY(180deg)",
  }

  if (totalPages === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/20">
        <p className="text-sm text-white/40">No pages to display</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full"
      style={{
        perspective: "2500px",
        perspectiveOrigin: "50% 50%",
        transform: `scale(${state.zoom})`,
        transformOrigin: "center center",
        transition: "transform 0.2s ease-out",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative mx-auto"
        style={{
          transformStyle: "preserve-3d" as const,
          aspectRatio: isDouble ? "16/9" : "3/4",
          maxWidth: "100%",
        }}
      >
        {/* Book base / back */}
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300"
          style={{
            transform: "translateZ(-2px)",
            boxShadow: "0 0 20px rgba(0,0,0,0.15)",
          }}
        />

        {/* Spine */}
        <div
          className="absolute left-0 top-0 h-full rounded-l-sm"
          style={{
            width: "10px",
            transform: "translateX(-50%)",
            zIndex: 100,
            background: "linear-gradient(90deg, #374151 0%, #4b5563 30%, #6b7280 50%, #4b5563 70%, #374151 100%)",
            boxShadow: "inset -2px 0 6px rgba(0,0,0,0.4), -3px 0 10px rgba(0,0,0,0.25)",
          }}
        />

        {/* Right page (static, bottom of stack) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-r-sm bg-white"
          style={{
            boxShadow: "2px 0 10px rgba(0,0,0,0.08), inset -3px 0 6px rgba(0,0,0,0.04)",
          }}
        >
          {rightImage ? (
            <img
              src={rightImage}
              alt={`Page ${rightPage + 1}`}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
            </div>
          )}
          <span className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
            {rightPage + 1}
          </span>
        </div>

        {/* Left page (flips) */}
        <div
          className="absolute inset-0 overflow-hidden rounded-l-sm bg-white"
          style={pageStyle}
        >
          <div
            className="absolute inset-0 bg-white"
            style={{
              backfaceVisibility: "hidden",
              boxShadow: "2px 0 10px rgba(0,0,0,0.08), inset -3px 0 6px rgba(0,0,0,0.04)",
            }}
          >
            {leftImage ? (
              <img
                src={leftImage}
                alt={`Page ${leftPage + 1}`}
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-50">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white/80">
              {leftPage + 1}
            </span>
          </div>
          <div
            className="absolute inset-0 bg-white"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              boxShadow: "-2px 0 10px rgba(0,0,0,0.08), inset 3px 0 6px rgba(0,0,0,0.04)",
            }}
          >
            {currentPage > 0 && state.pageImages.has(leftPage - 1) ? (
              <img
                src={state.pageImages.get(leftPage - 1)!}
                alt={`Page ${leftPage}`}
                className="h-full w-full object-contain"
                draggable={false}
              />
            ) : (
              <div className="h-full w-full bg-gray-50" />
            )}
          </div>
        </div>

        {/* Curl shadow overlay */}
        {isDragging && (
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `linear-gradient(90deg, rgba(0,0,0,${Math.abs(dragOffset) * 0.15}) 0%, transparent 40%)`,
              mixBlendMode: "multiply",
            }}
          />
        )}
      </div>
    </div>
  )
}
