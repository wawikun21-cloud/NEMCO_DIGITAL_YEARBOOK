import { supabaseAdmin } from "../config/supabase.js"
import { getPdfPageImagesWithFallback } from "./pdfRenderService.js"

const COURSE_OPTIONS_CLIENT = [
  { value: "CCJE", label: "CCJE", subs: ["BSCRIM"] },
  { value: "CIT", label: "CIT", subs: ["BSIT", "ACT"] },
  { value: "CBE", label: "CBE", subs: ["BSBA", "MARMA", "FINMA"] },
  { value: "CEAS", label: "CEAS", subs: ["BSED", "BEED", "AB"] },
]

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

const columnExistenceCache = new Map()

async function checkColumnExists(column) {
  if (columnExistenceCache.has(column)) {
    return columnExistenceCache.get(column)
  }
  try {
    const { error } = await supabaseAdmin
      .from("flipbook_pdf_pages")
      .select(column)
      .limit(1)
    const exists = !error
    columnExistenceCache.set(column, exists)
    return exists
  } catch {
    columnExistenceCache.set(column, false)
    return false
  }
}

async function columnsExist() {
  return checkColumnExists("department")
}

async function subDepartmentColumnExists() {
  return checkColumnExists("sub_department")
}

async function editionColumnExists() {
  return checkColumnExists("edition")
}

// The primary yearbook that opens first for every student regardless of course.
// Stored as the literal value 'main' in the edition column. Exposed as a friendly
// label in UIs that display it.
export const EDITION_MAIN = "main"
export const EDITION_MAIN_LABEL = "YEARBOOK MAIN"

function normalizeEdition(value) {
  const normalized = normalizeEditionFilter(value)
  if (!normalized) return null
  return normalized.toLowerCase() === EDITION_MAIN ? EDITION_MAIN : normalized
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
     .select("course_or_strand, sub_course, year_graduated")
     .not("course_or_strand", "is", null)

   if (error) {
     throw new Error(`Failed to fetch profile course/strand catalog: ${error.message}`)
   }

   const courses = dedupeCourseStrands((data || []).map((p) => p.course_or_strand))
   const subCourses = dedupeCourseStrands((data || []).map((p) => p.sub_course).filter(Boolean))
   const batches = dedupeBatchLabels((data || []).map((p) => p.year_graduated))

   return { courses, subCourses, batches }
}

async function resolveCourseOrStrand(value) {
   const normalized = normalizeEditionFilter(value)
   if (!normalized) return null

   const { courses, subCourses } = await fetchProfileCourseStrandsAndBatches()
   if (courses.includes(normalized)) return normalized
   if (subCourses.includes(normalized)) return normalized

   const staticDepartments = COURSE_OPTIONS_CLIENT.flatMap((entry) => [entry.value, ...(entry.subs || [])])
   const allValues = [...courses, ...subCourses, ...staticDepartments]
   const caseMatch = allValues.find((c) => c.toLowerCase() === normalized.toLowerCase())
   if (caseMatch) return caseMatch

   throw new Error(
     `Course/strand "${normalized}" is not in student profiles. Choose a value from the course/strand list.`
   )
}

