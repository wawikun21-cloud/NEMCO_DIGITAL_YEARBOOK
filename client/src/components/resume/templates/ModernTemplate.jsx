/**
 * ModernTemplate.jsx
 *
 * Design direction: Dark geometric two-column layout.
 * Uses resume-bg-modern.svg as a background layer — dark gray left sidebar,
 * yellow/gold geometric shapes top-left, dark diamond shapes top-right.
 * Colors pulled directly from the SVG: #3F3F3F sidebar, #FEC70B gold, #333333 dark.
 *
 * Layout matches the screenshot reference:
 *   - Circular photo top-left of sidebar
 *   - Name + title in sidebar header zone
 *   - Contact, Skills, Languages in sidebar with icons
 *   - Work Experience, Education in main column
 */

import { SectionContent } from "../shared/SectionContent"
import { renderSectionValue, partitionSections } from "../shared/resumeHelpers"
import { Phone, Mail, MapPin, Link2 } from "lucide-react"

// ── Colors extracted from the SVG ────────────────────────────────────────────
const SIDEBAR_BG  = "#3F3F3F"   // dark gray column from SVG
const GOLD        = "#FEC70B"   // yellow accent from SVG
const DARK        = "#333333"   // darker shapes from SVG
const WHITE       = "#FFFFFF"
const WHITE_DIM   = "rgba(255,255,255,0.75)"
const WHITE_MUTED = "rgba(255,255,255,0.45)"
const MAIN_TEXT   = "#1A1A1A"
const MAIN_MUTED  = "#555555"
const SIDEBAR_SECTIONS = ["skills", "references", "languages", "certifications", "contact"]

const sidebarTokens = {
  bodySize: 11,
  textColor: WHITE_DIM,
  mutedColor: WHITE_MUTED,
  accentColor: GOLD,
  headingColor: WHITE,
  template: "modern",
  isOnDark: true,
}

const mainTokens = {
  bodySize: 12,
  textColor: MAIN_TEXT,
  mutedColor: MAIN_MUTED,
  accentColor: DARK,
  template: "modern",
  isOnDark: false,
}

