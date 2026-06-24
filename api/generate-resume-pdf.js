/**
 * api/generate-resume-pdf.js
 *
 * Vercel Serverless Function — POST /api/generate-resume-pdf
 * Also called directly by Express (resumePdfController.js) in local dev.
 *
 * Chrome resolution strategy:
 *   1. CHROME_EXECUTABLE_PATH env var  → set this in .env for local dev
 *      Windows default: C:\Program Files\Google\Chrome\Application\chrome.exe
 *      macOS default:   /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
 *      Linux default:   /usr/bin/google-chrome  or  /usr/bin/chromium-browser
 *   2. @sparticuz/chromium              → used automatically on Vercel serverless
 */

import fs from "fs"

// Vercel-only packages — loaded dynamically to avoid ERR_MODULE_NOT_FOUND
// when they aren't installed in local dev environments.
let _chromium = null
async function getChromium() {
  if (_chromium) return _chromium
  try {
    _chromium = await import("@sparticuz/chromium")
  } catch {
    _chromium = { default: null }
  }
  return _chromium
}

let _puppeteer = null
async function getPuppeteer() {
  if (_puppeteer) return _puppeteer
  _puppeteer = await import("puppeteer-core")
  return _puppeteer
}

// ── A4 dimensions at 96 dpi ────────────────────────────────────────────────
const A4_WIDTH_PX  = 794
const A4_HEIGHT_PX = 1123

// ── Common local Chrome paths per OS (fallback if CHROME_EXECUTABLE_PATH unset) ──
const LOCAL_CHROME_CANDIDATES = [
  // Windows
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  // Linux
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/snap/bin/chromium",
]

function findLocalChrome() {
  const envPath = process.env.CHROME_EXECUTABLE_PATH
  if (envPath && fs.existsSync(envPath)) return envPath
  for (const p of LOCAL_CHROME_CANDIDATES) {
    if (fs.existsSync(p)) return p
  }
  return null
}

