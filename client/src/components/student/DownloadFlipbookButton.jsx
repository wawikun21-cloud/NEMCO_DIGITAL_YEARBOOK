import { useState, useCallback } from "react"
import { BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const MAX_IMAGE_WIDTH = 1200
const JPEG_QUALITY = 0.8

function escapeHtml(str) {
  if (!str) return ""
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function fetchAsBase64(url) {
  return new Promise((resolve, reject) => {
    if (!url) return reject(new Error("no url"))
    if (url.startsWith("data:")) return resolve(url)
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      try {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w > MAX_IMAGE_WIDTH) {
          h = Math.round((h * MAX_IMAGE_WIDTH) / w)
          w = MAX_IMAGE_WIDTH
        }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY))
      } catch (e) {
        reject(e)
      }
    }
    img.onerror = () => reject(new Error("image load failed: " + url))
    img.src = url
  })
}

function buildCoverContent(title, subtitle) {
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a3a5c,#132F45,#0d1f33);color:#fff;border-radius:0 8px 8px 0;position:relative;overflow:hidden;">
    <div style="position:absolute;inset:0;opacity:10;background-image:radial-gradient(circle at 30% 20%,rgba(255,255,255,0.15) 0%,transparent 50%),radial-gradient(circle at 70% 80%,rgba(255,255,255,0.1) 0%,transparent 50%);"></div>
    <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(to right,transparent,#d9a300,transparent);"></div>
    <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(to right,transparent,#d9a300,transparent);"></div>
    <div style="font-size:48px;margin-bottom:16px;position:relative;z-index:1;">🎓</div>
    <h1 style="font-size:28px;font-weight:800;letter-spacing:-0.5px;line-height:1.2;position:relative;z-index:1;text-align:center;padding:0 20px;">${escapeHtml(title)}</h1>
    ${subtitle ? `<p style="font-size:14px;color:rgba(255,255,255,0.6);margin-top:8px;position:relative;z-index:1;">${escapeHtml(subtitle)}</p>` : ""}
    <div style="display:inline-flex;align-items:center;gap:6px;margin-top:20px;padding:6px 16px;border-radius:20px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.1);font-size:11px;color:rgba(255,255,255,0.8);position:relative;z-index:1;">📖 Interactive Flipbook</div>
  </div>`
}

function buildBackCoverContent(title) {
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,#0d1f33,#132F45,#1a3a5c);color:#fff;border-radius:8px 0 0 8px;">
    <div style="font-size:32px;margin-bottom:12px;">❤️</div>
    <p style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.8);">${escapeHtml(title)}</p>
    <p style="font-size:12px;color:rgba(255,255,255,0.4);margin-top:4px;">Digital Yearbook</p>
    <div style="margin-top:16px;height:1px;width:64px;background:rgba(255,255,255,0.1);"></div>
    <p style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:16px;">Made with ❤ by NEMCO</p>
  </div>`
}

function buildSectionContent(name) {
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:linear-gradient(135deg,rgba(100,110,140,0.03),#fff,rgba(100,110,140,0.03));">
    <div style="height:1px;width:64px;background:rgba(0,0,0,0.1);margin-bottom:16px;"></div>
    <div style="width:48px;height:48px;border-radius:50%;background:rgba(0,0,0,0.04);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">✨</div>
    <h3 style="font-size:22px;font-weight:700;color:#333;">${escapeHtml(name)}</h3>
    <div style="margin-top:8px;height:2px;width:48px;border-radius:2px;background:rgba(212,165,72,0.4);"></div>
    <div style="height:1px;width:64px;background:rgba(0,0,0,0.1);margin-top:16px;"></div>
  </div>`
}

function buildStudentContent(profile, avatarDataUrl) {
  if (!profile) {
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;background:#fff;">Empty page</div>`
  }
  const name = profile.display_name || profile.full_name || "Unknown"
  const initial = name.charAt(0).toUpperCase()

  let avatarHtml
  if (avatarDataUrl) {
    avatarHtml = `<img src="${avatarDataUrl}" alt="${escapeHtml(name)}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;box-shadow:0 4px 16px rgba(0,0,0,0.1);" />`
  } else {
    avatarHtml = `<div style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,rgba(100,110,140,0.1),rgba(100,110,140,0.2));display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:700;color:rgba(100,110,140,0.6);">${initial}</div>`
  }

  const tags = []
  if (profile.course_or_strand) tags.push(`<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:rgba(100,110,140,0.06);font-size:10px;font-weight:500;color:#666;margin:4px 2px;">${escapeHtml(profile.course_or_strand)}</span>`)
  if (profile.year_level) tags.push(`<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:rgba(100,110,140,0.06);font-size:10px;font-weight:500;color:#666;margin:4px 2px;">${escapeHtml(profile.year_level)}</span>`)
  if (profile.section) tags.push(`<span style="display:inline-block;padding:3px 10px;border-radius:12px;background:rgba(100,110,140,0.06);font-size:10px;font-weight:500;color:#666;margin:4px 2px;">${escapeHtml(profile.section)}</span>`)

  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fff;text-align:center;padding:28px;">
    <div style="height:1px;width:64px;background:linear-gradient(to right,transparent,rgba(0,0,0,0.06),transparent);margin-bottom:16px;"></div>
    ${avatarHtml}
    <h2 style="margin-top:16px;font-size:20px;font-weight:700;color:#333;">${escapeHtml(name)}</h2>
    ${profile.student_number ? `<p style="font-size:10px;color:#aaa;margin-top:2px;">${escapeHtml(profile.student_number)}</p>` : ""}
    ${tags.length > 0 ? `<div style="margin-top:8px;">${tags.join("")}</div>` : ""}
    ${profile.bio ? `<p style="font-size:11px;color:#777;margin-top:10px;line-height:1.5;max-width:280px;">${escapeHtml(profile.bio)}</p>` : ""}
    ${profile.quote ? `<blockquote style="font-size:11px;font-style:italic;color:#999;margin-top:10px;max-width:280px;padding-left:10px;border-left:2px solid rgba(100,110,140,0.2);">"${escapeHtml(profile.quote)}"</blockquote>` : ""}
  </div>`
}

function buildStudentBackContent(profile) {
  if (!profile) {
    return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#ccc;font-size:12px;background:#fafafa;">Empty page</div>`
  }
  const quote = profile.quote || "The future belongs to those who believe in the beauty of their dreams."
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#fafafa;padding:28px;">
    <div style="height:48px;width:48px;border-radius:50%;background:rgba(19,47,69,0.05);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">🎓</div>
    <p style="font-size:12px;color:rgba(0,0,0,0.35);max-width:240px;text-align:center;line-height:1.6;font-style:italic;">"${escapeHtml(quote)}"</p>
    <div style="margin-top:20px;height:1px;width:40px;background:rgba(0,0,0,0.06);"></div>
  </div>`
}

function buildPdfContent(imgDataUrl, title, pageNum) {
  if (imgDataUrl) {
    return `<div style="width:100%;height:100%;background:#fff;display:flex;flex-direction:column;">
      <div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;">
        <img src="${imgDataUrl}" style="max-width:100%;max-height:100%;object-fit:contain;" />
      </div>
      <div style="text-align:center;padding:6px;border-top:1px solid #f0f0f0;font-size:9px;color:rgba(0,0,0,0.3);">${escapeHtml(title || "PDF")} • Page ${pageNum}</div>
    </div>`
  }
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:#999;background:#fff;">
    <div style="font-size:24px;opacity:0.3;">📄</div>
    <span style="font-size:11px;">${escapeHtml(title || "PDF")} • Page ${pageNum}</span>
    <span style="font-size:10px;color:#bbb;">Image unavailable</span>
  </div>`
}

function buildFlipbookHtml(title, pagesData) {
  const PAGE_W = 420
  const PAGE_H = 580
  const totalSheets = pagesData.length

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Flipbook</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    height: 100%; overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    user-select: none;
  }
  .toolbar {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; gap: 10px;
    padding: 10px 20px;
    background: rgba(26,26,46,0.94); backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .toolbar h1 { font-size: 14px; font-weight: 700; color: #fff; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .toolbar .sep { color: rgba(255,255,255,0.2); flex-shrink: 0; }
  .toolbar .page-indicator { font-size: 12px; color: rgba(255,255,255,0.5); min-width: 90px; text-align: center; flex-shrink: 0; }
  .toolbar .spacer { flex: 1; min-width: 4px; }
  .toolbar button {
    padding: 6px 14px; border: 1px solid rgba(255,255,255,0.12);
    border-radius: 8px; background: rgba(255,255,255,0.06);
    cursor: pointer; font-size: 12px; color: rgba(255,255,255,0.8);
    transition: background 0.2s; flex-shrink: 0; white-space: nowrap;
  }
  .toolbar button:hover:not(:disabled) { background: rgba(255,255,255,0.12); }
  .toolbar button:disabled { opacity: 0.3; cursor: not-allowed; pointer-events: none; }
  .book-area {
    position: fixed; top: var(--bar-top, 52px); bottom: var(--bar-bottom, 60px); left: 0; right: 0;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
  }
  .scene {
    perspective: 2000px; -webkit-perspective: 2000px;
    display: flex; align-items: center; justify-content: center;
  }
  .book {
    position: relative; width: var(--book-w, ${PAGE_W}px); height: var(--book-h, ${PAGE_H}px);
    transform-style: preserve-3d; -webkit-transform-style: preserve-3d;
  }
  .sheet {
    position: absolute; top: 0; left: 0;
    width: var(--book-w, ${PAGE_W}px); height: var(--book-h, ${PAGE_H}px);
    transform-style: preserve-3d; -webkit-transform-style: preserve-3d;
    transform-origin: left center; -webkit-transform-origin: left center;
    transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
    -webkit-transition: -webkit-transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
    transform: rotateY(0deg) translateZ(0); -webkit-transform: rotateY(0deg) translateZ(0);
    will-change: transform;
  }
  .sheet.flipped { transform: rotateY(-180deg) translateZ(0); -webkit-transform: rotateY(-180deg) translateZ(0); }
  .face {
    position: absolute; inset: 0; overflow: hidden;
    backface-visibility: hidden; -webkit-backface-visibility: hidden;
    transform: translateZ(0); -webkit-transform: translateZ(0);
  }
  .face-back { transform: rotateY(180deg) translateZ(0); -webkit-transform: rotateY(180deg) translateZ(0); }
  .page-content { width: 100%; height: 100%; }
  .nav-zone {
    position: fixed; top: var(--bar-top, 52px); bottom: var(--bar-bottom, 60px); z-index: 100;
    cursor: pointer; transition: background 0.2s; pointer-events: auto;
  }
  .nav-zone:hover { background: rgba(255,255,255,0.02); }
  .nav-left { left: 0; width: 15%; }
  .nav-right { right: 0; width: 15%; }
  .bottom-bar {
    position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: center; gap: 14px;
    padding: 12px 20px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom));
    background: rgba(26,26,46,0.94); backdrop-filter: blur(12px);
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .bottom-bar button {
    width: 38px; height: 38px;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 50%; background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.8); cursor: pointer; font-size: 15px;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.2s;
  }
  .bottom-bar button:hover:not(:disabled) { background: rgba(255,255,255,0.14); }
  .bottom-bar button:disabled { opacity: 0.25; cursor: not-allowed; pointer-events: none; }
  .bottom-bar .page-counter {
    font-size: 13px; color: rgba(255,255,255,0.6);
    min-width: 100px; text-align: center;
  }
  @media (max-width: 640px) {
    .toolbar { padding: 8px 10px; gap: 6px; }
    .toolbar h1 { font-size: 12px; max-width: 40vw; }
    .toolbar .page-indicator { display: none; }
    .toolbar button { padding: 5px 9px; font-size: 11px; }
    .toolbar #btnPrint { display: none; }
    .bottom-bar { padding: 8px 10px; padding-bottom: calc(8px + env(safe-area-inset-bottom)); gap: 8px; }
    .bottom-bar .page-counter { font-size: 11px; min-width: 76px; }
    .bottom-bar button { width: 32px; height: 32px; font-size: 13px; }
    .nav-left { width: 10%; }
    .nav-right { width: 10%; }
  }
  @media print {
    .toolbar, .bottom-bar, .nav-zone { display: none !important; }
    body { background: #fff; }
    .scene { perspective: none; }
    .book { transform: none !important; }
    .sheet { position: relative; transform: none !important; page-break-after: always; margin-bottom: 20px; }
    .face { position: relative; backface-visibility: visible; box-shadow: none; }
  }
</style>
</head>
<body>
<div class="toolbar" id="toolbar">
  <h1>📖 ${escapeHtml(title)}</h1>
  <span class="sep">|</span>
  <span class="page-indicator" id="pageIndicator">Cover</span>
  <div class="spacer"></div>
  <button id="btnPrev" onclick="changePage(-1)">← Prev</button>
  <button id="btnNext" onclick="changePage(1)">Next →</button>
  <button id="btnPrint" onclick="window.print()">🖨️ Print</button>
</div>
<div class="book-area">
  <div class="scene">
    <div class="book" id="book"></div>
  </div>
</div>
<div class="nav-zone nav-left" id="navLeft" onclick="changePage(-1)"></div>
<div class="nav-zone nav-right" id="navRight" onclick="changePage(1)"></div>
<div class="bottom-bar" id="bottomBar">
  <button id="btnFirst" onclick="goToPage(0)" aria-label="First">⏮</button>
  <button id="btnBottomPrev" onclick="changePage(-1)" aria-label="Previous">◀</button>
  <span class="page-counter" id="bottomCounter">Page 1 of ${totalSheets}</span>
  <button id="btnBottomNext" onclick="changePage(1)" aria-label="Next">▶</button>
  <button id="btnLast" onclick="goToPage(${totalSheets - 1})" aria-label="Last">⏭</button>
</div>
<script>
(function() {
  var pagesData = ${JSON.stringify(pagesData)};
  var totalPages = pagesData.length;
  if (totalPages % 2 !== 0) {
    pagesData.push('<div style="width:100%;height:100%;background:#f5f3ef;"></div>');
    totalPages++;
  }
  var totalSheets = Math.ceil(totalPages / 2);
  var book = document.getElementById('book');
  var currentPage = 0;
  var isAnimating = false;

  var BOOK_ASPECT = ${PAGE_W} / ${PAGE_H};
  var MAX_W = ${PAGE_W}, MAX_H = ${PAGE_H};
  var MIN_W = 220, MIN_H = Math.round(220 / BOOK_ASPECT);
  var MOBILE_BREAKPOINT = 640;
  var toolbarEl = document.getElementById('toolbar');
  var bottomBarEl = document.getElementById('bottomBar');
  function layout() {
    var barTop = toolbarEl ? toolbarEl.getBoundingClientRect().height : 52;
    var barBottom = bottomBarEl ? bottomBarEl.getBoundingClientRect().height : 60;
    document.documentElement.style.setProperty('--bar-top', barTop + 'px');
    document.documentElement.style.setProperty('--bar-bottom', barBottom + 'px');

    var vv = window.visualViewport;
    var viewportW = vv ? vv.width : window.innerWidth;
    var viewportH = vv ? vv.height : window.innerHeight;
    var isMobile = viewportW < MOBILE_BREAKPOINT;
    var pad = isMobile ? 12 : 24; // breathing room; tighter on phones so the single page fills the screen
    var availW = viewportW - pad;
    var availH = viewportH - barTop - barBottom - pad;
    var w = Math.min(MAX_W, availW);
    var h = Math.round(w / BOOK_ASPECT);
    if (h > availH) {
      h = Math.max(MIN_H, Math.min(availH, MAX_H));
      w = Math.round(h * BOOK_ASPECT);
    }
    w = Math.max(MIN_W, w);
    h = Math.max(MIN_H, h);
    document.documentElement.style.setProperty('--book-w', w + 'px');
    document.documentElement.style.setProperty('--book-h', h + 'px');
  }
  layout();
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', layout);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', layout);
    window.visualViewport.addEventListener('scroll', layout);
  }

  function renderSheets() {
    book.innerHTML = '';
    for (var i = 0; i < totalSheets; i++) {
      var sheet = document.createElement('div');
      sheet.className = 'sheet';
      sheet.setAttribute('data-index', i);

      var front = document.createElement('div');
      front.className = 'face front';
      var frontContent = document.createElement('div');
      frontContent.className = 'page-content';
      frontContent.innerHTML = pagesData[i * 2] || '<div style="width:100%;height:100%;background:#f5f3ef;"></div>';
      front.appendChild(frontContent);

      var back = document.createElement('div');
      back.className = 'face face-back';
      var backContent = document.createElement('div');
      backContent.className = 'page-content';
      backContent.innerHTML = pagesData[i * 2 + 1] || '<div style="width:100%;height:100%;background:#f5f3ef;"></div>';
      back.appendChild(backContent);

      sheet.appendChild(front);
      sheet.appendChild(back);
      book.appendChild(sheet);
    }
  }

  function updateView() {
    var sheets = book.querySelectorAll('.sheet');
    for (var i = 0; i < sheets.length; i++) {
      if (i < currentPage) {
        sheets[i].classList.add('flipped');
        sheets[i].style.zIndex = (i + 1);
      } else {
        sheets[i].classList.remove('flipped');
        sheets[i].style.zIndex = (totalSheets - i);
      }
    }
    var frontPage = currentPage * 2 + 1;
    var backPage = currentPage * 2 + 2;
    var label;
    if (currentPage === 0) label = 'Cover';
    else if (currentPage === totalSheets - 1) label = 'Back Cover';
    else label = 'Pages ' + frontPage + '–' + backPage + ' of ' + totalPages;
    var indicator = document.getElementById('pageIndicator');
    var counter = document.getElementById('bottomCounter');
    if (indicator) indicator.textContent = label;
    if (counter) counter.textContent = 'Pages ' + frontPage + '–' + backPage + ' of ' + totalPages;
    var prevDisabled = currentPage === 0;
    var nextDisabled = currentPage >= totalSheets - 1;
    document.getElementById('btnPrev').disabled = prevDisabled;
    document.getElementById('btnNext').disabled = nextDisabled;
    document.getElementById('btnFirst').disabled = prevDisabled;
    document.getElementById('btnBottomPrev').disabled = prevDisabled;
    document.getElementById('btnBottomNext').disabled = nextDisabled;
    document.getElementById('btnLast').disabled = nextDisabled;
  }

  window.changePage = function(dir) {
    if (isAnimating) return;
    var target = currentPage + dir;
    if (target < 0 || target >= totalSheets) return;
    isAnimating = true;
    currentPage = target;
    updateView();
    setTimeout(function() { isAnimating = false; }, 850);
  };

  window.goToPage = function(idx) {
    if (isAnimating) return;
    if (idx < 0 || idx >= totalSheets) return;
    isAnimating = true;
    currentPage = idx;
    updateView();
    setTimeout(function() { isAnimating = false; }, 850);
  };

  document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); window.changePage(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); window.changePage(-1); }
    else if (e.key === 'Home') { e.preventDefault(); window.goToPage(0); }
    else if (e.key === 'End') { e.preventDefault(); window.goToPage(totalSheets - 1); }
  });

  var touchStartX = 0;
  document.addEventListener('touchstart', function(e) { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', function(e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { window.changePage(dx < 0 ? 1 : -1); }
  });

  renderSheets();
  updateView();
})();
</script>
</body>
</html>`
}

export default function DownloadFlipbookButton({ pageList, pdfImages, data }) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState(null)

  const handleDownload = useCallback(async () => {
    if (generating) return
    setGenerating(true)
    setProgress({ current: 0, total: 0, percent: 0 })
    toast.loading("Preparing download… 0%", { id: "flipbook-download" })

    try {
      const title = data?.settings?.title || "NEMCO Digital Yearbook"
      const subtitle = data?.settings?.subtitle || ""

      const avatarUrls = new Set()
      for (const page of pageList) {
        if ((page.type === "student" || page.type === "student-back") && page.data?.profile?.avatar_url) {
          avatarUrls.add(page.data.profile.avatar_url)
        }
        if (page.type === "cover" && (page._designPage?.type === "student" || page._designPage?.type === "student-back")) {
          const coverAvatar = page._designPage.data?.profile?.avatar_url
          if (coverAvatar) avatarUrls.add(coverAvatar)
        }
      }

      const avatarMap = {}
      const avatarArr = Array.from(avatarUrls)
      const totalImages = avatarArr.length
      setProgress({ current: 0, total: totalImages, percent: 0 })

      for (let i = 0; i < avatarArr.length; i++) {
        const url = avatarArr[i]
        try {
          avatarMap[url] = await fetchAsBase64(url)
        } catch {
          avatarMap[url] = null
        }
        const pct = Math.round(((i + 1) / totalImages) * 100)
        setProgress({ current: i + 1, total: totalImages, percent: pct })
        toast.loading(`Preparing download… ${pct}%`, { id: "flipbook-download" })
      }

      setProgress(null)

      const pagesData = pageList.map((page) => {
        if (page.type === "cover") {
          const dp = page._designPage
          if (dp?.type === "pdf") {
            const imgKey = `${dp.data.id}-${dp.pageNum}`
            const imgData = pdfImages[imgKey]
            if (imgData) return buildPdfContent(imgData, dp.data.title, dp.pageNum)
          } else if (dp?.type === "section") {
            return buildSectionContent(dp.name || "Section")
          } else if (dp?.type === "student") {
            const profile = dp.data?.profile
            const avatar = profile?.avatar_url ? avatarMap[profile.avatar_url] || null : null
            return buildStudentContent(profile, avatar)
          } else if (dp?.type === "student-back") {
            return buildStudentBackContent(dp.data?.profile)
          }
          return buildCoverContent(title, subtitle)
        }
        if (page.type === "back-cover") return buildBackCoverContent(title)
        if (page.type === "section") return buildSectionContent(page.name || "Section")
        if (page.type === "student") {
          const profile = page.data?.profile
          const avatar = profile?.avatar_url ? avatarMap[profile.avatar_url] || null : null
          return buildStudentContent(profile, avatar)
        }
        if (page.type === "student-back") {
          return buildStudentBackContent(page.data?.profile)
        }
        if (page.type === "pdf") {
          const imgKey = `${page.data.id}-${page.pageNum}`
          const imgData = pdfImages[imgKey]
          return buildPdfContent(imgData || null, page.data.title, page.pageNum)
        }
        return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#fff;color:#ccc;font-size:12px;">Empty page</div>`
      })

      const html = buildFlipbookHtml(title, pagesData)
      const blob = new Blob([html], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title.replace(/[^a-zA-Z0-9]+/g, "_")}_flipbook.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("Flipbook downloaded!", { id: "flipbook-download" })
    } catch (err) {
      console.error("Flipbook generation error:", err)
      toast.error("Failed to generate flipbook: " + (err.message || "Unknown error"), { id: "flipbook-download" })
    } finally {
      setGenerating(false)
      setProgress(null)
    }
  }, [generating, pageList, pdfImages, data])

  return (
    <>
      {progress && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl p-6 w-72 text-center">
            <div className="mb-3">
              <Loader2 size={28} className="animate-spin text-[var(--accent-gold)] mx-auto" />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Preparing download…</p>
            <div className="h-2 rounded-full bg-black/10 overflow-hidden mb-1">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold)]/70 transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              {progress.current} / {progress.total} images
            </p>
          </div>
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownload}
        disabled={generating}
        className="gap-2 text-xs border-[var(--border-light)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] dark:border-white dark:bg-[var(--bg-surface)] dark:text-[var(--text-primary)] dark:hover:white dark:hover:text-black"
      >
        {generating ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <BookOpen size={14} />
        )}
        {generating ? "Generating…" : "Download Flipbook"}
      </Button>
    </>
  )
}