async function fetchActivePdfPages(department = null, batch = null, subDepartment = null, { edition = null } = {}) {
     const hasCols = await columnsExist()
     const hasSubDeptCol = await subDepartmentColumnExists()
     const hasEditionCol = await editionColumnExists()
     const dept = normalizeEditionFilter(department)
     const subDept = normalizeEditionFilter(subDepartment)
     const bat = normalizeBatchLabel(batch)
     const editionFilter = hasEditionCol ? normalizeEdition(edition) : null

     const selectCols = hasCols
       ? "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active, department, batch"
       : "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active"
     const selectColsWithFlags = [
       selectCols,
       hasSubDeptCol ? "sub_department" : null,
       hasEditionCol ? "edition" : null,
     ].filter(Boolean).join(", ")

      let query = supabaseAdmin
        .from("flipbook_pdf_pages")
        .select(selectColsWithFlags)
        .eq("is_active", true)

      // Main edition is global: it must never be filtered out by the student's
      // course/strand or batch, so we scope edition lookups precisely.
      if (hasEditionCol && editionFilter === EDITION_MAIN) {
        query = query.eq("edition", EDITION_MAIN)
      } else if (hasEditionCol) {
        // Course-scoped lookup: only 'course' (or legacy null) pages, optionally
        // narrowed by department/batch below.
        query = query.or("edition.is.null,edition.eq.course")
        if (dept) {
          // Match the department exactly OR match any parent course that has this
          // sub-course. E.g. if dept = "BSIT", also match rows where department
          // = "CIT" (the parent of BSIT). This ensures students see PDFs uploaded
          // under their parent course OR their specific sub-course.
          const parentCourses = getParentCoursesForSub(dept)
          const deptValues = [dept, ...parentCourses]
          query = query.in("department", deptValues)
        }
        if (subDept && hasSubDeptCol) query = query.ilike("sub_department", subDept)
      } else if (dept && hasCols) {
        const parentCourses = getParentCoursesForSub(dept)
        const deptValues = [dept, ...parentCourses]
        query = query.in("department", deptValues)
        if (subDept && hasSubDeptCol) query = query.ilike("sub_department", subDept)
      }

      query = query.order("sort_order", { ascending: true })

       const { data, error } = await query
     if (error) {
       throw new Error(`Failed to fetch PDF pages: ${error.message}`)
     }

     let pages = data || []
     if (bat && hasCols && editionFilter !== EDITION_MAIN) {
       pages = pages.filter((p) => batchLabelsMatch(p.batch, bat))
     }

     return pages
   }

   // Given a sub-course value (e.g. "BSIT"), return the list of parent course
   // names (e.g. ["CIT"]) under which PDFs may have been uploaded. This lets a
   // student see PDFs uploaded under their parent course OR their sub-course.
   function getParentCoursesForSub(subValue) {
     if (!subValue) return []
     const parents = []
     for (const entry of COURSE_OPTIONS_CLIENT || []) {
       if (entry.subs && entry.subs.includes(subValue)) {
         parents.push(entry.value)
       }
     }
     return parents
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
       .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, sub_course, section, bio, quote, profile_status")
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
     .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, sub_course, section, bio, quote")
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
      return {
        settings,
        sourceType: "pdfs",
        profiles: [],
        sections: [],
        pdfPages: [],
        mainPdfPages: [],
        coursePdfPages: [],
      }
    }

    const dept = normalizeEditionFilter(department)
    const bat = dept ? normalizeEditionFilter(batch) : null

    const [mainPages, coursePages] = await Promise.all([
      fetchActivePdfPages(null, null, null, { edition: EDITION_MAIN }),
      dept ? fetchActivePdfPages(dept, bat) : Promise.resolve([]),
    ])

    let resolvedCoursePages = coursePages
    if (dept && resolvedCoursePages.length === 0 && bat) {
      resolvedCoursePages = await fetchActivePdfPages(dept, null)
    }

    if (dept && resolvedCoursePages.length > 0) {
      const deptValues = new Set([dept, ...getParentCoursesForSub(dept)].map((value) => String(value || "").trim().toLowerCase()))
      resolvedCoursePages = resolvedCoursePages.filter((page) => {
        const pageDept = String(page?.department || "").trim().toLowerCase()
        return pageDept && deptValues.has(pageDept)
      })
    }

    const allPages = [...mainPages, ...resolvedCoursePages]
    const enrichedPages = await enrichPdfPagesWithImages(allPages)
    
    const enrichedMain = enrichedPages.slice(0, mainPages.length)
    const enrichedCourse = enrichedPages.slice(mainPages.length)

    return {
      settings,
      sourceType: "pdfs",
      profiles: [],
      sections: [],
      pdfPages: enrichedPages,
      mainPdfPages: enrichedMain,
      coursePdfPages: enrichedCourse,
    }
}

export async function getYearbookCatalog() {
    const hasCols = await columnsExist()
    const hasEditionCol = await editionColumnExists()

    const { courses: profileCourses, subCourses: profileSubCourses, batches: profileBatches } = await fetchProfileCourseStrandsAndBatches()

    if (hasCols) {
      const selectCols = [
        "department",
        "batch",
        hasEditionCol ? "edition" : null,
      ].filter(Boolean).join(", ")
      const { data: pairData, error: pairError } = await supabaseAdmin
        .from("flipbook_pdf_pages")
        .select(selectCols)
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

      // The YEARBOOK MAIN edition is global — it isn't tied to any course/strand.
      // We surface its presence so the admin UI can highlight it and the student
      // flipbook can confirm the main yearbook is always loaded first.
      let hasMainEdition = false
      if (hasEditionCol) {
        const { data: mainRows } = await supabaseAdmin
          .from("flipbook_pdf_pages")
          .select("id")
          .eq("is_active", true)
          .eq("edition", EDITION_MAIN)
          .limit(1)
        hasMainEdition = (mainRows || []).length > 0
      }

      return {
        departments,
        batches,
        courseStrands: profileCourses,
        subCourses: profileSubCourses,
        departmentBatchMatrix,
        hasMainEdition,
        mainEditionLabel: EDITION_MAIN_LABEL,
      }
    }

    return {
      departments: profileCourses,
      batches: profileBatches,
      courseStrands: profileCourses,
      subCourses: profileSubCourses,
      departmentBatchMatrix: {},
      hasMainEdition: false,
      mainEditionLabel: EDITION_MAIN_LABEL,
    }
}

