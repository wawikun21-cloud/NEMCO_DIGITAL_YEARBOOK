/**
 * resumeHelpers.js
 * Shared utilities and data extractors for all resume templates.
 */

export function formatDate(str) {
  if (!str) return ""
  if (str === "Present") return "Present"
  try {
    return new Date(str).toLocaleDateString("en-US", { month: "short", year: "numeric" })
  } catch {
    return str
  }
}

export function formatDateRange(from, to) {
  const f = formatDate(from)
  const t = formatDate(to)
  if (!f && !t) return ""
  if (!t) return f
  return `${f} – ${t}`
}

export function renderSectionValue(section, value) {
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

export function extractPersonal(data) {
  const personal = data?.personal || {}
  return {
    name: personal.name || data?.name || "",
    title: personal.title || personal.headline || data?.title || "",
    email: personal.email || data?.email || "",
    phone: personal.phone || data?.phone || "",
    location: personal.location || data?.location || "",
    linkedin: personal.linkedin || data?.linkedin || "",
    website: personal.website || data?.website || "",
    photo_url: personal.photo_url || data?.photo_url || "",
  }
}

/** Partition sections into sidebar vs. main for two-column layouts. */
export function partitionSections(sections, sidebarKeys = []) {
  return {
    sidebar: sections.filter((s) => sidebarKeys.includes(s.section_key) && s.section_key !== "personal"),
    main: sections.filter((s) => !sidebarKeys.includes(s.section_key) && s.section_key !== "personal"),
  }
}
