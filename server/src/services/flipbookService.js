import { supabaseAdmin } from "../config/supabase.js"

const FLIPBOOK_SETTINGS_DEFAULTS = {
  enabled: true,
  title: "NEMCO Digital Yearbook",
  subtitle: "Academic Year 2025-2026",
  cover_url: "",
  theme: "default",
  flip_speed: 0.5,
  show_page_numbers: true,
  auto_flip: false,
  auto_flip_interval: 10,
}

async function columnsExist() {
  try {
    const { error } = await supabaseAdmin
      .from("flipbook_pdf_pages")
      .select("department")
      .limit(1)
    if (error && error.message.includes("does not exist")) {
      return false
    }
    return true
  } catch {
    return false
  }
}

function normalizeEditionFilter(value) {
  if (value == null) return null
  const trimmed = String(value).trim()
  return trimmed || null
}

function normalizeBatchLabel(value) {
  if (value == null) return null
  const normalized = String(value)
    .replace(/[\u00A0\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
  return normalized || null
}

function dedupeCourseStrands(values) {
  const seen = new Map()
  for (const raw of values) {
    const display = normalizeEditionFilter(raw)
    if (!display) continue
    const key = display.toLowerCase()
    if (!seen.has(key)) seen.set(key, display)
  }
  return [...seen.values()].sort()
}

function dedupeBatchLabels(values) {
  const seen = new Map()
  for (const raw of values) {
    const display = normalizeBatchLabel(raw)
    if (!display) continue
    const key = display.toLowerCase()
    if (!seen.has(key)) seen.set(key, display)
  }
  return [...seen.values()].sort()
}

function batchLabelsMatch(a, b) {
  const left = normalizeBatchLabel(a)?.toLowerCase()
  const right = normalizeBatchLabel(b)?.toLowerCase()
  return Boolean(left && right && left === right)
}

async function fetchProfileCourseStrandsAndBatches() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("course_or_strand, year_graduated")
    .not("course_or_strand", "is", null)

  if (error) {
    throw new Error(`Failed to fetch profile course/strand catalog: ${error.message}`)
  }

  const courses = dedupeCourseStrands((data || []).map((p) => p.course_or_strand))
  const batches = dedupeBatchLabels((data || []).map((p) => p.year_graduated))

  return { courses, batches }
}

async function resolveCourseOrStrand(value) {
  const normalized = normalizeEditionFilter(value)
  if (!normalized) return null

  const { courses } = await fetchProfileCourseStrandsAndBatches()
  if (courses.includes(normalized)) return normalized

  const caseMatch = courses.find((c) => c.toLowerCase() === normalized.toLowerCase())
  if (caseMatch) return caseMatch

  throw new Error(
    `Course/strand "${normalized}" is not in student profiles. Choose a value from the course/strand list.`
  )
}

async function fetchActivePdfPages(department = null, batch = null) {
  const hasCols = await columnsExist()
  const dept = normalizeEditionFilter(department)
  const bat = normalizeBatchLabel(batch)

  let query = supabaseAdmin
    .from("flipbook_pdf_pages")
    .select(
      hasCols
        ? "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active, department, batch"
        : "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active"
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (dept && hasCols) {
    query = query.ilike("department", dept)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Failed to fetch PDF pages: ${error.message}`)
  }

  let pages = data || []
  if (bat && hasCols) {
    pages = pages.filter((p) => batchLabelsMatch(p.batch, bat))
  }

  return pages
}

export async function getFlipbookSettings() {
  const { data, error } = await supabaseAdmin
    .from("flipbook_settings")
    .select("key, value")

  if (error) {
    throw new Error(`Failed to fetch flipbook settings: ${error.message}`)
  }

  const settings = { ...FLIPBOOK_SETTINGS_DEFAULTS }
  for (const row of data || []) {
    Object.assign(settings, row.value)
  }

  return settings
}

export async function updateFlipbookSettings(updates) {
  const entries = Object.entries(updates)
  if (entries.length === 0) return getFlipbookSettings()

  for (const [key, value] of entries) {
    const { error } = await supabaseAdmin
      .from("flipbook_settings")
      .upsert(
        { key, value: { [key]: value }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )

    if (error) {
      throw new Error(`Failed to update flipbook setting "${key}": ${error.message}`)
    }
  }

  return getFlipbookSettings()
}

export async function getFlipbookProfiles({
  page = 1,
  perPage = 25,
  section = null,
  search = null,
} = {}) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabaseAdmin
    .from("flipbook_profiles")
    .select(
      "id, profile_id, section_name, page_order, layout_template, is_included, created_at, updated_at",
      { count: "exact" }
    )
    .order("page_order", { ascending: true })
    .range(from, to)

  if (section) {
    query = query.eq("section_name", section)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch flipbook profiles: ${error.message}`)
  }

  const profiles = data || []
  const profileIds = profiles.map((p) => p.profile_id).filter(Boolean)

  let profileMap = {}
  if (profileIds.length > 0) {
    let profileQuery = supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote, profile_status")
      .in("id", profileIds)

    if (search) {
      profileQuery = profileQuery.or(
        `display_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,student_number.ilike.%${search}%`
      )
    }

    const { data: profileData } = await profileQuery
    for (const p of profileData || []) {
      profileMap[p.id] = p
    }
  }

  return {
    profiles: profiles.map((p) => ({
      ...p,
      profile: p.profile_id ? profileMap[p.profile_id] || null : null,
    })),
    total: count || 0,
    page,
    perPage,
  }
}

export async function getApprovedProfilesForFlipbook() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote")
    .eq("profile_status", "approved")
    .order("full_name", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch approved profiles: ${error.message}`)
  }

  return data || []
}

export async function addProfileToFlipbook(profileId, { sectionName, layoutTemplate = "default" }) {
  const { data: maxOrder } = await supabaseAdmin
    .from("flipbook_profiles")
    .select("page_order")
    .order("page_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = maxOrder ? (maxOrder.page_order || 0) + 1 : 1

  const { data, error } = await supabaseAdmin
    .from("flipbook_profiles")
    .upsert(
      {
        profile_id: profileId,
        section_name: sectionName || null,
        page_order: nextOrder,
        layout_template: layoutTemplate,
        is_included: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    )
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to add profile to flipbook: ${error.message}`)
  }

  return data
}

