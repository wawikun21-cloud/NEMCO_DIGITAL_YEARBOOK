import { useRef, useState, useCallback } from "react"

const A4_WIDTH = 794
const A4_HEIGHT = 1123
const SCALE = 2

function splitCanvasToPages(sourceCanvas) {
  const pages = []
  const scaledHeight = sourceCanvas.height
  const totalPages = Math.max(1, Math.ceil(scaledHeight / (A4_HEIGHT * SCALE)))

  for (let i = 0; i < totalPages; i++) {
    const pageCanvas = document.createElement("canvas")
    pageCanvas.width = A4_WIDTH * SCALE
    pageCanvas.height = A4_HEIGHT * SCALE
    const ctx = pageCanvas.getContext("2d")
    if (!ctx) continue

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

    const sx = 0
    const sy = i * A4_HEIGHT * SCALE
    const sw = A4_WIDTH * SCALE
    const sh = Math.min(A4_HEIGHT * SCALE, scaledHeight - sy)

    if (sh <= 0) continue

    ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh)
    pages.push(pageCanvas)
  }

  return pages
}

// Inject CSS overrides for oklch support
const OKLCH_OVERRIDE_CSS = `
  :root {
    --background: #ffffff !important;
    --foreground: #111827 !important;
    --primary: #132F45 !important;
    --primary-foreground: #ffffff !important;
    --secondary: #f5f5f5 !important;
    --secondary-foreground: #111827 !important;
    --muted: #f5f5f5 !important;
    --muted-foreground: #6b7280 !important;
    --accent: #f5f5f5 !important;
    --accent-foreground: #111827 !important;
    --destructive: #cc1f1f !important;
    --destructive-foreground: #ffffff !important;
    --border: #e5e7eb !important;
    --input: #e5e7eb !important;
    --ring: #d1d5db !important;
    --card: #ffffff !important;
    --card-foreground: #111827 !important;
    --popover: #ffffff !important;
    --popover-foreground: #111827 !important;
  }
`

export function usePdfExport() {
  const [exporting, setExporting] = useState(false)
  const exportingRef = useRef(false)
  const overrideStyleRef = useRef(null)

  const exportToPdf = useCallback(async (elementRef, filename = "resume.pdf") => {
    if (exportingRef.current) return
    exportingRef.current = true
    setExporting(true)

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])

      // Inject CSS overrides before capture
      const overrideStyle = document.createElement("style")
      overrideStyle.textContent = OKLCH_OVERRIDE_CSS
      overrideStyleRef.current = overrideStyle
      document.head.appendChild(overrideStyle)

      // Try ref first, then fallback to DOM query
      let element = elementRef?.current
      if (!element) {
        element = document.querySelector('[data-pdf-export]')
      }

      // Wait for element to be available (up to 2 seconds)
      let waitCount = 0
      while (!element && waitCount < 20) {
        await new Promise(resolve => setTimeout(resolve, 100))
        element = elementRef?.current || document.querySelector('[data-pdf-export]')
        waitCount++
      }

      if (!element) {
        throw new Error("Preview element not found")
      }

      // Clone element for clean capture
      const clone = element.cloneNode(true)
      clone.style.visibility = "visible"
      clone.style.display = "block"
      clone.style.position = "fixed"
      clone.style.top = "0"
      clone.style.left = "-9999px"
      clone.style.width = `${A4_WIDTH}px`
      clone.style.height = "auto"
      clone.style.minHeight = `${A4_HEIGHT}px`
      clone.style.background = "#ffffff"

      document.body.appendChild(clone)

      try {
        // Wait for all images inside the clone (photo, bg SVG, etc.) to finish
        // loading before html2canvas snapshots it — otherwise they render blank.
        const images = Array.from(clone.querySelectorAll("img"))
        await Promise.all(
          images.map((img) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve()
            return new Promise((resolve) => {
              img.addEventListener("load", resolve, { once: true })
              img.addEventListener("error", resolve, { once: true })
              setTimeout(resolve, 3000) // safety timeout
            })
          })
        )

        // Lock the capture box to the resume's actual rendered size so the
        // output canvas is exactly A4_WIDTH * SCALE wide. If this drifts even
        // slightly, splitCanvasToPages slices the wrong pixel regions and the
        // pages come out stretched/skewed.
        const contentWidth = A4_WIDTH
        const contentHeight = Math.max(clone.scrollHeight, A4_HEIGHT)

        const canvas = await html2canvas(clone, {
          scale: SCALE,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: contentWidth,
          height: contentHeight,
          windowWidth: contentWidth,
          windowHeight: contentHeight,
        })

        const pages = splitCanvasToPages(canvas)
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [A4_WIDTH, A4_HEIGHT] })
        for (let i = 0; i < pages.length; i++) {
          if (i > 0) pdf.addPage([A4_WIDTH, A4_HEIGHT])
          const dataUrl = pages[i].toDataURL("image/jpeg", 0.92)
          pdf.addImage(dataUrl, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT)
        }

        pdf.save(filename)
        return true
      } finally {
        document.body.removeChild(clone)
      }
    } catch (err) {
      console.error("PDF export failed:", err)
      throw err
    } finally {
      setExporting(false)
      exportingRef.current = false
      // Remove override style
      if (overrideStyleRef.current && overrideStyleRef.current.parentNode) {
        document.head.removeChild(overrideStyleRef.current)
        overrideStyleRef.current = null
      }
    }
  }, [])

  return { exportToPdf, exporting }
}