import type { ReactNode } from "react"

export interface PageImage {
  src: string
  thumb: string
}

export interface TOCItem {
  title: string
  page: number
}

export interface FlipbookTheme {
  toolbarBg?: string
  btnColor?: string
  btnHoverBg?: string
  accentColor?: string
  panelBg?: string
  panelBorder?: string
  textPrimary?: string
  textMuted?: string
}

export type FlipMode = "webgl" | "css"
export type ViewMode = "single" | "double"

export interface FlipbookProps {
  pdfUrl?: string
  pages?: PageImage[]
  mode?: FlipMode
  viewMode?: ViewMode
  sound?: boolean
  tableOfContent?: TOCItem[]
  deepLinkingPrefix?: string
  theme?: FlipbookTheme
  className?: string
  onPageChange?: (page: number) => void
  onReady?: () => void
  singlePageBreakpoint?: number
  flipSpeed?: number
  showToolbar?: boolean
  defaultZoom?: number
  maxZoom?: number
  minZoom?: number
}

export interface FlipbookState {
  currentPage: number
  totalPages: number
  zoom: number
  viewMode: ViewMode
  sound: boolean
  isFullscreen: boolean
  isFlipping: boolean
  flipDirection: "next" | "prev" | null
  showThumbnails: boolean
  showTOC: boolean
  showSearch: boolean
  loadedPages: Set<number>
  pageImages: Map<number, string>
  pageThumbs: Map<number, string>
  bookReady: boolean
  isDragging: boolean
  dragProgress: number
}

export interface FlipbookActions {
  goNext: () => void
  goPrev: () => void
  goToPage: (page: number) => void
  setZoom: (zoom: number) => void
  zoomIn: () => void
  zoomOut: () => void
  toggleViewMode: () => void
  toggleSound: () => void
  toggleFullscreen: () => void
  toggleThumbnails: () => void
  toggleTOC: () => void
  toggleSearch: () => void
  setDragging: (dragging: boolean, progress?: number) => void
}

export interface PageLoadState {
  loaded: boolean
  loading: boolean
  error: boolean
  dataUrl: string | null
}
