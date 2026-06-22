/**
 * SectionContent.jsx
 *
 * Renders the visual output of a section's value inside a printed resume.
 * Each template passes its own style tokens so the content adapts without
 * duplicating field-type logic.
 *
 * Props:
 *   fieldType   — section.field_type string
 *   value       — parsed value from renderSectionValue()
 *   tokens      — { bodySize, textColor, mutedColor, accentColor, template }
 */

import { formatDateRange } from "./resumeHelpers"

const createTypographyScale = (bodySize) => ({
  caption: Math.max(6, bodySize - 2),
  small: Math.max(7, bodySize - 1),
  body: bodySize,
  heading: bodySize + 1,
})

export function SectionContent({ fieldType, value, tokens }) {
  const {
    bodySize = 10,
    textColor = "#1a1a1a",
    mutedColor = "#6b7280",
    accentColor = "#132F45",
    headingColor,
    template = "minimal",
    isOnDark = false,
  } = tokens

  const scale = createTypographyScale(bodySize)
  const titleColor = headingColor || (isOnDark ? "#ffffff" : accentColor)

  // ── Plain text / textarea ─────────────────────────────────────────────────
  if (fieldType === "text" || fieldType === "textarea") {
    return (
      <p style={{ fontSize: bodySize, color: textColor, margin: 0, lineHeight: 1.65, whiteSpace: "pre-line" }}>
        {value}
      </p>
    )
  }

  // ── Bulleted list ─────────────────────────────────────────────────────────
  if (fieldType === "list") {
    return (
      <ul style={{ margin: 0, paddingLeft: 14, listStyleType: "disc" }}>
        {value.map((item, i) => (
          <li key={i} style={{ fontSize: bodySize, color: textColor, marginBottom: 2, lineHeight: 1.5 }}>{item}</li>
        ))}
      </ul>
    )
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  if (fieldType === "skills") {
    if (template === "modern" && isOnDark) {
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {value.map((skill, i) => (
            <span key={i} style={{
              fontSize: scale.caption,
              background: "rgba(254,199,11,0.2)",
              color: "#FEC70B",
              borderRadius: 3,
              padding: "2px 6px",
              fontWeight: 600,
            }}>
              {skill}
            </span>
          ))}
        </div>
      )
    }
    if (template === "classic") {
      return (
        <p style={{ fontSize: bodySize, color: textColor, margin: 0, lineHeight: 1.8 }}>
          {value.join(" · ")}
        </p>
      )
    }
    // minimal / default: pill chips
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {value.map((skill, i) => (
          <span key={i} style={{
            fontSize: scale.small,
            background: "#f3f4f6",
            color: textColor,
            borderRadius: 4,
            padding: "2px 7px",
            border: "1px solid #e5e7eb",
          }}>
            {skill}
          </span>
        ))}
      </div>
    )
  }

  // ── Education ─────────────────────────────────────────────────────────────
  if (fieldType === "education") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {value.map((entry, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: scale.heading, fontWeight: 700, color: titleColor, lineHeight: 1.3 }}>
                  {entry.degree || "Degree"}
                </div>
                <div style={{ fontSize: bodySize, color: textColor, marginTop: 1 }}>{entry.school}</div>
</div>
              <div style={{ fontSize: scale.caption, color: mutedColor, textAlign: "right", flexShrink: 0 }}>
                {entry.year}
                {entry.gpa && <div style={{ marginTop: 1 }}>GPA: {entry.gpa}</div>}
              </div>
            </div>
            {entry.description && (
              <p style={{ fontSize: scale.small, color: mutedColor, margin: "3px 0 0", lineHeight: 1.55 }}>
                {entry.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ── Experience ────────────────────────────────────────────────────────────
  if (fieldType === "experience") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {value.map((entry, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: scale.heading, fontWeight: 700, color: titleColor, lineHeight: 1.3 }}>
                  {entry.role || "Role"}
                </div>
                <div style={{
                  fontSize: bodySize,
                  color: textColor,
                  marginTop: 1,
                  fontStyle: template === "classic" ? "italic" : "normal",
                }}>
                  {entry.company}
                </div>
</div>
              {(entry.from || entry.to) && (
                <div style={{ fontSize: scale.caption, color: mutedColor, flexShrink: 0, textAlign: "right" }}>
                  {formatDateRange(entry.from, entry.to)}
                </div>
              )}
            </div>
            {entry.description && (
              <p style={{ fontSize: scale.small, color: mutedColor, margin: "4px 0 0", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {entry.description}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // ── Achievements ──────────────────────────────────────────────────────────
  if (fieldType === "achievements") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {value.map((entry, i) => (
          <div key={i} style={{ display: "flex", gap: 8 }}>
            <div style={{
              marginTop: 4,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: accentColor,
              flexShrink: 0,
            }} />
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                <span style={{ fontSize: bodySize, fontWeight: 700, color: titleColor }}>{entry.title}</span>
                {entry.date && <span style={{ fontSize: scale.caption, color: mutedColor }}>{entry.date}</span>}
              </div>
              {entry.description && (
                <p style={{ fontSize: scale.small, color: mutedColor, margin: "2px 0 0", lineHeight: 1.5 }}>
                  {entry.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ── References ────────────────────────────────────────────────────────────
  if (fieldType === "references") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {value.map((entry, i) => (
          <div key={i}>
            <div style={{ fontSize: bodySize, fontWeight: 700, color: titleColor }}>{entry.name}</div>
            {entry.relationship && (
              <div style={{ fontSize: scale.small, color: mutedColor }}>{entry.relationship}</div>
            )}
            {entry.contact && (
              <div style={{ fontSize: scale.small, color: mutedColor }}>{entry.contact}</div>
            )}
            {entry.email && (
              <div style={{ fontSize: scale.small, color: mutedColor }}>{entry.email}</div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return null
}
 