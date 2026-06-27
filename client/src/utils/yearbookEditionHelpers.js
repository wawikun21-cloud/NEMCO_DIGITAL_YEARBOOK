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
