/**
 * MinimalTemplate.jsx
 *
 * Design direction: Brutalist-soft minimal.
 * Single column. Generous whitespace. Thin rule dividers.
 * Name in large weight-300 tracking type — the negative space IS the design.
 * Accent: slate blue #2C4A6E — quiet but distinct from the navy of the old "simple".
 * Body: Inter / system-ui. Section headings: tiny caps with a left-edge rule, not underline.
 *
 * The signature element: a thin left-border rule on every section heading,
 * creating a vertical rhythm thread that pulls the eye down the page.
 */

import { SectionContent } from "../shared/SectionContent"
import { renderSectionValue } from "../shared/resumeHelpers"

const ACCENT = "#2C4A6E"
const MUTED = "#718096"
const TEXT = "#1a202c"
const RULE = "#CBD5E0"

const tokens = {
  bodySize: 11,
  textColor: TEXT,
  mutedColor: MUTED,
  accentColor: ACCENT,
  template: "minimal",
}

// ── Header ────────────────────────────────────────────────────────────────────
function MinimalHeader({ personal }) {
  const contacts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
    personal.website,
  ].filter(Boolean)

  return (
    <header style={{ marginBottom: 28 }}>
      <h1 style={{
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: "-0.5px",
        color: TEXT,
        margin: "0 0 4px",
        lineHeight: 1.1,
        display: "flex",
        alignItems: "center",
      }}>
        {personal.photo_url && (
          <img
            src={personal.photo_url}
            alt=""
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              width: 72,
              height: 72,
              marginRight: 16,
              flexShrink: 0,
            }}
          />
        )}
        {personal.name || "Your Name"}
      </h1>

      {personal.title && (
        <p style={{ fontSize: 11, color: ACCENT, fontWeight: 500, margin: "0 0 10px", letterSpacing: "0.3px" }}>
          {personal.title}
        </p>
      )}

      {contacts.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
          {contacts.map((item, i) => (
            <span key={i} style={{ fontSize: 9, color: MUTED }}>
              {i > 0 && <span style={{ marginRight: 14, color: RULE }}>·</span>}
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Full-width rule after header */}
      <div style={{ height: 1, background: RULE, marginTop: 16 }} />
    </header>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function MinimalSection({ label, children }) {
  return (
    <div style={{ marginBottom: 22, display: "flex", gap: 0 }}>
      {/* Left-border accent — the signature vertical thread */}
      <div style={{ width: 2, background: ACCENT, borderRadius: 1, flexShrink: 0, marginRight: 14, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <h2 style={{
          fontSize: 14,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "1.4px",
          color: ACCENT,
          margin: "0 0 8px",
        }}>
          {label}
        </h2>
        {children}
      </div>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export function MinimalTemplate({ data, sections, personal }) {
  return (
    <div style={{
      fontFamily: "'Inter', 'Helvetica Neue', Arial, system-ui, sans-serif",
      color: TEXT,
      lineHeight: 1.55,
      padding: "44px 52px",
      boxSizing: "border-box",
    }}>
      <MinimalHeader personal={personal} />

      {sections.map((section) => {
        if (section.section_key === "personal") return null
        const value = data[section.section_key]
        const rendered = renderSectionValue(section, value)
        if (!rendered) return null

        return (
          <MinimalSection key={section.section_key} label={section.label}>
            <SectionContent
              fieldType={section.field_type}
              value={rendered}
              tokens={tokens}
            />
          </MinimalSection>
        )
      })}
    </div>
  )
}