export const config = {
  api: { bodyParser: { sizeLimit: "4mb" } },
  maxDuration: 30,
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { data = {}, sections = [], template = {} } = req.body

  if (!data || !sections.length) {
    return res.status(400).json({ error: "Missing resume data or sections" })
  }

  let browser = null
  let executablePath = null

  try {
    // ── 1. Build the self-contained HTML ──────────────────────────────────────
    const html = buildResumeHtml({ data, sections, template })

    // ── 2. Resolve Chrome executable ─────────────────────────────────────────
    const localChrome = findLocalChrome()
    let launchArgs
    let headless

    if (localChrome) {
      // Local dev — use the machine's installed Chrome
      executablePath = localChrome
      launchArgs     = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
      headless       = true
      console.log("[generate-resume-pdf] Dev mode — local Chrome:", executablePath)
    } else {
      // Vercel serverless — use the bundled Chromium binary
      const sparticuz = await getChromium()
      const chromiumDefault = sparticuz.default || sparticuz
      executablePath = await chromiumDefault.executablePath()
      launchArgs     = chromiumDefault.args
      headless       = chromiumDefault.headless
      console.log("[generate-resume-pdf] Serverless mode — @sparticuz/chromium:", executablePath)
    }

    if (!executablePath) {
      throw new Error(
        "No Chrome executable found. " +
        "Set CHROME_EXECUTABLE_PATH in your .env file pointing to your local Chrome installation. " +
        "Example: CHROME_EXECUTABLE_PATH=/usr/bin/google-chrome"
      )
    }

    // ── 3. Launch headless Chrome ─────────────────────────────────────────────
     const puppeteer = await getPuppeteer()
     browser = await puppeteer.launch({
      args: launchArgs,
      defaultViewport: { width: A4_WIDTH_PX, height: A4_HEIGHT_PX },
      executablePath,
      headless,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: ["networkidle0", "domcontentloaded"] })

    // ── 4. Generate PDF ───────────────────────────────────────────────────────
    const pdfBuffer = await page.pdf({
      width:           `${A4_WIDTH_PX}px`,
      height:          `${A4_HEIGHT_PX}px`,
      printBackground: true,
      pageRanges:      "1",
      margin:          { top: 0, right: 0, bottom: 0, left: 0 },
    })

    // ── 5. Stream PDF back ────────────────────────────────────────────────────
    const filename = `resume-${Date.now()}.pdf`
    res.setHeader("Content-Type",        "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.setHeader("Content-Length",      pdfBuffer.length)
    return res.status(200).end(pdfBuffer)

  } catch (err) {
    console.error(
      "[generate-resume-pdf] Error:",
      err.message,
      "| executablePath:", executablePath,
      "\n", err.stack
    )
    // Return consistent shape so the client hook can display the real message
    return res.status(500).json({ error: "PDF generation failed", detail: err.message })
  } finally {
    if (browser) {
      try { await browser.close() } catch (_) { /* ignore */ }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HTML builder — mirrors your three templates in pure inline-style HTML so
// Puppeteer needs no external assets (except the photo URL, which it fetches).
// ─────────────────────────────────────────────────────────────────────────────

function buildResumeHtml({ data, sections, template }) {
  const slug = template?.slug || "minimal"
  const p    = extractPersonal(data)

  let bodyContent = ""
  if      (slug === "classic") bodyContent = buildClassic({ data, sections, p })
  else if (slug === "modern")  bodyContent = buildModern({ data, sections, p })
  else                         bodyContent = buildMinimal({ data, sections, p })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: ${A4_WIDTH_PX}px;
      height: ${A4_HEIGHT_PX}px;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: ${A4_WIDTH_PX}px ${A4_HEIGHT_PX}px; margin: 0; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .serif { font-family: Georgia, 'Times New Roman', Times, serif; }
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`
}

// ── Helper: extract personal info (mirrors resumeHelpers.js) ─────────────────
function extractPersonal(data) {
  const personal = data?.personal || {}
  return {
    name:      personal.name      || data?.name      || "",
    title:     personal.title     || personal.headline || data?.title || "",
    email:     personal.email     || data?.email     || "",
    phone:     personal.phone     || data?.phone     || "",
    location:  personal.location  || data?.location  || "",
    linkedin:  personal.linkedin  || data?.linkedin  || "",
    website:   personal.website   || data?.website   || "",
    photo_url: personal.photo_url || data?.photo_url || "",
  }
}

// ── Helper: render a section value (mirrors resumeHelpers.js) ────────────────
function renderSectionValue(section, value) {
  if (value === null || value === undefined) return null
  switch (section.field_type) {
    case "text":
    case "textarea":
      return typeof value === "string" && value.trim() ? value : null
    case "list":
    case "skills":
    case "education":
    case "experience":
    case "achievements":
    case "references":
      return Array.isArray(value) && value.length > 0 ? value : null
    default:
      return value || null
  }
}

function formatDate(str) {
  if (!str) return ""
  if (str === "Present") return "Present"
  try { return new Date(str).toLocaleDateString("en-US", { month: "short", year: "numeric" }) }
  catch { return str }
}

function formatDateRange(from, to) {
  const f = formatDate(from)
  const t = formatDate(to)
  if (!f && !t) return ""
  if (!t) return f
  return `${f} – ${t}`
}

// ── SectionContent renderer → HTML string ────────────────────────────────────
function renderSectionContent(fieldType, value, tokens) {
  const {
    bodySize    = 11,
    textColor   = "#1a1a1a",
    mutedColor  = "#6b7280",
    accentColor = "#132F45",
    headingColor,
    template    = "minimal",
    isOnDark    = false,
  } = tokens

  const titleColor  = headingColor || (isOnDark ? "#ffffff" : accentColor)
  const captionSize = Math.max(9, bodySize - 1)
  const smallSize   = bodySize
  const headingSize = bodySize + 3

  if (fieldType === "text" || fieldType === "textarea") {
    return `<p style="font-size:${bodySize}px;color:${textColor};margin:0;line-height:1.65;white-space:pre-line;">${esc(value)}</p>`
  }

  if (fieldType === "list") {
    return `<ul style="margin:0;padding-left:14px;list-style-type:disc;">${
      value.map(item => `<li style="font-size:${bodySize}px;color:${textColor};margin-bottom:2px;line-height:1.5;">${esc(item)}</li>`).join("")
    }</ul>`
  }

  if (fieldType === "skills") {
    if (template === "modern" && isOnDark) {
      return `<div style="display:flex;flex-wrap:wrap;gap:4px;">${
        value.map(s => `<span style="font-size:${captionSize}px;background:rgba(254,199,11,0.2);color:#FEC70B;border-radius:3px;padding:2px 6px;font-weight:600;">${esc(s)}</span>`).join("")
      }</div>`
    }
    if (template === "classic") {
      return `<p style="font-size:${bodySize}px;color:${textColor};margin:0;line-height:1.8;">${value.map(esc).join(" · ")}</p>`
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:5px;">${
      value.map(s => `<span style="font-size:${bodySize}px;background:#f3f4f6;color:${textColor};border-radius:4px;padding:2px 7px;border:1px solid #e5e7eb;">${esc(s)}</span>`).join("")
    }</div>`
  }

  if (fieldType === "education") {
    return `<div style="display:flex;flex-direction:column;gap:10px;">${
      value.map(entry => `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div style="flex:1;">
              <div style="font-size:${headingSize}px;font-weight:700;color:${titleColor};line-height:1.3;">${esc(entry.degree || "Degree")}</div>
              <div style="font-size:${bodySize}px;color:${textColor};margin-top:1px;">${esc(entry.school || "")}</div>
            </div>
            <div style="font-size:${captionSize}px;color:${mutedColor};text-align:right;flex-shrink:0;">
              ${esc(entry.year || "")}
              ${entry.gpa ? `<div style="margin-top:1px;">GPA: ${esc(entry.gpa)}</div>` : ""}
            </div>
          </div>
          ${entry.description ? `<p style="font-size:${smallSize}px;color:${mutedColor};margin:3px 0 0;line-height:1.55;">${esc(entry.description)}</p>` : ""}
        </div>`).join("")
    }</div>`
  }

  if (fieldType === "experience") {
    return `<div style="display:flex;flex-direction:column;gap:12px;">${
      value.map(entry => `
        <div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
            <div style="flex:1;">
              <div style="font-size:${headingSize}px;font-weight:700;color:${titleColor};line-height:1.3;">${esc(entry.role || "Role")}</div>
              <div style="font-size:${bodySize}px;color:${textColor};margin-top:1px;${template === "classic" ? "font-style:italic;" : ""}">${esc(entry.company || "")}</div>
            </div>
            ${(entry.from || entry.to) ? `<div style="font-size:${captionSize}px;color:${mutedColor};flex-shrink:0;text-align:right;">${formatDateRange(entry.from, entry.to)}</div>` : ""}
          </div>
          ${entry.description ? `<p style="font-size:${smallSize}px;color:${mutedColor};margin:4px 0 0;line-height:1.6;white-space:pre-line;">${esc(entry.description)}</p>` : ""}
        </div>`).join("")
    }</div>`
  }

  if (fieldType === "achievements") {
    return `<div style="display:flex;flex-direction:column;gap:8px;">${
      value.map(entry => `
        <div style="display:flex;gap:8px;">
          <div style="margin-top:4px;width:5px;height:5px;border-radius:50%;background:${accentColor};flex-shrink:0;"></div>
          <div>
            <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;">
              <span style="font-size:${bodySize}px;font-weight:700;color:${titleColor};">${esc(entry.title || "")}</span>
              ${entry.date ? `<span style="font-size:${captionSize}px;color:${mutedColor};">${esc(entry.date)}</span>` : ""}
            </div>
            ${entry.description ? `<p style="font-size:${smallSize}px;color:${mutedColor};margin:2px 0 0;line-height:1.5;">${esc(entry.description)}</p>` : ""}
          </div>
        </div>`).join("")
    }</div>`
  }

  if (fieldType === "references") {
    return `<div style="display:flex;flex-direction:column;gap:10px;">${
      value.map(entry => `
        <div>
          <div style="font-size:${bodySize}px;font-weight:700;color:${titleColor};">${esc(entry.name || "")}</div>
          ${entry.relationship ? `<div style="font-size:${smallSize}px;color:${mutedColor};">${esc(entry.relationship)}</div>` : ""}
          ${entry.contact      ? `<div style="font-size:${smallSize}px;color:${mutedColor};">${esc(entry.contact)}</div>` : ""}
          ${entry.email        ? `<div style="font-size:${smallSize}px;color:${mutedColor};">${esc(entry.email)}</div>` : ""}
        </div>`).join("")
    }</div>`
  }

  return ""
}

// ── HTML escape ───────────────────────────────────────────────────────────────
function esc(str) {
  if (str == null) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

// ── Photo img tag ─────────────────────────────────────────────────────────────
function photoTag(url, style) {
  if (!url) return ""
  return `<img src="${esc(url)}" alt="" style="${style}" crossorigin="anonymous" />`
}

// ══════════════════════════════════════════════════════════════════════════════
// MINIMAL TEMPLATE
// ══════════════════════════════════════════════════════════════════════════════
function buildMinimal({ data, sections, p }) {
  const ACCENT = "#2C4A6E"
  const MUTED  = "#718096"
  const TEXT   = "#1a202c"
  const RULE   = "#CBD5E0"

  const tokens = { bodySize: 11, textColor: TEXT, mutedColor: MUTED, accentColor: ACCENT, template: "minimal" }

  const contacts = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean)

  const headerHtml = `
    <header style="margin-bottom:28px;">
      <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;color:${TEXT};margin:0 0 4px;line-height:1.1;display:flex;align-items:center;">
        ${p.photo_url ? photoTag(p.photo_url, `border-radius:50%;object-fit:cover;width:72px;height:72px;margin-right:16px;flex-shrink:0;`) : ""}
        ${esc(p.name || "Your Name")}
      </h1>
      ${p.title ? `<p style="font-size:11px;color:${ACCENT};font-weight:500;margin:0 0 10px;letter-spacing:0.3px;">${esc(p.title)}</p>` : ""}
      ${contacts.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px 14px;">${
        contacts.map((c, i) => `<span style="font-size:9px;color:${MUTED};">${i > 0 ? `<span style="margin-right:14px;color:${RULE};">·</span>` : ""}${esc(c)}</span>`).join("")
      }</div>` : ""}
      <div style="height:1px;background:${RULE};margin-top:16px;"></div>
    </header>`

  const sectionsHtml = sections.map(section => {
    if (section.section_key === "personal") return ""
    const value    = data[section.section_key]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    return `
      <div style="margin-bottom:22px;display:flex;gap:0;">
        <div style="width:2px;background:${ACCENT};border-radius:1px;flex-shrink:0;margin-right:14px;margin-top:1px;"></div>
        <div style="flex:1;">
          <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:${ACCENT};margin:0 0 8px;">
            ${esc(section.label)}
          </h2>
          ${renderSectionContent(section.field_type, rendered, tokens)}
        </div>
      </div>`
  }).join("")

  return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,system-ui,sans-serif;color:${TEXT};line-height:1.55;padding:44px 52px;box-sizing:border-box;width:${A4_WIDTH_PX}px;min-height:${A4_HEIGHT_PX}px;background:#ffffff;">
      ${headerHtml}
      ${sectionsHtml}
    </div>`
}

// ══════════════════════════════════════════════════════════════════════════════
// CLASSIC TEMPLATE
// ══════════════════════════════════════════════════════════════════════════════
function buildClassic({ data, sections, p }) {
  const DARK       = "#1C1C1C"
  const BODY       = "#2D2D2D"
  const MUTED      = "#6B6B6B"
  const RULE_HEAVY = "#1C1C1C"
  const RULE_LIGHT = "#D4D4D4"

  const tokens = { bodySize: 12, textColor: BODY, mutedColor: MUTED, accentColor: DARK, template: "classic" }

  const contacts = [p.email, p.phone, p.location, p.linkedin].filter(Boolean)

  const headerHtml = `
    <header style="text-align:center;margin-bottom:24px;font-family:Georgia,'Times New Roman',Times,serif;">
      ${p.photo_url ? `<div style="margin:0 auto 12px;">${photoTag(p.photo_url, `border-radius:50%;object-fit:cover;width:100px;height:100px;display:block;margin:0 auto;`)}</div>` : ""}
      <h1 style="font-size:30px;font-weight:700;color:${DARK};margin:0 0 5px;letter-spacing:1px;font-family:Georgia,'Times New Roman',Times,serif;">
        ${esc(p.name || "Your Name")}
      </h1>
      ${p.title ? `<p style="font-size:11px;color:${MUTED};margin:0 0 10px;font-style:italic;font-family:Georgia,'Times New Roman',Times,serif;">${esc(p.title)}</p>` : ""}
      <div style="margin:0 auto 10px;max-width:70%;">
        <div style="height:2px;background:${RULE_HEAVY};margin-bottom:2px;"></div>
        <div style="height:1px;background:${RULE_LIGHT};"></div>
      </div>
      ${contacts.length ? `<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:0 6px;">${
        contacts.map((c, i) => `<span style="font-size:10px;color:${MUTED};font-family:Georgia,'Times New Roman',Times,serif;">${i > 0 ? `<span style="margin-right:6px;color:${RULE_LIGHT};">·</span>` : ""}${esc(c)}</span>`).join("")
      }</div>` : ""}
    </header>`

  const sectionsHtml = sections.map(section => {
    if (section.section_key === "personal") return ""
    const value    = data[section.section_key]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    return `
      <div style="margin-bottom:20px;">
        <div style="border-bottom:1.5px solid ${RULE_HEAVY};margin-bottom:7px;padding-bottom:2px;">
          <h2 style="font-size:14px;font-weight:700;font-variant:small-caps;letter-spacing:1.5px;color:${DARK};margin:0;font-family:Georgia,'Times New Roman',Times,serif;">
            ${esc(section.label)}
          </h2>
        </div>
        ${renderSectionContent(section.field_type, rendered, tokens)}
      </div>`
  }).join("")

  return `
    <div style="font-family:Georgia,'Times New Roman',Times,serif;color:${BODY};line-height:1.6;padding:48px 56px;box-sizing:border-box;width:${A4_WIDTH_PX}px;min-height:${A4_HEIGHT_PX}px;background:#ffffff;">
      ${headerHtml}
      ${sectionsHtml}
    </div>`
}

// ══════════════════════════════════════════════════════════════════════════════
// MODERN TEMPLATE (two-column dark sidebar)
// ══════════════════════════════════════════════════════════════════════════════
const MODERN_SIDEBAR_SECTIONS = ["skills", "references", "languages", "certifications", "contact"]

function buildModern({ data, sections, p }) {
  const SIDEBAR_BG  = "#3F3F3F"
  const GOLD        = "#FEC70B"
  const DARK        = "#333333"
  const WHITE       = "#FFFFFF"
  const WHITE_DIM   = "rgba(255,255,255,0.75)"
  const WHITE_MUTED = "rgba(255,255,255,0.45)"
  const MAIN_TEXT   = "#1A1A1A"
  const MAIN_MUTED  = "#555555"

  const sidebarTokens = { bodySize: 11, textColor: WHITE_DIM, mutedColor: WHITE_MUTED, accentColor: GOLD, headingColor: WHITE, template: "modern", isOnDark: true }
  const mainTokens    = { bodySize: 12, textColor: MAIN_TEXT, mutedColor: MAIN_MUTED, accentColor: DARK, template: "modern", isOnDark: false }

  const sidebarSections = sections.filter(s => MODERN_SIDEBAR_SECTIONS.includes(s.section_key) && s.section_key !== "personal")
  const mainSections    = sections.filter(s => !MODERN_SIDEBAR_SECTIONS.includes(s.section_key) && s.section_key !== "personal")

  const contacts = [
    p.phone    && { icon: "📞", value: p.phone },
    p.email    && { icon: "✉",  value: p.email },
    p.location && { icon: "📍", value: p.location },
    p.linkedin && { icon: "🔗", value: p.linkedin },
  ].filter(Boolean)

  const headerHtml = `
    <div style="display:flex;min-height:148px;">
      <div style="width:31%;background:${SIDEBAR_BG};padding:16px 14px 14px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;">
        ${p.photo_url
          ? photoTag(p.photo_url, `width:110px;height:110px;border-radius:4px;border:2px solid ${GOLD};object-fit:cover;margin-bottom:8px;`)
          : `<div style="width:110px;height:110px;border-radius:4px;border:2px solid ${GOLD};background:#555;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:28px;color:${WHITE_MUTED};">👤</div>`}
      </div>
      <div style="flex:1;background:${DARK};padding:20px 20px 14px;display:flex;flex-direction:column;justify-content:flex-end;">
        <h1 style="font-size:24px;font-weight:800;color:${WHITE};margin:0 0 2px;line-height:1.15;letter-spacing:0.3px;text-transform:uppercase;">${esc(p.name || "YOUR NAME")}</h1>
        ${p.title ? `<p style="font-size:12px;font-weight:600;color:${GOLD};margin:0 0 10px;text-transform:uppercase;letter-spacing:1.5px;">${esc(p.title)}</p>` : ""}
        ${contacts.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px 14px;">${
          contacts.map(c => `<span style="font-size:10px;color:${WHITE_DIM};display:flex;align-items:center;gap:3px;">${c.icon} ${esc(c.value)}</span>`).join("")
        }</div>` : ""}
      </div>
    </div>`

  const sidebarHtml = sidebarSections.map(section => {
    const value    = data[section.section_key]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${GOLD};flex-shrink:0;"></div>
          <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:${GOLD};margin:0;">${esc(section.label)}</h3>
        </div>
        <div style="height:1px;background:rgba(254,199,11,0.3);margin-bottom:8px;"></div>
        ${renderSectionContent(section.field_type, rendered, sidebarTokens)}
      </div>`
  }).join("")

  const mainHtml = mainSections.map(section => {
    const value    = data[section.section_key]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""

    const innerContent = (section.section_key === "objective")
      ? `<p style="font-size:12px;color:${MAIN_MUTED};line-height:1.65;margin:0;font-style:italic;">${esc(rendered)}</p>`
      : renderSectionContent(section.field_type, rendered, mainTokens)

    return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
          <div style="width:10px;height:10px;background:${GOLD};flex-shrink:0;border-radius:1px;"></div>
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${DARK};margin:0;">${esc(section.label)}</h2>
          <div style="flex:1;height:1.5px;background:${GOLD};opacity:0.4;"></div>
        </div>
        ${innerContent}
      </div>`
  }).join("")

  return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,system-ui,sans-serif;display:flex;flex-direction:column;width:${A4_WIDTH_PX}px;min-height:${A4_HEIGHT_PX}px;position:relative;background:#ffffff;">
      ${headerHtml}
      <div style="display:flex;flex:1;">
        <div style="width:31%;flex-shrink:0;padding:20px 14px;background:rgba(63,63,63,0.96);color:${WHITE_DIM};">
          ${sidebarHtml}
        </div>
        <div style="flex:1;padding:20px 22px;background:rgba(255,255,255,0.97);color:${MAIN_TEXT};">
          ${mainHtml}
        </div>
      </div>
    </div>`
}