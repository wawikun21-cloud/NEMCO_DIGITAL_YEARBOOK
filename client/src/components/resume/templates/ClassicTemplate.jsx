/**
 * ClassicTemplate.jsx
 *
 * Design direction: Dignified editorial.
 * Centered name in large Georgia serif. Thin double-rule below header.
 * Section headings: small-caps text with a full-width single-rule underline —
 * traditional resume format that hiring managers instantly recognise.
 *
 * Signature element: double-rule (thick + thin) below the name block, echoing
 * formal letterhead conventions without feeling stodgy.
 *
 * Accent: #1C1C1C — essentially black. The design gets its life from
 * typographic contrast (serif weight, caps, spacing) not colour.
 * Contact line uses a mid-dot separator, centered.
 */

import { SectionContent } from "../shared/SectionContent"
import { renderSectionValue } from "../shared/resumeHelpers"

const DARK = "#1C1C1C"
const BODY = "#2D2D2D"
const MUTED = "#6B6B6B"
const RULE_HEAVY = "#1C1C1C"
const RULE_LIGHT = "#D4D4D4"

const tokens = {
  bodySize: 12,
  textColor: BODY,
  mutedColor: MUTED,
  accentColor: DARK,
  template: "classic",
}

// ── Header ────────────────────────────────────────────────────────────────────
function ClassicHeader({ personal }) {
  const contacts = [
    personal.email,
    personal.phone,
    personal.location,
    personal.linkedin,
  ].filter(Boolean)

  return (
    <header style={{ textAlign: "center", marginBottom: 24 }}>
      {personal.photo_url && (
        <img
          src={personal.photo_url}
          alt=""
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            width: 100,
            height: 100,
            margin: "0 auto 12px",
            display: "block",
          }}
        />
      )}
      <h1 style={{
        fontSize: 30,
        fontWeight: 700,
        color: DARK,
        margin: "0 0 5px",
        letterSpacing: "1px",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}>
        {personal.name || "Your Name"}
      </h1>

      {personal.title && (
        <p style={{
          fontSize: 11,
          color: MUTED,
          margin: "0 0 10px",
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}>
          {personal.title}
        </p>
      )}

      {/* Signature double-rule */}
      <div style={{ margin: "0 auto 10px", maxWidth: "70%" }}>
        <div style={{ height: 2, background: RULE_HEAVY, marginBottom: 2 }} />
        <div style={{ height: 1, background: RULE_LIGHT }} />
      </div>

      {contacts.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0 6px" }}>
{contacts.map((item, i) => (
             <span key={i} style={{ fontSize: 10, color: MUTED, fontFamily: "Georgia, 'Times New Roman', serif" }}>
               {i > 0 && <span style={{ marginRight: 6, color: RULE_LIGHT }}>·</span>}
               {item}
             </span>
           ))}
        </div>
      )}
    </header>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function ClassicSection({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ borderBottom: `1.5px solid ${RULE_HEAVY}`, marginBottom: 7, paddingBottom: 2 }}>
<h2 style={{
           fontSize: 14,
           fontWeight: 700,
           fontVariant: "small-caps",
           letterSpacing: "1.5px",
           color: DARK,
           margin: 0,
           fontFamily: "Georgia, 'Times New Roman', serif",
         }}>
           {label}
         </h2>
      </div>
      {children}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export function ClassicTemplate({ data, sections, personal }) {
  return (
    <div style={{
      fontFamily: "Georgia, 'Times New Roman', serif",
      color: BODY,
      lineHeight: 1.6,
      padding: "48px 56px",
      boxSizing: "border-box",
    }}>
      <ClassicHeader personal={personal} />

      {sections.map((section) => {
        if (section.section_key === "personal") return null
        const value = data[section.section_key]
        const rendered = renderSectionValue(section, value)
        if (!rendered) return null

        return (
          <ClassicSection key={section.section_key} label={section.label}>
            <SectionContent
              fieldType={section.field_type}
              value={rendered}
              tokens={tokens}
            />
          </ClassicSection>
        )
      })}
    </div>
  )
}
