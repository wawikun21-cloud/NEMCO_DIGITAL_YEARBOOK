import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString()

const renderCache = new Map<string, string>()
let currentPdfUrl: string | null = null

export function resetPdfCache(): void {
  renderCache.clear()
  currentPdfUrl = null
}

export function setPdfUrl(url: string): void {
  if (url !== currentPdfUrl) {
    resetPdfCache()
    currentPdfUrl = url
  }
}

export async function loadPdf(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument(url)
  return loadingTask.promise
}

export async function renderPdfPage(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  scale = 2
): Promise<string> {
  const cacheKey = `${pdfDoc}-${pageNum}-${scale}`
  const cached = renderCache.get(cacheKey)
  if (cached) return cached

  const page = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get 2d context")

  await page.render({ canvasContext: ctx, viewport }).promise

  const dataUrl = canvas.toDataURL("image/jpeg", 0.92)
  renderCache.set(cacheKey, dataUrl)
  return dataUrl
}

export async function getPageDimensions(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  scale = 2
): Promise<{ width: number; height: number }> {
  const page = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  return { width: viewport.width, height: viewport.height }
}

export async function preloadPdfRange(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  centerPage: number,
  totalPages: number,
  range = 2,
  scale = 2
): Promise<Map<number, string>> {
  const results = new Map<number, string>()
  const start = Math.max(1, centerPage - range)
  const end = Math.min(totalPages, centerPage + range)

  const tasks: Promise<void>[] = []
  for (let i = start; i <= end; i++) {
    const cacheKey = `${pdfDoc}-${i}-${scale}`
    if (renderCache.has(cacheKey)) {
      results.set(i, renderCache.get(cacheKey)!)
      continue
    }
    tasks.push(
      renderPdfPage(pdfDoc, i, scale).then((dataUrl) => {
        results.set(i, dataUrl)
      }).catch(() => {
        // skip broken pages
      })
    )
  }

  await Promise.allSettled(tasks)
  return results
}

export interface SearchResult {
  pageIndex: number
  text: string
}

export async function searchPdf(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  query: string,
  startPage = 1,
  endPage?: number
): Promise<SearchResult[]> {
  if (!query.trim()) return []

  const results: SearchResult[] = []
  const end = endPage ?? pdfDoc.numPages
  const lowerQuery = query.toLowerCase()

  for (let i = startPage; i <= end; i++) {
    try {
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      const text = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")

      if (text.toLowerCase().includes(lowerQuery)) {
        results.push({
          pageIndex: i,
          text: text.substring(0, 150),
        })
      }
    } catch {
      // skip pages that fail to parse
    }
  }

  return results
}

export function getRenderCache(): Map<string, string> {
  return renderCache
}