export async function getFlipbookPdfPages(department = null, batch = null, { edition = null } = {}) {
    const hasCols = await columnsExist()
    const hasSubDeptCol = await subDepartmentColumnExists()
    const hasEditionCol = await editionColumnExists()

    const baseCols = hasCols
      ? "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, is_active, created_at, updated_at, department, batch"
      : "id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, is_active, created_at, updated_at"
    const selectCols = [
      baseCols,
      hasSubDeptCol ? "sub_department" : null,
      hasEditionCol ? "edition" : null,
    ].filter(Boolean).join(", ")

    let query = supabaseAdmin
      .from("flipbook_pdf_pages")
      .select(selectCols)

    if (hasEditionCol && edition) {
      const ed = normalizeEdition(edition)
      query = query.eq("edition", ed)
    }

    if (department && hasCols) {
      query = query.eq("department", department)
    }
    if (batch && hasCols) {
      query = query.eq("batch", batch)
    }

    query = query.order("sort_order", { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch PDF pages: ${error.message}`)
    }

    return data || []
}

async function enrichPdfPagesWithImages(pages) {
  if (!pages || pages.length === 0) return pages
  
  const pdfIds = pages.map(p => p.id)
  const images = await getPdfPageImagesWithFallback(pdfIds)
  
  if (!images || images.length === 0) return pages

  const imagesByPdf = {}
  for (const img of images) {
    if (!imagesByPdf[img.pdf_page_id]) {
      imagesByPdf[img.pdf_page_id] = []
    }
    imagesByPdf[img.pdf_page_id].push(img)
  }
  
  return pages.map(page => ({
    ...page,
    rendered_images: imagesByPdf[page.id] || [],
  }))
}

export async function getFlipbookPdfPagesWithImages(department = null, batch = null, { edition = null } = {}) {
  const pages = await getFlipbookPdfPages(department, batch, { edition })
  return enrichPdfPagesWithImages(pages)
}

export async function createFlipbookPdfPage({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, uploadedBy, department, subDepartment, batch, edition }) {
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
    const hasSubDeptCol = await subDepartmentColumnExists()
    const hasEditionCol = await editionColumnExists()

    if (hasCols) {
      // A main edition page is global — course/strain and batch don't apply.
      const normalizedEdition = hasEditionCol ? normalizeEdition(edition) : null
      const isMain = normalizedEdition === EDITION_MAIN
      insertData.department = isMain ? null : (department ? await resolveCourseOrStrand(department) : null)
      insertData.batch = isMain ? null : normalizeBatchLabel(batch)
      if (hasEditionCol) insertData.edition = normalizedEdition || "course"
    }
    if (hasSubDeptCol && hasCols) {
      insertData.sub_department = (insertData.department && subDepartment)
        ? await resolveCourseOrStrand(subDepartment)
        : null
    }

  const { data, error } = await supabaseAdmin
    .from("flipbook_pdf_pages")
    .insert(insertData)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to create PDF page: ${error.message}`)
  }

  if (data?.file_path || data?.file_url) {
    const { renderPdfPagesProgressive } = await import("./pdfRenderService.js")
    renderPdfPagesProgressive(data.id, data.file_url, data.file_path).catch((err) => {
      console.error(`[flipbookService] Progressive render failed for pdf_id=${data.id}:`, err.message)
    })
  }

  return data
}

export async function updateFlipbookPdfPage(id, { title, description, sortOrder, isActive, department, subDepartment, batch, edition }) {
    const updateData = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (isActive !== undefined) updateData.is_active = isActive

    const hasCols = await columnsExist()
    const hasSubDeptCol = await subDepartmentColumnExists()
    const hasEditionCol = await editionColumnExists()

    if (hasCols) {
      if (hasEditionCol && edition !== undefined) {
        const normalizedEdition = normalizeEdition(edition)
        updateData.edition = normalizedEdition || "course"
        if (normalizedEdition === EDITION_MAIN) {
          // Main edition is global — clear course/strand + batch so it never
          // collides with course-scoped filtering.
          updateData.department = null
          updateData.batch = null
          updateData.sub_department = null
        }
      }
      if (department !== undefined && updateData.edition !== EDITION_MAIN) {
        updateData.department = department ? await resolveCourseOrStrand(department) : null
      }
      if (batch !== undefined && updateData.edition !== EDITION_MAIN) {
        updateData.batch = normalizeBatchLabel(batch)
      }
    }
    if (hasSubDeptCol && hasCols) {
      if (subDepartment !== undefined && updateData.edition !== EDITION_MAIN) {
        updateData.sub_department = subDepartment ? await resolveCourseOrStrand(subDepartment) : null
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
    .select("id, file_url, file_path")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`Failed to fetch PDF page for deletion: ${fetchError.message}`)
  }

  if (page?.file_path) {
    try {
      const { deletePdfFile } = await import("./fileUploadService.js")
      await deletePdfFile(page.file_path)
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