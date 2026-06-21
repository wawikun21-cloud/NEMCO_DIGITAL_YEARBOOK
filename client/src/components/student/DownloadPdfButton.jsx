import { useState, useMemo } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { jsPDF } from "jspdf"

export default function DownloadPdfButton({ pageList, pdfImages, data, pdfPixelSize, pageAspectRatios }) {
  const [generating, setGenerating] = useState(false)

  const pageSize = useMemo(() => {
    if (pdfPixelSize && pdfPixelSize.width > 0 && pdfPixelSize.height > 0) {
      return { w: pdfPixelSize.width, h: pdfPixelSize.height }
    }
    const ratios = pageAspectRatios ? Object.values(pageAspectRatios) : []
    if (ratios.length > 0) {
      const avg = ratios.reduce((a, b) => a + b, 0) / ratios.length
      const h = 800
      const w = Math.round(h * avg)
      return { w, h }
    }
    return { w: 800, h: 566 }
  }, [pdfPixelSize, pageAspectRatios])

  const handleDownload = async () => {
    if (generating) return
    setGenerating(true)
    toast.loading("Generating PDF…", { id: "pdf-download" })

    try {
      const { w, h } = pageSize
      const orientation = w >= h ? "landscape" : "portrait"
      const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] })
      let firstPage = true

      for (const page of pageList) {
        if (!firstPage) pdf.addPage([w, h])
        firstPage = false

        if (page.type === "cover") {
          drawCoverPage(pdf, data, w, h)
        } else if (page.type === "back-cover") {
          drawBackCoverPage(pdf, data, w, h)
        } else if (page.type === "section") {
          drawSectionPage(pdf, page, w, h)
        } else if (page.type === "student") {
          drawStudentPage(pdf, page, w, h)
        } else if (page.type === "pdf") {
          const imgKey = `${page.data.id}-${page.pageNum}`
          const imgData = pdfImages[imgKey]
          if (imgData) {
            pdf.addImage(imgData, "JPEG", 0, 0, w, h)
          }
        }
      }

      const fileName = `${(data?.settings?.title || "yearbook").replace(/\s+/g, "_")}.pdf`
      pdf.save(fileName)
      toast.success("PDF downloaded!", { id: "pdf-download" })
    } catch (err) {
      console.error("PDF generation error:", err)
      toast.error("Failed to generate PDF", { id: "pdf-download" })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownload}
      disabled={generating}
      className="gap-2 text-xs border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] dark:border-[var(--border-light)] dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)] dark:hover:[var(--bg-subtle)] dark:hover:text-[var(--text-primary)]"
    >
      {generating ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {generating ? "Generating…" : "Download PDF"}
    </Button>
  )
}

function drawCoverPage(pdf, data, w, h) {
  pdf.setFillColor(26, 58, 92)
  pdf.rect(0, 0, w, h, "F")

  const fontSize = Math.round(w / 22)
  pdf.setFontSize(fontSize)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(255, 255, 255)
  const title = data?.settings?.title || "NEMCO Digital Yearbook"
  const titleWidth = pdf.getTextWidth(title)
  pdf.text(title, (w - titleWidth) / 2, h / 2 - fontSize * 0.6)

  if (data?.settings?.subtitle) {
    pdf.setFontSize(Math.round(fontSize * 0.5))
    pdf.setFont("helvetica", "normal")
    pdf.setTextColor(200, 200, 200)
    const subWidth = pdf.getTextWidth(data.settings.subtitle)
    pdf.text(data.settings.subtitle, (w - subWidth) / 2, h / 2 + fontSize * 0.4)
  }

  pdf.setFontSize(Math.round(fontSize * 0.38))
  pdf.setTextColor(180, 180, 200)
  const badge = "3D Interactive Flipbook"
  const bw = pdf.getTextWidth(badge)
  pdf.text(badge, (w - bw) / 2, h / 2 + fontSize * 1.2)
}

