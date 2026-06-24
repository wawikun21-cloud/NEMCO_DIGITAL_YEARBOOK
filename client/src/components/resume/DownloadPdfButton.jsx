/**
 * DownloadPdfButton.jsx
 *
 * Props:
 *   resumeRef — React ref attached to the ResumePrintView wrapper div
 *   resume    — { title } for the filename
 *   className — optional extra Tailwind classes
 */

import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useResumePdfDownload } from "@/hooks/useResumePdfDownload"

export function DownloadPdfButton({ resumeRef, resume, className = "" }) {
  const { downloadPdf, isGenerating } = useResumePdfDownload()

  return (
    <Button
      onClick={() => downloadPdf({ resumeRef, resume })}
      disabled={isGenerating}
      className={`gap-2 ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Generating PDF…
        </>
      ) : (
        <>
          <Download size={15} />
          Download PDF
        </>
      )}
    </Button>
  )
}