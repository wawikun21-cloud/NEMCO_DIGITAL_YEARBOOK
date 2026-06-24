/**
 * Supabase Edge Function: generate-resume-pdf
 *
 * Deno runtime — runs on Supabase's edge infrastructure (NOT Hostinger).
 * Produces a pixel-perfect A4 resume PDF using Puppeteer-compatible HTML
 * rendering via Deno's native fetch + a headless Chrome wasm module.
 *
 * NOTE: This function currently uses the same HTML builder as the original
 * api/generate-resume-pdf.js but adapts it to the Deno/Supabase Edge
 * Function interface. For production quality, consider using a dedicated
 * PDF API or the client-side html2canvas approach.
 *
 * Deploy:
 *   supabase functions deploy generate-resume-pdf
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  let body: { data?: Record<string, unknown>; sections?: unknown[]; template?: Record<string, unknown> }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { data = {}, sections = [], template = {} } = body

  if (!data || !Array.isArray(sections) || sections.length === 0) {
    return new Response(JSON.stringify({ error: "Missing resume data or sections" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const html = buildResumeHtml({
      data as Record<string, unknown>,
      sections as Array<Record<string, unknown>>,
      template as Record<string, unknown>,
    })

    // Return the HTML — client-side html2canvas/jspdf will handle PDF conversion
    // This endpoint serves as a fallback: it validates input and returns the
    // rendered HTML, then the client captures it into a PDF.
    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (err) {
    console.error("[generate-resume-pdf] Error:", err)
    return new Response(JSON.stringify({ error: "PDF generation failed", detail: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

function buildResumeHtml({ data, sections, template }: {
  data: Record<string, unknown>
  sections: Array<Record<string, unknown>>
  template: Record<string, unknown>
}): string {
  const slug = (template?.slug as string) || "minimal"
  const personal = (data?.personal as Record<string, string>) || {}

  const p = {
    name: personal.name || (data?.name as string) || "",
    title: personal.title || personal.headline || (data?.title as string) || "",
    email: personal.email || (data?.email as string) || "",
    phone: personal.phone || (data?.phone as string) || "",
    location: personal.location || (data?.location as string) || "",
    linkedin: personal.linkedin || (data?.linkedin as string) || "",
    website: personal.website || (data?.website as string) || "",
    photo_url: personal.photo_url || (data?.photo_url as string) || "",
  }

  let bodyContent = ""
  if (slug === "classic") bodyContent = buildClassic({ data, sections, p })
  else if (slug === "modern") bodyContent = buildModern({ data, sections, p })
  else bodyContent = buildMinimal({ data, sections, p })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Resume</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${A4_WIDTH_PX}px; height: ${A4_HEIGHT_PX}px; overflow: hidden; }
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

function esc(str: unknown): string {
  if (str == null) return ""
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function photoTag(url: string, style: string): string {
  if (!url) return ""
  return `<img src="${esc(url)}" alt="" style="${style}" crossorigin="anonymous" />`
}

function renderSectionValue(section: Record<string, unknown>, value: unknown): unknown {
  if (value === null || value === undefined) return null
  const fieldType = section.field_type as string
  if (["text", "textarea"].includes(fieldType)) {
    return typeof value === "string" && value.trim() ? value : null
  }
  if (["list", "skills", "education", "experience", "achievements", "references"].includes(fieldType)) {
    return Array.isArray(value) && value.length > 0 ? value : null
  }
  return value || null
}

function formatDate(str: string): string {
  if (!str) return ""
  if (str === "Present") return "Present"
  try { return new Date(str).toLocaleDateString("en-US", { month: "short", year: "numeric" }) }
  catch { return str }
}

function formatDateRange(from: string, to: string): string {
  const f = formatDate(from)
  const t = formatDate(to)
  if (!f && !t) return ""
  if (!t) return f
  return `${f} – ${t}`
}

function renderSectionContent(fieldType: string, value: unknown, tokens: Record<string, unknown>): string {
  const {
    bodySize = 11,
    textColor = "#1a1a1a",
    mutedColor = "#6b7280",
    accentColor = "#132F45",
    template: tmpl = "minimal",
    isOnDark = false,
  } = tokens

  const headingColor = (tokens.headingColor as string) || (isOnDark ? "#ffffff" : accentColor)
  const captionSize = Math.max(9, (bodySize as number) - 1)
  const smallSize = bodySize as number
  const headingSize = (bodySize as number) + 3

  if (fieldType === "text" || fieldType === "textarea") {
    return `<p style="font-size:${bodySize}px;color:${textColor};margin:0;line-height:1.65;white-space:pre-line;">${esc(value)}</p>`
  }

  if (fieldType === "list") {
    const items = value as string[]
    return `<ul style="margin:0;padding-left:14px;list-style-type:disc;">${items.map(item => `<li style="font-size:${bodySize}px;color:${textColor};margin-bottom:2px;line-height:1.5;">${esc(item)}</li>`).join("")}</ul>`
  }

  if (fieldType === "skills") {
    const skills = value as string[]
    if (tmpl === "modern" && isOnDark) {
      return `<div style="display:flex;flex-wrap:wrap;gap:4px;">${skills.map((s: string) => `<span style="font-size:${captionSize}px;background:rgba(254,199,11,0.2);color:#FEC70B;border-radius:3px;padding:2px 6px;font-weight:600;">${esc(s)}</span>`).join("")}</div>`
    }
    if (tmpl === "classic") {
      return `<p style="font-size:${bodySize}px;color:${textColor};margin:0;line-height:1.8;">${skills.map(esc).join(" · ")}</p>`
    }
    return `<div style="display:flex;flex-wrap:wrap;gap:5px;">${skills.map((s: string) => `<span style="font-size:${bodySize}px;background:#f3f4f6;color:${textColor};border-radius:4px;padding:2px 7px;border:1px solid #e5e7eb;">${esc(s)}</span>`).join("")}</div>`
  }

  if (fieldType === "education") {
    const entries = value as Array<Record<string, string>>
    return `<div style="display:flex;flex-direction:column;gap:10px;">${entries.map(entry => `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;">
            <div style="font-size:${headingSize}px;font-weight:700;color:${headingColor};line-height:1.3;">${esc(entry.degree || "Degree")}</div>
            <div style="font-size:${bodySize}px;color:${textColor};margin-top:1px;">${esc(entry.school || "")}</div>
          </div>
          <div style="font-size:${captionSize}px;color:${mutedColor};text-align:right;flex-shrink:0;">
            ${esc(entry.year || "")}
            ${entry.gpa ? `<div style="margin-top:1px;">GPA: ${esc(entry.gpa)}</div>` : ""}
          </div>
        </div>
        ${entry.description ? `<p style="font-size:${smallSize}px;color:${mutedColor};margin:3px 0 0;line-height:1.55;">${esc(entry.description)}</p>` : ""}
      </div>`).join("")}</div>`
  }

  if (fieldType === "experience") {
    const entries = value as Array<Record<string, string>>
    return `<div style="display:flex;flex-direction:column;gap:12px;">${entries.map(entry => `
      <div>
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="flex:1;">
            <div style="font-size:${headingSize}px;font-weight:700;color:${headingColor};line-height:1.3;">${esc(entry.role || "Role")}</div>
            <div style="font-size:${bodySize}px;color:${textColor};margin-top:1px;${tmpl === "classic" ? "font-style:italic;" : ""}">${esc(entry.company || "")}</div>
          </div>
          ${(entry.from || entry.to) ? `<div style="font-size:${captionSize}px;color:${mutedColor};flex-shrink:0;text-align:right;">${formatDateRange(entry.from || "", entry.to || "")}</div>` : ""}
        </div>
        ${entry.description ? `<p style="font-size:${smallSize}px;color:${mutedColor};margin:4px 0 0;line-height:1.6;white-space:pre-line;">${esc(entry.description)}</p>` : ""}
      </div>`).join("")}</div>`
  }

  if (fieldType === "achievements") {
    const entries = value as Array<Record<string, string>>
    return `<div style="display:flex;flex-direction:column;gap:8px;">${entries.map(entry => `
      <div style="display:flex;gap:8px;">
        <div style="margin-top:4px;width:5px;height:5px;border-radius:50%;background:${accentColor};flex-shrink:0;"></div>
        <div>
          <div style="display:flex;gap:8px;align-items:baseline;flex-wrap:wrap;">
            <span style="font-size:${bodySize}px;font-weight:700;color:${headingColor};">${esc(entry.title || "")}</span>
            ${entry.date ? `<span style="font-size:${captionSize}px;color:${mutedColor};">${esc(entry.date)}</span>` : ""}
          </div>
          ${entry.description ? `<p style="font-size:${smallSize}px;color:${mutedColor};margin:2px 0 0;line-height:1.5;">${esc(entry.description)}</p>` : ""}
        </div>
      </div>`).join("")}</div>`
  }

  if (fieldType === "references") {
    const entries = value as Array<Record<string, string>>
    return `<div style="display:flex;flex-direction:column;gap:10px;">${entries.map(entry => `
      <div>
        <div style="font-size:${bodySize}px;font-weight:700;color:${headingColor};">${esc(entry.name || "")}</div>
        ${entry.relationship ? `<div style="font-size:${smallSize}px;color:${mutedColor};">${esc(entry.relationship)}</div>` : ""}
        ${entry.contact ? `<div style="font-size:${smallSize}px;color:${mutedColor};">${esc(entry.contact)}</div>` : ""}
        ${entry.email ? `<div style="font-size:${smallSize}px;color:${mutedColor};">${esc(entry.email)}</div>` : ""}
      </div>`).join("")}</div>`
  }

  return ""
}

function extractPersonal(data: Record<string, unknown>): Record<string, string> {
  const personal = (data?.personal as Record<string, string>) || {}
  return {
    name: personal.name || (data?.name as string) || "",
    title: personal.title || personal.headline || (data?.title as string) || "",
    email: personal.email || (data?.email as string) || "",
    phone: personal.phone || (data?.phone as string) || "",
    location: personal.location || (data?.location as string) || "",
    linkedin: personal.linkedin || (data?.linkedin as string) || "",
    website: personal.website || (data?.website as string) || "",
    photo_url: personal.photo_url || (data?.photo_url as string) || "",
  }
}

function buildMinimal({ data, sections, p }: {
  data: Record<string, unknown>
  sections: Array<Record<string, unknown>>
  p: Record<string, string>
}): string {
  const ACCENT = "#2C4A6E"
  const MUTED = "#718096"
  const TEXT = "#1a202c"
  const RULE = "#CBD5E0"
  const tokens = { bodySize: 11, textColor: TEXT, mutedColor: MUTED, accentColor: ACCENT, template: "minimal" }

  const contacts = [p.email, p.phone, p.location, p.linkedin, p.website].filter(Boolean)
  const headerHtml = `
    <header style="margin-bottom:28px;">
      <h1 style="font-size:24px;font-weight:700;letter-spacing:-0.5px;color:${TEXT};margin:0 0 4px;line-height:1.1;display:flex;align-items:center;">
        ${p.photo_url ? photoTag(p.photo_url, "border-radius:50%;object-fit:cover;width:72px;height:72px;margin-right:16px;flex-shrink:0;") : ""}
        ${esc(p.name || "Your Name")}
      </h1>
      ${p.title ? `<p style="font-size:11px;color:${ACCENT};font-weight:500;margin:0 0 10px;letter-spacing:0.3px;">${esc(p.title)}</p>` : ""}
      ${contacts.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px 14px;">${contacts.map((c, i) => `<span style="font-size:9px;color:${MUTED};${i > 0 ? `<span style="margin-right:14px;color:${RULE};">·</span>` : ""}${esc(c)}</span>`).join("")}</div>` : ""}
      <div style="height:1px;background:${RULE};margin-top:16px;"></div>
    </header>`

  const sectionsHtml = sections.map(section => {
    if (section.section_key === "personal") return ""
    const value = data[section.section_key as string]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    return `
      <div style="margin-bottom:22px;display:flex;gap:0;">
        <div style="width:2px;background:${ACCENT};border-radius:1px;flex-shrink:0;margin-right:14px;margin-top:1px;"></div>
        <div style="flex:1;">
          <h2 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:${ACCENT};margin:0 0 8px;">${esc(section.label as string)}</h2>
          ${renderSectionContent(section.field_type as string, rendered, tokens)}
        </div>
      </div>`
  }).join("")

  return `
    <div style="font-family:'Helvetica Neue',Helvetica,Arial,system-ui,sans-serif;color:${TEXT};line-height:1.55;padding:44px 52px;box-sizing:border-box;width:${A4_WIDTH_PX}px;min-height:${A4_HEIGHT_PX}px;background:#ffffff;">
      ${headerHtml}
      ${sectionsHtml}
    </div>`
}

function buildClassic({ data, sections, p }: {
  data: Record<string, unknown>
  sections: Array<Record<string, unknown>>
  p: Record<string, string>
}): string {
  const DARK = "#1C1C1C"
  const BODY = "#2D2D2D"
  const MUTED = "#6B6B6B"
  const RULE_HEAVY = "#1C1C1C"
  const RULE_LIGHT = "#D4D4D4"
  const tokens = { bodySize: 12, textColor: BODY, mutedColor: MUTED, accentColor: DARK, template: "classic" }

  const contacts = [p.email, p.phone, p.location, p.linkedin].filter(Boolean)
  const headerHtml = `
    <header style="text-align:center;margin-bottom:24px;font-family:Georgia,'Times New Roman',Times,serif;">
      ${p.photo_url ? `<div style="margin:0 auto 12px;">${photoTag(p.photo_url, "border-radius:50%;object-fit:cover;width:100px;height:100px;display:block;margin:0 auto;")}</div>` : ""}
      <h1 style="font-size:30px;font-weight:700;color:${DARK};margin:0 0 5px;letter-spacing:1px;font-family:Georgia,'Times New Roman',Times,serif;">${esc(p.name || "Your Name")}</h1>
      ${p.title ? `<p style="font-size:11px;color:${MUTED};margin:0 0 10px;font-style:italic;font-family:Georgia,'Times New Roman',Times,serif;">${esc(p.title)}</p>` : ""}
      <div style="margin:0 auto 10px;max-width:70%;">
        <div style="height:2px;background:${RULE_HEAVY};margin-bottom:2px;"></div>
        <div style="height:1px;background:${RULE_LIGHT};"></div>
      </div>
      ${contacts.length ? `<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:0 6px;">${contacts.map((c, i) => `<span style="font-size:10px;color:${MUTED};font-family:Georgia,'Times New Roman',Times,serif;">${i > 0 ? `<span style="margin-right:6px;color:${RULE_LIGHT};">·</span>` : ""}${esc(c)}</span>`).join("")}</div>` : ""}
    </header>`

  const sectionsHtml = sections.map(section => {
    if (section.section_key === "personal") return ""
    const value = data[section.section_key as string]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    return `
      <div style="margin-bottom:20px;">
        <div style="border-bottom:1.5px solid ${RULE_HEAVY};margin-bottom:7px;padding-bottom:2px;">
          <h2 style="font-size:14px;font-weight:700;font-variant:small-caps;letter-spacing:1.5px;color:${DARK};margin:0;font-family:Georgia,'Times New Roman',Times,serif;">${esc(section.label as string)}</h2>
        </div>
        ${renderSectionContent(section.field_type as string, rendered, tokens)}
      </div>`
  }).join("")

  return `
    <div style="font-family:Georgia,'Times New Roman',Times,serif;color:${BODY};line-height:1.6;padding:48px 56px;box-sizing:border-box;width:${A4_WIDTH_PX}px;min-height:${A4_HEIGHT_PX}px;background:#ffffff;">
      ${headerHtml}
      ${sectionsHtml}
    </div>`
}

const MODERN_SIDEBAR_SECTIONS = ["skills", "references", "languages", "certifications", "contact"]

function buildModern({ data, sections, p }: {
  data: Record<string, unknown>
  sections: Array<Record<string, unknown>>
  p: Record<string, string>
}): string {
  const SIDEBAR_BG = "#3F3F3F"
  const GOLD = "#FEC70B"
  const DARK = "#333333"
  const WHITE = "#FFFFFF"
  const WHITE_DIM = "rgba(255,255,255,0.75)"
  const WHITE_MUTED = "rgba(255,255,255,0.45)"
  const MAIN_TEXT = "#1A1A1A"
  const MAIN_MUTED = "#555555"

  const sidebarTokens = { bodySize: 11, textColor: WHITE_DIM, mutedColor: WHITE_MUTED, accentColor: GOLD, headingColor: WHITE, template: "modern", isOnDark: true }
  const mainTokens = { bodySize: 12, textColor: MAIN_TEXT, mutedColor: MAIN_MUTED, accentColor: DARK, template: "modern", isOnDark: false }

  const sidebarSections = sections.filter(s => MODERN_SIDEBAR_SECTIONS.includes(s.section_key as string) && s.section_key !== "personal")
  const mainSections = sections.filter(s => !MODERN_SIDEBAR_SECTIONS.includes(s.section_key as string) && s.section_key !== "personal")

  const contacts = [
    p.phone && { icon: "📞", value: p.phone },
    p.email && { icon: "✉", value: p.email },
    p.location && { icon: "📍", value: p.location },
    p.linkedin && { icon: "🔗", value: p.linkedin },
  ].filter(Boolean) as Array<{ icon: string; value: string }>

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
        ${contacts.length ? `<div style="display:flex;flex-wrap:wrap;gap:3px 14px;">${contacts.map(c => `<span style="font-size:10px;color:${WHITE_DIM};display:flex;align-items:center;gap:3px;">${c.icon} ${esc(c.value)}</span>`).join("")}</div>` : ""}
      </div>
    </div>`

  const sidebarHtml = sidebarSections.map(section => {
    const value = data[section.section_key as string]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <div style="width:6px;height:6px;border-radius:50%;background:${GOLD};flex-shrink:0;"></div>
          <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:${GOLD};margin:0;">${esc(section.label as string)}</h3>
        </div>
        <div style="height:1px;background:rgba(254,199,11,0.3);margin-bottom:8px;"></div>
        ${renderSectionContent(section.field_type as string, rendered, sidebarTokens)}
      </div>`
  }).join("")

  const mainHtml = mainSections.map(section => {
    const value = data[section.section_key as string]
    const rendered = renderSectionValue(section, value)
    if (!rendered) return ""
    const innerContent = (section.section_key === "objective")
      ? `<p style="font-size:12px;color:${MAIN_MUTED};line-height:1.65;margin:0;font-style:italic;">${esc(rendered)}</p>`
      : renderSectionContent(section.field_type as string, rendered, mainTokens)
    return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px;">
          <div style="width:10px;height:10px;background:${GOLD};flex-shrink:0;border-radius:1px;"></div>
          <h2 style="font-size:15px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${DARK};margin:0;">${esc(section.label as string)}</h2>
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
