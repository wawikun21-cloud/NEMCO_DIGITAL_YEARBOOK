/**
 * TemplateThumbnail.jsx
 *
 * Accurate miniature preview for each resume template.
 * Each slug has its own sub-component so the thumbnail genuinely
 * reflects the template's layout and colour palette.
 *
 * Props:
 *   slug         — "minimal" | "classic" | "modern" | "simple"
 *   name         — display name (used as alt text fallback)
 *   thumbnailUrl — optional remote image; takes priority
 */

// ── Minimal thumbnail ─────────────────────────────────────────────────────────
function MinimalThumbnail() {
  const ACCENT = "#2C4A6E"
  const GRAY = "#d1d5db"
  const LIGHT = "#e5e7eb"

  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff", padding: "7px 9px", boxSizing: "border-box", fontFamily: "sans-serif" }}>
      {/* Name — weight-300 large */}
      <div style={{ height: "5px", width: "55%", background: "#1a202c", borderRadius: 1, marginBottom: "3px", opacity: 0.85 }} />
      <div style={{ height: "2px", width: "35%", background: ACCENT, borderRadius: 1, marginBottom: "5px", opacity: 0.9 }} />
      {/* Contact row */}
      <div style={{ height: "1.5px", width: "70%", background: LIGHT, borderRadius: 1, marginBottom: "6px" }} />

      {/* Sections — each with left-border accent */}
      {[["40%", "80%", "65%"], ["35%", "90%", "70%"], ["30%", "50%"]].map((widths, si) => (
        <div key={si} style={{ display: "flex", gap: "3px", marginBottom: "5px" }}>
          <div style={{ width: "2px", background: ACCENT, borderRadius: 1, flexShrink: 0, minHeight: "10px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "2px", width: "28%", background: ACCENT, borderRadius: 1, marginBottom: "2.5px", opacity: 0.7 }} />
            {widths.map((w, i) => (
              <div key={i} style={{ height: "1.5px", width: w, background: GRAY, borderRadius: 1, marginBottom: "1.5px" }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Classic thumbnail ─────────────────────────────────────────────────────────
function ClassicThumbnail() {
  const DARK = "#1C1C1C"
  const GRAY = "#d1d5db"
  const LIGHT = "#e5e7eb"
  const MUTED = "#9ca3af"

  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff", padding: "7px 9px", boxSizing: "border-box", fontFamily: "Georgia, serif" }}>
      {/* Centered name block */}
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <div style={{ height: "5px", width: "50%", background: DARK, borderRadius: 0, margin: "0 auto 2px", opacity: 0.9 }} />
        <div style={{ height: "2px", width: "35%", background: MUTED, borderRadius: 0, margin: "0 auto 3px" }} />
        {/* Double rule signature */}
        <div style={{ width: "55%", margin: "0 auto" }}>
          <div style={{ height: "1.5px", background: DARK, marginBottom: "1px" }} />
          <div style={{ height: "0.5px", background: LIGHT }} />
        </div>
        <div style={{ height: "1.5px", width: "60%", background: MUTED, borderRadius: 0, margin: "2px auto 0" }} />
      </div>

      {/* Sections with full-width underline headings */}
      {[["80%", "65%", "70%"], ["75%", "55%"], ["40%", "50%", "45%"]].map((widths, si) => (
        <div key={si} style={{ marginBottom: "5px" }}>
          <div style={{ borderBottom: `1px solid ${DARK}`, marginBottom: "2px", paddingBottom: "1px" }}>
            <div style={{ height: "2px", width: "30%", background: DARK, borderRadius: 0 }} />
          </div>
          {widths.map((w, i) => (
            <div key={i} style={{ height: "1.5px", width: w, background: GRAY, borderRadius: 0, marginBottom: "1.5px" }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Modern thumbnail ──────────────────────────────────────────────────────────
function ModernThumbnail() {
  const TEAL = "#0F3D3E"
  const ACCENT = "#4ECDC4"
  const GRAY = "#d1d5db"
  const WHITE_DIM = "rgba(255,255,255,0.6)"
  const WHITE_MUTED = "rgba(255,255,255,0.3)"

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#ffffff", fontFamily: "sans-serif" }}>
      {/* Header band */}
      <div style={{ background: TEAL, display: "flex", padding: "5px", gap: "3px", flexShrink: 0 }}>
        <div style={{ width: "31%", borderRight: "0.5px solid rgba(255,255,255,0.1)", paddingRight: "3px" }}>
          <div style={{ height: "3px", width: "85%", background: "#fff", borderRadius: 1, marginBottom: "1.5px", opacity: 0.9 }} />
          <div style={{ height: "2px", width: "70%", background: WHITE_DIM, borderRadius: 1 }} />
        </div>
        <div style={{ flex: 1, paddingLeft: "3px" }}>
          <div style={{ height: "2px", width: "55%", background: ACCENT, borderRadius: 1, marginBottom: "2px" }} />
          <div style={{ height: "1.5px", width: "80%", background: WHITE_MUTED, borderRadius: 1, marginBottom: "1px" }} />
          <div style={{ height: "1.5px", width: "65%", background: WHITE_MUTED, borderRadius: 1 }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{ width: "31%", background: TEAL, padding: "4px 4px", flexShrink: 0 }}>
          {[["70%", "85%", "60%"], ["50%", "75%"]].map((widths, si) => (
            <div key={si} style={{ marginBottom: "5px" }}>
              <div style={{ height: "1.5px", width: "55%", background: ACCENT, borderRadius: 1, marginBottom: "2.5px", opacity: 0.8 }} />
              {widths.map((w, i) => (
                <div key={i} style={{ height: "1px", width: w, background: WHITE_MUTED, borderRadius: 1, marginBottom: "1.5px" }} />
              ))}
            </div>
          ))}
        </div>

        {/* Main */}
        <div style={{ flex: 1, padding: "4px 5px" }}>
          {[["80%", "60%", "75%"], ["75%", "55%", "70%"]].map((widths, si) => (
            <div key={si} style={{ marginBottom: "5px" }}>
              {/* Dot + rule heading */}
              <div style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "2.5px" }}>
                <div style={{ width: "3px", height: "3px", borderRadius: "50%", background: ACCENT, flexShrink: 0 }} />
                <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
                <div style={{ height: "1.5px", width: "25%", background: "#1a202c", borderRadius: 1, opacity: 0.6 }} />
                <div style={{ flex: 1, height: "0.5px", background: "#e5e7eb" }} />
              </div>
              {widths.map((w, i) => (
                <div key={i} style={{ height: "1.5px", width: w, background: GRAY, borderRadius: 1, marginBottom: "1.5px" }} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Fallback ──────────────────────────────────────────────────────────────────
function FallbackThumbnail({ name }) {
  return (
    <div style={{
      width: "100%", height: "100%", background: "#f8fafc",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "sans-serif", fontSize: "8px", color: "#94a3b8",
    }}>
      {name || "Template"}
    </div>
  )
}

// ── Public export ─────────────────────────────────────────────────────────────
const THUMBNAIL_MAP = {
  minimal: MinimalThumbnail,
  simple: MinimalThumbnail,   // legacy alias
  classic: ClassicThumbnail,
  modern: ModernThumbnail,
}

export function TemplateThumbnail({ slug, name, thumbnailUrl }) {
  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={name} className="w-full h-full object-cover object-top" />
  }

  const Thumb = THUMBNAIL_MAP[slug] || FallbackThumbnail
  return (
    <div className="w-full h-full">
      <Thumb name={name} />
    </div>
  )
}