export async function updateFlipbookProfile(id, { sectionName, pageOrder, layoutTemplate, isIncluded }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (sectionName !== undefined) updateData.section_name = sectionName
  if (pageOrder !== undefined) updateData.page_order = pageOrder
  if (layoutTemplate !== undefined) updateData.layout_template = layoutTemplate
  if (isIncluded !== undefined) updateData.is_included = isIncluded

  const { data, error } = await supabaseAdmin
    .from("flipbook_profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update flipbook profile: ${error.message}`)
  }

  return data
}

export async function removeProfileFromFlipbook(id) {
  const { error } = await supabaseAdmin
    .from("flipbook_profiles")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to remove profile from flipbook: ${error.message}`)
  }

  return true
}

export async function reorderFlipbookProfiles(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabaseAdmin
      .from("flipbook_profiles")
      .update({ page_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i])

    if (error) {
      throw new Error(`Failed to reorder flipbook profile at position ${i}: ${error.message}`)
    }
  }

  return true
}

export async function getFlipbookSections() {
  const { data, error } = await supabaseAdmin
    .from("flipbook_sections")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch flipbook sections: ${error.message}`)
  }

  return data || []
}

export async function createFlipbookSection(name) {
  const { data: maxOrder } = await supabaseAdmin
    .from("flipbook_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1

  const { data, error } = await supabaseAdmin
    .from("flipbook_sections")
    .insert({ name, sort_order: nextOrder })
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to create flipbook section: ${error.message}`)
  }

  return data
}

export async function deleteFlipbookSection(id) {
  const { error } = await supabaseAdmin
    .from("flipbook_sections")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to delete flipbook section: ${error.message}`)
  }

  return true
}

export async function getPublicFlipbook(department = null, batch = null) {
  const settings = await getFlipbookSettings()

  if (!settings.enabled) {
    return { settings, sourceType: "pdfs", profiles: [], sections: [], pdfPages: [] }
  }

  const dept = normalizeEditionFilter(department)
  const bat = normalizeEditionFilter(batch)

  let pdfPages = await fetchActivePdfPages(dept, bat)

  // Same course/strand, any batch — only when exact dept+batch has no edition
  if (pdfPages.length === 0 && dept && bat) {
    pdfPages = await fetchActivePdfPages(dept, null)
  }

  return {
    settings,
    sourceType: "pdfs",
    profiles: [],
    sections: [],
    pdfPages,
  }
}

