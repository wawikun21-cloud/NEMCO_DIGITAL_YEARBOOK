import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import type { FlipbookProps, FlipbookState, FlipbookActions, ViewMode } from "./types"
import { loadPdf, renderPdfPage, preloadPdfRange, resetPdfCache } from "./pdfRenderer"

const DEFAULT_FLIP_SPEED = 0.6
const DEFAULT_MIN_ZOOM = 0.5
const DEFAULT_MAX_ZOOM = 3
const DEFAULT_SINGLE_PAGE_BREAKPOINT = 768

export function useFlipbookEngine(props: FlipbookProps) {
  const {
    pdfUrl,
    pages,
    mode = "webgl",
    viewMode: initialViewMode = "double",
    sound = true,
    deepLinkingPrefix,
    onPageChange,
    onReady,
    singlePageBreakpoint = DEFAULT_SINGLE_PAGE_BREAKPOINT,
    flipSpeed = DEFAULT_FLIP_SPEED,
    minZoom = DEFAULT_MIN_ZOOM,
    maxZoom = DEFAULT_MAX_ZOOM,
    defaultZoom = 1,
  } = props

  const [state, setState] = useState<FlipbookState>({
    currentPage: 0,
    totalPages: 0,
    zoom: defaultZoom,
    viewMode: initialViewMode,
    sound,
    isFullscreen: false,
    isFlipping: false,
    flipDirection: null,
    showThumbnails: false,
    showTOC: false,
    showSearch: false,
    loadedPages: new Set(),
    pageImages: new Map(),
    pageThumbs: new Map(),
    bookReady: false,
    isDragging: false,
    dragProgress: 0,
  })

  const pdfDocRef = useRef<any>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const isSinglePageMode = useRef(false)

  // Determine effective view mode based on screen width
  const effectiveViewMode: ViewMode = useMemo(() => {
    if (typeof window === "undefined") return initialViewMode
    if (window.innerWidth < singlePageBreakpoint) return "single"
    return state.viewMode
  }, [state.viewMode, initialViewMode, singlePageBreakpoint])

  // Initialize PDF or image pages
  useEffect(() => {
    let cancelled = false

    async function init() {
      resetPdfCache()

      if (pdfUrl) {
        try {
          const doc = await loadPdf(pdfUrl)
          if (cancelled) return
          pdfDocRef.current = doc
          const total = doc.numPages

          // Preload first spread
          const initialImages = new Map<number, string>()
          const initialThumbs = new Map<number, string>()
          const initialLoaded = new Set<number>()

          const firstPages = await preloadPdfRange(doc, 1, total, 2)
          firstPages.forEach((dataUrl, pageNum) => {
            initialImages.set(pageNum - 1, dataUrl)
            initialThumbs.set(pageNum - 1, dataUrl)
            initialLoaded.add(pageNum - 1)
          })

          if (cancelled) return
          setState((s) => ({
            ...s,
            totalPages: total,
            currentPage: 0,
            pageImages: initialImages,
            pageThumbs: initialThumbs,
            loadedPages: initialLoaded,
            bookReady: true,
          }))
          onReady?.()
        } catch {
          if (!cancelled) {
            setState((s) => ({ ...s, bookReady: true }))
          }
        }
      } else if (pages && pages.length > 0) {
        const total = pages.length
        const initialImages = new Map<number, string>()
        const initialThumbs = new Map<number, string>()
        const initialLoaded = new Set<number>()

        // Load first few images
        const preloadCount = Math.min(4, total)
        for (let i = 0; i < preloadCount; i++) {
          initialImages.set(i, pages[i].src)
          initialThumbs.set(i, pages[i].thumb)
          initialLoaded.add(i)
        }

        if (cancelled) return
        setState((s) => ({
          ...s,
          totalPages: total,
          currentPage: 0,
          pageImages: initialImages,
          pageThumbs: initialThumbs,
          loadedPages: initialLoaded,
          bookReady: true,
        }))
        onReady?.()
      } else {
        setState((s) => ({ ...s, totalPages: 0, bookReady: true }))
        onReady?.()
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [pdfUrl, pages])

  // Lazy-load pages around current
  useEffect(() => {
    if (!state.bookReady) return

    const loadSurrounding = async () => {
      const center = state.currentPage
      const range = 2
      const newImages = new Map(state.pageImages)
      const newThumbs = new Map(state.pageThumbs)
      const newLoaded = new Set(state.loadedPages)

      if (pdfDocRef.current) {
        const results = await preloadPdfRange(
          pdfDocRef.current,
          center + 1,
          state.totalPages,
          range
        )
        results.forEach((dataUrl, pageNum) => {
          newImages.set(pageNum - 1, dataUrl)
          newThumbs.set(pageNum - 1, dataUrl)
          newLoaded.add(pageNum - 1)
        })
      } else if (pages) {
        for (let i = center - range; i <= center + range; i++) {
          if (i >= 0 && i < state.totalPages && !newLoaded.has(i)) {
            newImages.set(i, pages[i].src)
            newThumbs.set(i, pages[i].thumb)
            newLoaded.add(i)
          }
        }
      }

      setState((s) => ({
        ...s,
        pageImages: newImages,
        pageThumbs: newThumbs,
        loadedPages: newLoaded,
      }))
    }

    loadSurrounding()
  }, [state.currentPage, state.bookReady])

  // Deep linking
  useEffect(() => {
    if (!deepLinkingPrefix) return

    const hash = window.location.hash
    const prefix = `#${deepLinkingPrefix}`
    if (hash.startsWith(prefix)) {
      const page = parseInt(hash.replace(prefix, ""), 10)
      if (!isNaN(page) && page >= 0 && page < state.totalPages) {
        setState((s) => ({ ...s, currentPage: page }))
      }
    }
  }, [deepLinkingPrefix, state.bookReady])

  useEffect(() => {
    if (!deepLinkingPrefix) return
    const page = state.currentPage
    const newHash = `${deepLinkingPrefix}${page}`
    if (window.location.hash !== `#${newHash}`) {
      window.history.replaceState(null, "", `#${newHash}`)
    }
  }, [state.currentPage, deepLinkingPrefix])

  // Fullscreen tracking
  useEffect(() => {
    const handler = () => {
      setState((s) => ({ ...s, isFullscreen: !!document.fullscreenElement }))
    }
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  // Sound synthesis
  const playFlipSound = useCallback(() => {
    if (!state.sound) return
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext()
      }
      const ctx = audioContextRef.current
      const now = ctx.currentTime

      // Create a short noise burst for paper rustle
      const bufferSize = ctx.sampleRate * 0.15
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15))
      }

      const source = ctx.createBufferSource()
      source.buffer = buffer

      const filter = ctx.createBiquadFilter()
      filter.type = "bandpass"
      filter.frequency.value = 3000
      filter.Q.value = 0.5

      const gain = ctx.createGain()
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

      source.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      source.start(now)
      source.stop(now + 0.15)
    } catch {
      // AudioContext not available
    }
  }, [state.sound])

  // Navigation
  const goNext = useCallback(() => {
    setState((s) => {
      if (s.isFlipping) return s
      const step = effectiveViewMode === "double" ? 2 : 1
      const next = Math.min(s.currentPage + step, s.totalPages - 1)
      if (next === s.currentPage) return s

      playFlipSound()
      onPageChange?.(next)

      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
      flipTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isFlipping: false, flipDirection: null }))
      }, flipSpeed * 1000)

      return { ...s, currentPage: next, isFlipping: true, flipDirection: "next" }
    })
  }, [effectiveViewMode, playFlipSound, onPageChange, flipSpeed])

  const goPrev = useCallback(() => {
    setState((s) => {
      if (s.isFlipping) return s
      const step = effectiveViewMode === "double" ? 2 : 1
      const prev = Math.max(s.currentPage - step, 0)
      if (prev === s.currentPage) return s

      playFlipSound()
      onPageChange?.(prev)

      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
      flipTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isFlipping: false, flipDirection: null }))
      }, flipSpeed * 1000)

      return { ...s, currentPage: prev, isFlipping: true, flipDirection: "prev" }
    })
  }, [effectiveViewMode, playFlipSound, onPageChange, flipSpeed])

  const goToPage = useCallback((page: number) => {
    setState((s) => {
      const clamped = Math.max(0, Math.min(page, s.totalPages - 1))
      if (clamped === s.currentPage) return s
      const direction = clamped > s.currentPage ? "next" : "prev"
      playFlipSound()
      onPageChange?.(clamped)

      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
      flipTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, isFlipping: false, flipDirection: null }))
      }, flipSpeed * 1000)

      return { ...s, currentPage: clamped, isFlipping: true, flipDirection: direction }
    })
  }, [playFlipSound, onPageChange, flipSpeed])

  // Zoom
  const setZoom = useCallback((zoom: number) => {
    setState((s) => ({ ...s, zoom: Math.max(minZoom, Math.min(zoom, maxZoom)) }))
  }, [minZoom, maxZoom])

  const zoomIn = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.min(s.zoom + 0.25, maxZoom) }))
  }, [maxZoom])

  const zoomOut = useCallback(() => {
    setState((s) => ({ ...s, zoom: Math.max(s.zoom - 0.25, minZoom) }))
  }, [minZoom])

  // Toggles
  const toggleViewMode = useCallback(() => {
    setState((s) => ({
      ...s,
      viewMode: s.viewMode === "double" ? "single" : "double",
    }))
  }, [])

  const toggleSound = useCallback(() => {
    setState((s) => ({ ...s, sound: !s.sound }))
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      containerRef.current.requestFullscreen()
    }
  }, [])

  const toggleThumbnails = useCallback(() => {
    setState((s) => ({ ...s, showThumbnails: !s.showThumbnails, showTOC: false, showSearch: false }))
  }, [])

  const toggleTOC = useCallback(() => {
    setState((s) => ({ ...s, showTOC: !s.showTOC, showThumbnails: false, showSearch: false }))
  }, [])

  const toggleSearch = useCallback(() => {
    setState((s) => ({ ...s, showSearch: !s.showSearch, showThumbnails: false, showTOC: false }))
  }, [])

  const setDragging = useCallback((dragging: boolean, progress = 0) => {
    setState((s) => ({ ...s, isDragging: dragging, dragProgress: progress }))
  }, [])

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        goPrev()
      } else if (e.key === "Escape") {
        setState((s) => ({ ...s, showThumbnails: false, showTOC: false, showSearch: false }))
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goPrev])

  // Cleanup
  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current) clearTimeout(flipTimeoutRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  const actions: FlipbookActions = {
    goNext,
    goPrev,
    goToPage,
    setZoom,
    zoomIn,
    zoomOut,
    toggleViewMode,
    toggleSound,
    toggleFullscreen,
    toggleThumbnails,
    toggleTOC,
    toggleSearch,
    setDragging,
  }

  return { state, actions, containerRef, effectiveViewMode }
}
