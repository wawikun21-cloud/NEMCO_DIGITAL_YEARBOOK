/**
 * DownloadPdfButton.jsx
 *
 * A self-contained download button for the resume builder.
 * Plug this wherever you currently have your print/download button.
 *
 * Props:
 *   data      — resume section data object
 *   sections  — section definitions array
 *   template  — { slug, name }
 *   resume    — { title } (for the filename)
 *   className — optional extra Tailwind classes
 */

import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useResumePdfDownload } from "@/hooks/useResumePdfDownload"

export function DownloadPdfButton({ data, sections, template, resume, className = "" }) {
  const { downloadPdf, isGenerating } = useResumePdfDownload()

  return (
    <Button
      onClick={() => downloadPdf({ data, sections, template, resume })}
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
