import { supabaseAdmin } from "../config/supabase.js"

export async function getResumes({
  page = 1,
  perPage = 25,
  template = null,
  isPublic = null,
  search = null,
  dateFrom = null,
  dateTo = null,
} = {}) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabaseAdmin
    .from("resumes")
    .select(
      "id, user_id, title, template, data, is_public, created_at, updated_at",
      { count: "exact" }
    )
    .order("updated_at", { ascending: false })
    .range(from, to)

  if (template) {
    query = query.eq("template", template)
  }
  if (isPublic !== null) {
    query = query.eq("is_public", isPublic)
  }
  if (dateFrom) {
    query = query.gte("created_at", dateFrom)
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch resumes: ${error.message}`)
  }

  const resumes = data || []

  if (search && resumes.length > 0) {
    const userIds = [...new Set(resumes.map((r) => r.user_id))]
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url")
      .in("id", userIds)
      .or(
        `display_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,student_number.ilike.%${search}%`
      )

    const matchedIds = new Set((profiles || []).map((p) => p.id))
    const filtered = resumes.filter((r) => matchedIds.has(r.user_id))

    const userMap = {}
    for (const p of profiles || []) {
      userMap[p.id] = p
    }

    return {
      resumes: filtered.map((r) => ({ ...r, user: r.user_id ? userMap[r.user_id] || null : null })),
      total: filtered.length,
      page,
      perPage,
    }
  }

  const userIds = [...new Set(resumes.map((r) => r.user_id).filter(Boolean))]
  let userMap = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url")
      .in("id", userIds)
    for (const p of profiles || []) {
      userMap[p.id] = p
    }
  }

  return {
    resumes: resumes.map((r) => ({
      ...r,
      user: r.user_id ? userMap[r.user_id] || null : null,
    })),
    total: count || 0,
    page,
    perPage,
  }
}

export async function getResumeById(id) {
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("id, user_id, title, template, data, is_public, created_at, updated_at")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }
  if (!data) {
    return null
  }

  let user = null
  if (data.user_id) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section")
      .eq("id", data.user_id)
      .maybeSingle()
    user = profile || null
  }

  return { ...data, user }
}

export async function updateResume(id, { title, isPublic }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (title !== undefined) updateData.title = title
  if (isPublic !== undefined) updateData.is_public = isPublic

  const { data, error } = await supabaseAdmin
    .from("resumes")
    .update(updateData)
    .eq("id", id)
    .select("id, user_id, title, template, data, is_public, created_at, updated_at")
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update resume: ${error.message}`)
  }
  if (!data) {
    return null
  }

  return data
}

export async function deleteResume(id) {
  const { error } = await supabaseAdmin.from("resumes").delete().eq("id", id)

  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`)
  }

  return true
}

export async function getResumeStats() {
  const { data: allResumes, error: allError } = await supabaseAdmin
    .from("resumes")
    .select("id, template, is_public, created_at")

  if (allError) {
    throw new Error(`Failed to fetch resume stats: ${allError.message}`)
  }

  const resumes = allResumes || []
  const total = resumes.length
  const publicCount = resumes.filter((r) => r.is_public).length
  const privateCount = total - publicCount

  const templateCounts = {}
  for (const r of resumes) {
    const t = r.template || "simple"
    templateCounts[t] = (templateCounts[t] || 0) + 1
  }

  const now = new Date()
  const thisMonth = resumes.filter((r) => {
    const d = new Date(r.created_at)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length

  return {
    total,
    public: publicCount,
    private: privateCount,
    byTemplate: templateCounts,
    thisMonth,
  }
}