// ── Header — photo + name/title split across sidebar/main ────────────────────
function ModernHeader({ personal }) {
  const contacts = [
    personal.phone && { Icon: Phone, value: personal.phone },
    personal.email && { Icon: Mail, value: personal.email },
    personal.location && { Icon: MapPin, value: personal.location },
    personal.linkedin && { Icon: Link2, value: personal.linkedin },
  ].filter(Boolean)

  return (
    <div style={{ display: "flex", minHeight: 148, position: "relative" }}>
      {/* Sidebar header zone — dark gray from SVG background */}
      <div style={{
        width: "31%",
        background: SIDEBAR_BG,
        padding: "16px 14px 14px",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Photo */}
        {personal.photo_url ? (
          <img
            src={personal.photo_url}
            alt=""
            style={{
              width: 110,
              height: 110,
              borderRadius: 4,
              border: `2px solid ${GOLD}`,
              objectFit: "cover",
              marginBottom: 8,
              background: "#555",
            }}
          />
        ) : (
          <div style={{
            width: 110,
            height: 110,
            borderRadius: 4,
            border: `2px solid ${GOLD}`,
            background: "#555",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            color: WHITE_MUTED,
          }}>
            👤
          </div>
        )}
      </div>

      {/* Main header zone — name, title, contacts */}
      <div style={{
        flex: 1,
        background: DARK,
        padding: "20px 20px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        position: "relative",
        zIndex: 1,
      }}>
        <h1 style={{
          fontSize: 24,
          fontWeight: 800,
          color: WHITE,
          margin: "0 0 2px",
          lineHeight: 1.15,
          letterSpacing: "0.3px",
          textTransform: "uppercase",
        }}>
          {personal.name || "YOUR NAME"}
        </h1>

{personal.title && (
           <p style={{
             fontSize: 12,
             fontWeight: 600,
             color: GOLD,
             margin: "0 0 10px",
             textTransform: "uppercase",
             letterSpacing: "1.5px",
           }}>
             {personal.title}
           </p>
         )}

        {/* Contact row */}
        {contacts.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "3px 14px" }}>
{contacts.map((item, i) => (
               <span key={i} style={{
                 fontSize: 10,
                 color: WHITE_DIM,
                 display: "flex",
                 alignItems: "center",
                 gap: 3,
               }}>
                 <item.Icon size={12} />
                 {item.value}
               </span>
             ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sidebar section ───────────────────────────────────────────────────────────
function SidebarSection({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
      }}>
        {/* Gold accent dot */}
        <div style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: GOLD,
          flexShrink: 0,
        }} />
<h3 style={{
           fontSize: 14,
           fontWeight: 700,
           textTransform: "uppercase",
           letterSpacing: "1.4px",
           color: GOLD,
           margin: 0,
         }}>
           {label}
         </h3>
      </div>
      {/* Gold underline */}
      <div style={{ height: 1, background: `rgba(254,199,11,0.3)`, marginBottom: 8 }} />
      {children}
    </div>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────
function MainSection({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        marginBottom: 7,
      }}>
        {/* Gold square accent */}
        <div style={{
          width: 10,
          height: 10,
          background: GOLD,
          flexShrink: 0,
          borderRadius: 1,
        }} />
<h2 style={{
           fontSize: 15,
           fontWeight: 700,
           textTransform: "uppercase",
           letterSpacing: "1px",
           color: DARK,
           margin: 0,
         }}>
           {label}
         </h2>
        <div style={{ flex: 1, height: 1.5, background: GOLD, opacity: 0.4 }} />
      </div>
      {children}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export function ModernTemplate({ data, sections, personal }) {
  const { sidebar, main } = partitionSections(sections, SIDEBAR_SECTIONS)

  return (
    <div style={{
      fontFamily: "'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif",
      display: "flex",
      flexDirection: "column",
      minHeight: 1123,
      position: "relative",
      backgroundImage: "url('/templates/resume-bg-modern.svg')",
      backgroundSize: "794px 1123px",
      backgroundRepeat: "no-repeat",
      backgroundPosition: "top left",
    }}>
      <ModernHeader personal={personal} />

      {/* Body */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <div style={{
          width: "31%",
          flexShrink: 0,
          padding: "20px 14px",
          background: "rgba(63,63,63,0.92)",
          color: WHITE_DIM,
        }}>
          {sidebar.map((section) => {
            const value = data[section.section_key]
            const rendered = renderSectionValue(section, value)
            if (!rendered) return null
            return (
              <SidebarSection key={section.section_key} label={section.label}>
                <SectionContent
                  fieldType={section.field_type}
                  value={rendered}
                  tokens={sidebarTokens}
                />
              </SidebarSection>
            )
          })}
        </div>

        {/* Main column */}
        <div style={{
          flex: 1,
          padding: "20px 22px",
          background: "rgba(255,255,255,0.97)",
          color: MAIN_TEXT,
        }}>
          {main.map((section) => {
            const value = data[section.section_key]
            const rendered = renderSectionValue(section, value)
            if (!rendered) return null

            // Special handling for objective/summary
            if (section.section_key === "objective" && rendered) {
              return (
                <MainSection key={section.section_key} label={section.label}>
                  <p style={{
                    fontSize: 12,
                    color: MAIN_MUTED,
                    lineHeight: 1.65,
                    margin: 0,
                    fontStyle: "italic",
                  }}>
                    {rendered}
                  </p>
                </MainSection>
              )
            }

            return (
              <MainSection key={section.section_key} label={section.label}>
                <SectionContent
                  fieldType={section.field_type}
                  value={rendered}
                  tokens={mainTokens}
                />
              </MainSection>
            )
          })}
        </div>
      </div>
    </div>
  )
}