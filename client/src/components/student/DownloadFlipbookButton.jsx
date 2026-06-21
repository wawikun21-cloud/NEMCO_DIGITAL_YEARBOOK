import { useState } from "react"
import { BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function DownloadFlipbookButton({ pageList, pdfImages, data }) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    if (generating) return
    setGenerating(true)
    toast.loading("Generating flipbook HTML…", { id: "flipbook-download" })

    try {
      const title = data?.settings?.title || "NEMCO Digital Yearbook"
      const subtitle = data?.settings?.subtitle || ""

      const pagesHtml = pageList.map((page, idx) => {
        if (page.type === "cover") {
          return buildCoverPageHtml(title, subtitle)
        }
        if (page.type === "back-cover") {
          return buildBackCoverPageHtml(title)
        }
        if (page.type === "section") {
          return buildSectionPageHtml(page.name || "Section")
        }
        if (page.type === "student") {
          return buildStudentPageHtml(page.data?.profile, idx, pageList.length - 2)
        }
        if (page.type === "pdf") {
          const imgKey = `${page.data.id}-${page.pageNum}`
          const imgData = pdfImages[imgKey]
          if (imgData) {
            return `<div class="page" style="background:#fff;display:flex;align-items:center;justify-content:center;">
              <img src="${imgData}" style="width:100%;height:100%;object-fit:contain;" />
              <div class="page-label">${escapeHtml(page.data.title || "PDF")} • Page ${page.pageNum}</div>
            </div>`
          }
        }
        return `<div class="page" style="background:#fafafa;"></div>`
      })

      const html = buildFlipbookHtml(title, pagesHtml)
      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/\s+/g, "_")}_flipbook.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Flipbook downloaded!", { id: "flipbook-download" })
    } catch (err) {
      console.error("Flipbook generation error:", err)
      toast.error("Failed to generate flipbook", { id: "flipbook-download" })
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
        <BookOpen size={14} />
      )}
      {generating ? "Generating…" : "Download Flipbook"}
    </Button>
  )
}

function escapeHtml(str) {
  if (!str) return ""
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function buildCoverPageHtml(title, subtitle) {
  return `<div class="page cover">
    <div class="cover-content">
      <div class="cover-icon">🎓</div>
      <h1 class="cover-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<p class="cover-subtitle">${escapeHtml(subtitle)}</p>` : ""}
      <div class="cover-badge">📖 Interactive Flipbook</div>
    </div>
  </div>`
}

function buildBackCoverPageHtml(title) {
  return `<div class="page back-cover">
    <div class="cover-content">
      <div style="font-size:32px;margin-bottom:12px;">❤️</div>
      <p style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.8);">${escapeHtml(title)}</p>
      <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Digital Yearbook</p>
      <div style="margin-top:16px;height:1px;width:64px;background:rgba(255,255,255,0.1);"></div>
      <p style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:16px;">Made with ❤ by NEMCO</p>
    </div>
  </div>`
}

function buildSectionPageHtml(name) {
  return `<div class="page section-page">
    <div style="height:1px;width:64px;background:rgba(0,0,0,0.1);margin-bottom:16px;"></div>
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.04);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">✨</div>
    <h3 style="font-size:22px;font-weight:700;color:#333;">${escapeHtml(name)}</h3>
    <div style="margin-top:8px;height:2px;width:48px;border-radius:2px;background:rgba(212,165,72,0.4);"></div>
    <div style="height:1px;width:64px;background:rgba(0,0,0,0.1);margin-top:16px;"></div>
  </div>`
}

function buildStudentPageHtml(profile, pageNum, totalPages) {
  if (!profile) {
    return `<div class="page" style="display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;">Empty page</div>`
  }

  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()

  let avatarHtml
  if (profile.avatar_url) {
    avatarHtml = `<img src="${profile.avatar_url}" alt="${escapeHtml(name)}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;box-shadow:0 4px 16px rgba(0,0,0,0.1);" />`
  } else {
    avatarHtml = `<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,rgba(100,110,140,0.1),rgba(100,110,140,0.2));display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;color:rgba(100,110,140,0.6);">${initial}</div>`
  }

  const tags = []
  if (profile.course_or_strand) tags.push(`<span class="tag">${escapeHtml(profile.course_or_strand)}</span>`)
  if (profile.year_level) tags.push(`<span class="tag">${escapeHtml(profile.year_level)}</span>`)
  if (profile.section) tags.push(`<span class="tag">${escapeHtml(profile.section)}</span>`)

  return `<div class="page student-page">
    <div style="height:1px;width:64px;background:linear-gradient(to right,transparent,rgba(0,0,0,0.06),transparent);margin-bottom:16px;"></div>
    ${avatarHtml}
    <h2 style="margin-top:16px;font-size:20px;font-weight:700;color:#333;">${escapeHtml(name)}</h2>
    ${profile.student_number ? `<p style="font-size:10px;color:#aaa;margin-top:2px;">${escapeHtml(profile.student_number)}</p>` : ""}
    ${tags.length > 0 ? `<div class="tags">${tags.join("")}</div>` : ""}
    ${profile.bio ? `<p class="bio">${escapeHtml(profile.bio)}</p>` : ""}
    ${profile.quote ? `<blockquote class="quote">"${escapeHtml(profile.quote)}"</blockquote>` : ""}
    <div style="padding-top:8px;">
      <span style="font-size:9px;color:rgba(0,0,0,0.2);">${pageNum} / ${totalPages}</span>
    </div>
  </div>`
}

