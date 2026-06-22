/**
 * useResumePdfDownload.js
 *
 * Generates a PDF entirely in the browser by capturing the live
 * ResumePrintView DOM node — no server, no Puppeteer, no GB-hours.
 *
 * Usage:
 *   const { downloadPdf, isGenerating } = useResumePdfDownload()
 *
 *   // Pass a ref to the ResumePrintView wrapper div
 *   <div ref={resumeRef}>
 *     <ResumePrintView ... />
 *   </div>
 *
 *   <button onClick={() => downloadPdf({ resumeRef, resume })}>
 *     Download PDF
 *   </button>
 */

import { useState, useCallback } from "react"
import { toast } from "sonner"

const A4_WIDTH_PX  = 794
const A4_HEIGHT_PX = 1123

export function useResumePdfDownload() {
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadPdf = useCallback(async ({ resumeRef, resume }) => {
    if (isGenerating) return

    const node = resumeRef?.current
    if (!node) {
      toast.error("Could not find resume to export.")
      return
    }

    setIsGenerating(true)

    try {
      // Lazy-load so they don't bloat the initial bundle
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ])

      // ── 1. Capture the DOM node as a canvas ──────────────────────────────────
      const canvas = await html2canvas(node, {
        scale:            2,          // 2× for crisp text on retina / print
        useCORS:          true,        // allow cross-origin images (Supabase photos)
        allowTaint:       false,
        backgroundColor:  "#ffffff",
        width:            A4_WIDTH_PX,
        height:           A4_HEIGHT_PX,
        windowWidth:      A4_WIDTH_PX,
        windowHeight:     A4_HEIGHT_PX,
        logging:          false,
      })

      // ── 2. Build the PDF at exact A4 size ────────────────────────────────────
      const pdf = new jsPDF({
        orientation: "portrait",
        unit:        "px",
        format:      [A4_WIDTH_PX, A4_HEIGHT_PX],
        hotfixes:    ["px_scaling"],  // prevents jsPDF internal scaling quirk
      })

      const imgData = canvas.toDataURL("image/jpeg", 1.0)
      pdf.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_PX, A4_HEIGHT_PX)

      // ── 3. Trigger download ───────────────────────────────────────────────────
      const filename = `${resume?.title || "resume"}-${new Date().toISOString().slice(0, 10)}.pdf`
      pdf.save(filename)

      toast.success("Resume downloaded!", { description: filename })

    } catch (err) {
      console.error("[useResumePdfDownload] Error:", err)
      toast.error("Could not generate PDF", { description: err.message })
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  return { downloadPdf, isGenerating }
}