export async function getYearbookCatalog() {
  const hasCols = await columnsExist()

  const { courses: profileCourses, batches: profileBatches } = await fetchProfileCourseStrandsAndBatches()

  if (hasCols) {
    const { data: pairData, error: pairError } = await supabaseAdmin
      .from("flipbook_pdf_pages")
      .select("department, batch")
      .eq("is_active", true)
      .not("department", "is", null)

    if (pairError) {
      throw new Error(`Failed to fetch catalog data: ${pairError.message}`)
    }

    const rows = pairData || []
    const pdfCourses = rows.map((d) => d.department).filter(Boolean)
    const pdfBatches = rows.map((b) => b.batch).filter(Boolean)

    const departments = dedupeCourseStrands(pdfCourses)
    const batches = dedupeBatchLabels(pdfBatches)

    const matrixMap = {}
    for (const row of rows) {
      const dept = row.department?.trim()
      const batch = normalizeBatchLabel(row.batch)
      if (!dept || !batch) continue
      if (!matrixMap[dept]) matrixMap[dept] = new Set()
      matrixMap[dept].add(batch)
    }
    const departmentBatchMatrix = {}
    for (const dept of Object.keys(matrixMap).sort()) {
      departmentBatchMatrix[dept] = [...matrixMap[dept]].sort()
    }

    return { departments, batches, courseStrands: profileCourses, departmentBatchMatrix }
  }

  return { departments: profileCourses, batches: profileBatches, courseStrands: profileCourses, departmentBatchMatrix: {} }
}

export async function getFlipbookPdfPages(department = null, batch = null) {
  const hasCols = await columnsExist()

  let query = supabaseAdmin
    .from("flipbook_pdf_pages")
    .select(
      hasCols
        ? "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, is_active, created_at, updated_at, department, batch"
        : "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, is_active, created_at, updated_at"
    )
    .order("sort_order", { ascending: true })

  if (department && hasCols) {
    query = query.eq("department", department)
  }
  if (batch && hasCols) {
    query = query.eq("batch", batch)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch PDF pages: ${error.message}`)
  }

  return data || []
}

export async function createFlipbookPdfPage({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, uploadedBy, department, batch }) {
  const { data: maxOrder } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1

  const insertData = {
    title: title || "Untitled PDF",
    description: description || null,
    file_url: fileUrl,
    file_name: fileName,
    file_size: fileSize || null,
    page_count: pageCount || 0,
    cover_image_url: coverImageUrl || null,
    file_path: filePath || null,
    uploaded_by: uploadedBy || null,
    sort_order: nextOrder,
    is_active: true,
  }

  const hasCols = await columnsExist()
   if (hasCols) {
      insertData.department = department ? await resolveCourseOrStrand(department) : null
      insertData.batch = normalizeBatchLabel(batch)
   }

  const { data, error } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .insert(insertData)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to create PDF page: ${error.message}`)
  }

  return data
}

export async function updateFlipbookPdfPage(id, { title, description, sortOrder, isActive, department, batch }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (sortOrder !== undefined) updateData.sort_order = sortOrder
  if (isActive !== undefined) updateData.is_active = isActive

  const hasCols = await columnsExist()
   if (hasCols) {
     if (department !== undefined) {
       updateData.department = department ? await resolveCourseOrStrand(department) : null
     }
     if (batch !== undefined) {
       updateData.batch = normalizeBatchLabel(batch)
     }
   }

  const { data, error } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update PDF page: ${error.message}`)
  }

  return data
}

export async function deleteFlipbookPdfPage(id) {
  const { data: page, error: fetchError } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .select("id, file_url")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch PDF page for deletion: ${fetchError.message}`)
  }

  if (page?.file_url) {
    try {
      const url = new URL(page.file_url)
      const pathParts = url.pathname.split("/")
      const bucketIndex = pathParts.indexOf("flipbook-pdfs")
      if (bucketIndex !== -1) {
        const filePath = pathParts.slice(bucketIndex + 1).join("/")
        await supabaseAdmin.storage.from("flipbook-pdfs").remove([filePath])
      }
    } catch {
      // Storage deletion is non-critical; continue even if file is missing
    }
  }

  const { error } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .delete()
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to delete PDF page: ${error.message}`)
  }

  return page
}

export async function reorderFlipbookPdfPages(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabaseAdmin
      .from("flipbook_pdf_pages")
      .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i])

    if (error) {
      throw new Error(`Failed to reorder PDF page at position ${i}: ${error.message}`)
    }
  }

  return true
}

export async function searchDepartments(query) {
  const { courses } = await fetchProfileCourseStrandsAndBatches()
  const q = (query || "").trim().toLowerCase()
  if (!q) return courses
  return courses.filter((c) => c.toLowerCase().includes(q))
}