function drawBackCoverPage(pdf, data, w, h) {
  pdf.setFillColor(13, 31, 51)
  pdf.rect(0, 0, w, h, "F")

  const fontSize = Math.round(w / 28)
  pdf.setFontSize(fontSize)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(200, 200, 220)
  const title = data?.settings?.title || "NEMCO"
  const tw = pdf.getTextWidth(title)
  pdf.text(title, (w - tw) / 2, h / 2 - fontSize * 0.3)

  pdf.setFontSize(Math.round(fontSize * 0.65))
  pdf.setFont("helvetica", "normal")
  pdf.setTextColor(150, 150, 170)
  const sub = "Digital Yearbook"
  const sw = pdf.getTextWidth(sub)
  pdf.text(sub, (w - sw) / 2, h / 2 + fontSize * 0.5)

  pdf.setFontSize(Math.round(fontSize * 0.55))
  pdf.setTextColor(120, 120, 140)
  const credit = "Made with love by NEMCO"
  const cw = pdf.getTextWidth(credit)
  pdf.text(credit, (w - cw) / 2, h / 2 + fontSize * 1.3)
}

function drawSectionPage(pdf, page, w, h) {
  pdf.setFillColor(250, 250, 252)
  pdf.rect(0, 0, w, h, "F")

  const fontSize = Math.round(w / 24)
  pdf.setFontSize(fontSize)
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(40, 40, 60)
  const name = page.name || "Section"
  const nw = pdf.getTextWidth(name)
  pdf.text(name, (w - nw) / 2, h / 2 + fontSize * 0.35)
}

function drawStudentPage(pdf, page, w, h) {
  pdf.setFillColor(255, 255, 255)
  pdf.rect(0, 0, w, h, "F")

  const profile = page.data?.profile
  if (!profile) return

  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()
  const scale = Math.min(w, h) / 566

  const avatarSize = Math.round(120 * scale)
  const avatarY = Math.round(h * 0.18)

  if (profile.avatar_url) {
    try {
      const x = (w - avatarSize) / 2
      pdf.addImage(profile.avatar_url, "JPEG", x, avatarY, avatarSize, avatarSize)
    } catch {
      drawInitialCircle(pdf, w, h, initial, scale)
    }
  } else {
    drawInitialCircle(pdf, w, h, initial, scale)
  }

  const nameY = avatarY + avatarSize + Math.round(20 * scale)
  pdf.setFontSize(Math.round(22 * scale))
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(30, 30, 50)
  const nw = pdf.getTextWidth(name)
  pdf.text(name, (w - nw) / 2, nameY)

  let currentY = nameY + Math.round(16 * scale)

  if (profile.student_number) {
    pdf.setFontSize(Math.round(10 * scale))
    pdf.setTextColor(140, 140, 160)
    pdf.text(profile.student_number, w / 2 - Math.round(40 * scale), currentY)
    currentY += Math.round(16 * scale)
  }

  const tags = []
  if (profile.course_or_strand) tags.push(profile.course_or_strand)
  if (profile.year_level) tags.push(profile.year_level)
  if (profile.section) tags.push(profile.section)

  if (tags.length > 0) {
    pdf.setFontSize(Math.round(9 * scale))
    pdf.setTextColor(100, 100, 120)
    const tagText = tags.join("  •  ")
    const tw = pdf.getTextWidth(tagText)
    pdf.text(tagText, (w - tw) / 2, currentY)
    currentY += Math.round(18 * scale)
  }

  if (profile.bio) {
    pdf.setFontSize(Math.round(10 * scale))
    pdf.setTextColor(80, 80, 100)
    const maxW = Math.round(300 * scale)
    const lines = pdf.splitTextToSize(profile.bio, maxW)
    pdf.text(lines, (w - maxW) / 2, currentY)
  }
}

function drawInitialCircle(pdf, w, h, initial, scale) {
  const r = Math.round(50 * scale)
  const cy = Math.round(h * 0.32)
  pdf.setFillColor(230, 235, 245)
  pdf.circle(w / 2, cy, r, "F")
  pdf.setFontSize(Math.round(36 * scale))
  pdf.setFont("helvetica", "bold")
  pdf.setTextColor(80, 90, 120)
  pdf.text(initial, w / 2 - Math.round(10 * scale), cy + Math.round(12 * scale))
}
