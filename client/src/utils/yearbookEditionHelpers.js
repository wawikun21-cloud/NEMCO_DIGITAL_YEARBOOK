const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || ""

export function resolveFileUrl(fileUrl) {
  if (!fileUrl) return fileUrl
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl
  }
  if (fileUrl.startsWith("/api/")) {
    if (!API_BASE_URL) return fileUrl
    if (API_BASE_URL.endsWith("/api")) {
      return `${API_BASE_URL.slice(0, -4)}${fileUrl}`
    }
    return `${API_BASE_URL}${fileUrl}`
  }
  return API_BASE_URL ? `${API_BASE_URL}/${fileUrl.replace(/^\/+/, "")}` : `/${fileUrl}`
}

export { API_BASE_URL }

export function normalizeBatchLabel(value) {
  if (value == null) return null
  const normalized = String(value)
    .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
  return normalized || null
}

export function normalizeEditionFilter(value) {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed || null
}

export function dedupeBatchLabels(values) {
  const seen = new Map()
  for (const raw of values) {
    const display = normalizeBatchLabel(raw)
    if (!display) continue
    const key = display.toLowerCase()
    if (!seen.has(key)) seen.set(key, display)
  }
  return [...seen.values()].sort()
}

export function dedupeCourseStrands(values) {
  const seen = new Set()
  const result = []
  for (const raw of values) {
    const normalized = normalizeEditionFilter(raw)
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(normalized)
    }
  }
  return result.sort()
}

export function newestBatchLabel(batches) {
  const deduped = dedupeBatchLabels(batches || [])
  return deduped.length > 0 ? deduped[deduped.length - 1] : null
}