function buildFlipbookHtml(title, pagesHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Flipbook</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #faf8f5 0%, #f0ede8 30%, #e8e4de 60%, #f0ede8 100%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding: 10px 20px;
    background: rgba(255,255,255,0.8);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  }
  .toolbar h1 { font-size: 14px; font-weight: 700; color: #333; }
  .toolbar span { font-size: 11px; color: #999; }
  .toolbar button {
    padding: 6px 14px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 8px;
    background: #fff;
    cursor: pointer;
    font-size: 12px;
    color: #555;
    transition: all 0.2s;
  }
  .toolbar button:hover { background: #f5f5f5; }
  .toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }
  .book-container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    max-width: 1200px;
  }
  .page {
    width: 380px;
    height: 268px;
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .cover {
    background: linear-gradient(135deg, #1a3a5c, #132F45, #0d1f33);
    color: #fff;
  }
  .cover-content {
    text-align: center;
    z-index: 1;
  }
  .cover-icon { font-size: 40px; margin-bottom: 12px; }
  .cover-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
  .cover-subtitle { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 6px; }
  .cover-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 16px;
    padding: 5px 14px;
    border-radius: 20px;
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.1);
    font-size: 11px;
    color: rgba(255,255,255,0.8);
  }
  .back-cover {
    background: linear-gradient(135deg, #0d1f33, #132F45, #1a3a5c);
    color: #fff;
  }
  .section-page {
    background: linear-gradient(135deg, rgba(100,110,140,0.03), #fff, rgba(100,110,140,0.03));
  }
  .student-page { text-align: center; }
  .tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 12px;
    background: rgba(100,110,140,0.06);
    font-size: 10px;
    font-weight: 500;
    color: #666;
    margin: 4px 2px;
  }
  .tags { margin-top: 8px; }
  .bio { font-size: 11px; color: #777; margin-top: 10px; line-height: 1.5; max-width: 260px; }
  .quote { font-size: 11px; font-style: italic; color: #999; margin-top: 10px; max-width: 260px; padding-left: 10px; border-left: 2px solid rgba(100,110,140,0.2); }
  .page-label {
    position: absolute;
    bottom: 8px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 9px;
    color: rgba(0,0,0,0.2);
  }
  .page-num {
    font-size: 11px;
    color: #999;
    margin-top: 12px;
  }
  @media print {
    .toolbar { display: none; }
    body { background: #fff; padding: 0; }
    .book-container { gap: 0; }
    .page { box-shadow: none; border-radius: 0; page-break-inside: avoid; margin-bottom: 16px; }
  }
</style>
</head>
<body>
<div class="toolbar">
  <h1>📖 ${escapeHtml(title)}</h1>
  <span>|</span>
  <span id="pageIndicator">Page 1 of ${pagesHtml.length}</span>
  <div style="flex:1;"></div>
  <button id="btnPrev" onclick="changePage(-1)">← Previous</button>
  <button id="btnNext" onclick="changePage(1)">Next →</button>
  <button onclick="window.print()">🖨️ Print</button>
</div>
<div class="book-container" id="bookContainer">
  ${pagesHtml.join("\n")}
</div>
<script>
  var pages = document.querySelectorAll('.page');
  var currentPage = 0;
  var totalPages = pages.length;
  var indicator = document.getElementById('pageIndicator');
  var btnPrev = document.getElementById('btnPrev');
  var btnNext = document.getElementById('btnNext');

  function showPage(idx) {
    if (idx < 0 || idx >= totalPages) return;
    pages[currentPage].style.outline = 'none';
    currentPage = idx;
    pages[currentPage].style.outline = '3px solid #d4a548';
    pages[currentPage].style.outlineOffset = '-3px';
    pages[currentPage].scrollIntoView({ behavior: 'smooth', block: 'center' });
    indicator.textContent = 'Page ' + (currentPage + 1) + ' of ' + totalPages;
    btnPrev.disabled = currentPage === 0;
    btnNext.disabled = currentPage === totalPages - 1;
  }

  function changePage(dir) {
    showPage(currentPage + dir);
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); changePage(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); changePage(-1); }
  });

  showPage(0);
</script>
</body>
</html>`
}
