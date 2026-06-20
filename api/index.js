import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
  auth: { autoRefreshToken: false, persistSession: false },
})

function json(res, status, body) {
  res.setHeader("Content-Type", "application/json")
  res.status(status).end(JSON.stringify(body))
}

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || ""
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean)
  if (origin && allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization")
  }
}

async function requireAuth(req, res) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) { json(res, 401, { message: "Authorization token required" }); return null }
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !authData?.user) { json(res, 401, { message: "Invalid or expired token" }); return null }
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("id, role, status").eq("id", authData.user.id).maybeSingle()
  if (profileError || !profile) { json(res, 401, { message: "User profile not found" }); return null }
  if (profile.role !== "admin" || profile.status !== "active") { json(res, 403, { message: "Admin access required" }); return null }
  return { ...authData.user, id: profile.id }
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") { resolve({}); return }
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      if (chunks.length === 0) { resolve({}); return }
      const raw = Buffer.concat(chunks).toString("utf8")
      try { resolve(JSON.parse(raw)) } catch { resolve({}) }
    })
    req.on("error", reject)
  })
}

const loginSchema = z.object({ studentId: z.string().trim().min(1), password: z.string().min(1) })

async function handleLogin(req, res) {
  try {
    const body = loginSchema.parse(req.body)
    const identifier = body.studentId.trim()
    const { data: profile, error: pe } = await supabaseAdmin.from("profiles").select("id,email,role,status,student_number").ilike("student_number", identifier).maybeSingle()
    if (pe) return json(res, 500, { message: "Unable to find your account" })
    if (!profile) return json(res, 404, { message: "No account found for this Student ID" })
    if (profile.status !== "active") return json(res, 403, { message: "This account is inactive. Please contact an administrator" })
    if (!["admin", "user"].includes(profile.role)) return json(res, 403, { message: "This account does not have a valid role" })
    const { data: authData, error: ae } = await supabaseAdmin.auth.signInWithPassword({ email: profile.email, password: body.password })
    if (ae) return json(res, 401, { message: "Invalid Student ID or password" })
    const { data: publicProfile } = await supabaseAdmin.from("profiles").select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,avatar_url,is_public,resume_public").eq("id", profile.id).maybeSingle()
    json(res, 200, { message: "Login successful", user: authData.user, session: authData.session, profile: publicProfile })
  } catch (error) {
    if (error.name === "ZodError") return json(res, 400, { message: error.errors[0]?.message || "Invalid request body" })
    json(res, 500, { message: "Internal server error" })
  }
}

async function handleGetUsers(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const url = new URL(req.url, `http://${req.headers.host}`)
  const search = url.searchParams.get("search") || ""
  let query = supabaseAdmin.from("profiles").select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,created_at,updated_at").order("created_at", { ascending: false })
  if (search) query = query.or([`full_name.ilike.%${search}%`, `email.ilike.%${search}%`, `student_number.ilike.%${search}%`].join(","))
  const { data, error } = await query
  if (error) return json(res, 500, { message: "Failed to fetch users" })
  json(res, 200, { users: data || [] })
}

async function handleGetUser(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("profiles").select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,created_at,updated_at").eq("id", id).maybeSingle()
  if (error) return json(res, 500, { message: "Failed to fetch user" })
  if (!data) return json(res, 404, { message: "User not found" })
  json(res, 200, { user: data })
}

async function handleCreateUser(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { student_number, email, full_name, ...profileFields } = req.body
    const { data: existingProfile } = await supabaseAdmin.from("profiles").select("id").eq("student_number", student_number).maybeSingle()
    if (existingProfile) return json(res, 409, { message: "Student number already exists" })
    const { data: existingEmail } = await supabaseAdmin.from("profiles").select("id").eq("email", email).maybeSingle()
    if (existingEmail) return json(res, 409, { message: "Email already exists" })
    const defaultPassword = student_number
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password: defaultPassword, email_confirm: true, user_metadata: { student_number, full_name } })
    if (authError) {
      if (authError.message?.includes("already registered")) return json(res, 409, { message: "Email already registered" })
      return json(res, 400, { message: authError.message || "Failed to create user" })
    }
    const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").upsert({ id: authUser.user.id, email, student_number, full_name, display_name: full_name.split(" ")[0], ...profileFields }, { onConflict: "id" }).select().maybeSingle()
    if (profileError) { await supabaseAdmin.auth.admin.deleteUser(authUser.user.id); return json(res, 500, { message: "Failed to create user profile" }) }
    json(res, 201, { user: authUser.user, profile })
  } catch (error) {
    json(res, 500, { message: error.message || "Failed to create user" })
  }
}

async function handleUpdateUser(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  try {
    const { data: updated, error } = await supabaseAdmin.from("profiles").update(req.body).eq("id", id).select().maybeSingle()
    if (error) return json(res, 400, { message: "Failed to update user" })
    json(res, 200, { user: updated })
  } catch (error) {
    json(res, 500, { message: error.message || "Failed to update user" })
  }
}

async function handleDeleteUser(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
  if (error) return json(res, 400, { message: "Failed to delete user" })
  json(res, 200, { message: "User deleted" })
}

async function handleResetPassword(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").filter(Boolean).pop()
  const { data: { user: targetUser }, error: ge } = await supabaseAdmin.auth.admin.getUserById(id)
  if (ge || !targetUser) return json(res, 404, { message: "User not found" })
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({ type: "recovery", email: targetUser.email })
  if (error) return json(res, 400, { message: "Failed to generate password reset link" })
  json(res, 200, { link: data?.properties?.action_link, email: targetUser.email })
}

const FLIPBOOK_SETTINGS_DEFAULTS = { enabled: true, title: "NEMCO Digital Yearbook", subtitle: "Academic Year 2025-2026", cover_url: "", theme: "default", flip_speed: 0.5, show_page_numbers: true, auto_flip: false, auto_flip_interval: 10 }

async function getFlipbookSettings() {
  const { data, error } = await supabaseAdmin.from("flipbook_settings").select("key, value")
  if (error) throw new Error(`Failed to fetch flipbook settings: ${error.message}`)
  const settings = { ...FLIPBOOK_SETTINGS_DEFAULTS }
  for (const row of data || []) Object.assign(settings, row.value)
  return settings
}

async function handleGetSettings(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try { json(res, 200, await getFlipbookSettings()) } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateSettings(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const entries = Object.entries(req.body)
    for (const [key, value] of entries) {
      const { error } = await supabaseAdmin.from("flipbook_settings").upsert({ key, value: { [key]: value }, updated_at: new Date().toISOString() }, { onConflict: "key" })
      if (error) return json(res, 500, { message: `Failed to update setting "${key}": ${error.message}` })
    }
    json(res, 200, await getFlipbookSettings())
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleGetProfiles(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const url = new URL(req.url, `http://${req.headers.host}`)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const perPage = parseInt(url.searchParams.get("perPage") || "25", 10)
  const section = url.searchParams.get("section") || null
  const search = url.searchParams.get("search") || null
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  let query = supabaseAdmin.from("flipbook_profiles").select("id, profile_id, section_name, page_order, layout_template, is_included, created_at, updated_at", { count: "exact" }).order("page_order", { ascending: true }).range(from, to)
  if (section) query = query.eq("section_name", section)
  const { data, error, count } = await query
  if (error) return json(res, 500, { message: `Failed to fetch profiles: ${error.message}` })
  const profiles = data || []
  const profileIds = profiles.map((p) => p.profile_id).filter(Boolean)
  let profileMap = {}
  if (profileIds.length > 0) {
    let pq = supabaseAdmin.from("profiles").select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote, profile_status").in("id", profileIds)
    if (search) pq = pq.or(`display_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,student_number.ilike.%${search}%`)
    const { data: pd } = await pq
    for (const p of pd || []) profileMap[p.id] = p
  }
  json(res, 200, { profiles: profiles.map((p) => ({ ...p, profile: p.profile_id ? profileMap[p.profile_id] || null : null })), total: count || 0, page, perPage })
}

async function handleGetApprovedProfiles(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("profiles").select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote").eq("profile_status", "approved").order("full_name", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { profiles: data || [] })
}

async function handleAddProfile(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { profileId, sectionName, layoutTemplate = "default" } = req.body
    if (!profileId) return json(res, 400, { message: "profileId is required" })
    const { data: maxOrder } = await supabaseAdmin.from("flipbook_profiles").select("page_order").order("page_order", { ascending: false }).limit(1).maybeSingle()
    const nextOrder = maxOrder ? (maxOrder.page_order || 0) + 1 : 1
    const { data, error } = await supabaseAdmin.from("flipbook_profiles").upsert({ profile_id: profileId, section_name: sectionName || null, page_order: nextOrder, layout_template: layoutTemplate, is_included: true, updated_at: new Date().toISOString() }, { onConflict: "profile_id" }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, { profile: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateProfile(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  try {
    const { sectionName, pageOrder, layoutTemplate, isIncluded } = req.body
    const updateData = { updated_at: new Date().toISOString() }
    if (sectionName !== undefined) updateData.section_name = sectionName
    if (pageOrder !== undefined) updateData.page_order = pageOrder
    if (layoutTemplate !== undefined) updateData.layout_template = layoutTemplate
    if (isIncluded !== undefined) updateData.is_included = isIncluded
    const { data, error } = await supabaseAdmin.from("flipbook_profiles").update(updateData).eq("id", id).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, { profile: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleRemoveProfile(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("flipbook_profiles").delete().eq("id", id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Profile removed" })
}

async function handleReorderProfiles(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { orderedIds } = req.body
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabaseAdmin.from("flipbook_profiles").update({ page_order: i + 1, updated_at: new Date().toISOString() }).eq("id", orderedIds[i])
      if (error) return json(res, 500, { message: error.message })
    }
    json(res, 200, { message: "Reordered" })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleGetSections(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("flipbook_sections").select("id, name, sort_order").order("sort_order", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { sections: data || [] })
}

async function handleAddSection(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { name } = req.body
    if (!name) return json(res, 400, { message: "Section name is required" })
    const { data: maxOrder } = await supabaseAdmin.from("flipbook_sections").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1
    const { data, error } = await supabaseAdmin.from("flipbook_sections").insert({ name, sort_order: nextOrder }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, { section: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleRemoveSection(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("flipbook_sections").delete().eq("id", id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Section deleted" })
}

async function handleGetPublicFlipbook(req, res) {
  try {
    const settings = await getFlipbookSettings()
    if (!settings.enabled) return json(res, 200, { settings, profiles: [], sections: [], pdfPages: [], sourceType: "profiles" })
    const sourceType = settings.source_type || "profiles"
    let flipbookProfiles = []
    if (sourceType === "profiles" || sourceType === "combined") {
      const { data } = await supabaseAdmin.from("flipbook_profiles").select("id, profile_id, section_name, page_order, layout_template").eq("is_included", true).order("page_order", { ascending: true })
      flipbookProfiles = data || []
    }
    const profileIds = (flipbookProfiles || []).map((p) => p.profile_id).filter(Boolean)
    let profileMap = {}
    if (profileIds.length > 0) {
      const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote").in("id", profileIds).eq("is_public", true)
      for (const p of profiles || []) profileMap[p.id] = p
    }
    const { data: sections } = await supabaseAdmin.from("flipbook_sections").select("id, name, sort_order").order("sort_order", { ascending: true })
    let pdfPages = []
    if (sourceType === "pdfs" || sourceType === "combined") {
      const { data } = await supabaseAdmin.from("flipbook_pdf_pages").select("id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, section_name, is_active").eq("is_active", true).order("sort_order", { ascending: true })
      pdfPages = data || []
    }
    json(res, 200, { settings, sourceType, profiles: (flipbookProfiles || []).map((p) => ({ ...p, profile: profileMap[p.profile_id] || null })), sections: sections || [], pdfPages })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleGetPdfPages(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("flipbook_pdf_pages").select("id, title, description, file_url, file_name, file_size, page_count, cover_image_url, sort_order, is_active, created_at, updated_at").order("sort_order", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { pages: data || [] })
}

async function handleAddPdfPage(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, sectionName } = req.body
    if (!fileUrl || !fileName) return json(res, 400, { message: "fileUrl and fileName are required" })
    const { data: maxOrder } = await supabaseAdmin.from("flipbook_pdf_pages").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1
    const { data, error } = await supabaseAdmin.from("flipbook_pdf_pages").insert({ title: title || "Untitled PDF", description: description || null, file_url: fileUrl, file_name: fileName, file_size: fileSize || null, page_count: pageCount || 0, cover_image_url: coverImageUrl || null, file_path: filePath || null, uploaded_by: user.id, sort_order: nextOrder, is_active: true, section_name: sectionName || null }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, { page: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdatePdfPage(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  try {
    const { title, description, sortOrder, isActive } = req.body
    const updateData = { updated_at: new Date().toISOString() }
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (sortOrder !== undefined) updateData.sort_order = sortOrder
    if (isActive !== undefined) updateData.is_active = isActive
    const { data, error } = await supabaseAdmin.from("flipbook_pdf_pages").update(updateData).eq("id", id).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, { page: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleRemovePdfPage(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data: page } = await supabaseAdmin.from("flipbook_pdf_pages").select("id, file_url").eq("id", id).maybeSingle()
  if (page?.file_url) {
    try {
      const url = new URL(page.file_url)
      const pathParts = url.pathname.split("/")
      const bucketIndex = pathParts.indexOf("flipbook-pdfs")
      if (bucketIndex !== -1) { const filePath = pathParts.slice(bucketIndex + 1).join("/"); await supabaseAdmin.storage.from("flipbook-pdfs").remove([filePath]) }
    } catch {}
  }
  const { error } = await supabaseAdmin.from("flipbook_pdf_pages").delete().eq("id", id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "PDF page deleted", page })
}

async function handleReorderPdfPages(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { orderedIds } = req.body
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabaseAdmin.from("flipbook_pdf_pages").update({ sort_order: i + 1, updated_at: new Date().toISOString() }).eq("id", orderedIds[i])
      if (error) return json(res, 500, { message: error.message })
    }
    json(res, 200, { message: "Reordered" })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleListLogs(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const url = new URL(req.url, `http://${req.headers.host}`)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const perPage = parseInt(url.searchParams.get("perPage") || "25", 10)
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  const { data, error, count } = await supabaseAdmin.from("audit_logs").select("id, user_id, action, entity_type, entity_id, old_data, new_data, created_at", { count: "exact" }).order("created_at", { ascending: false }).range(from, to)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { logs: data || [], total: count || 0, page, perPage })
}

async function handleGetLog(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("audit_logs").select("*").eq("id", id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Audit log not found" })
  json(res, 200, { log: data })
}

async function handleGetFilters(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data: actions } = await supabaseAdmin.from("audit_logs").select("action").limit(100)
  const { data: entityTypes } = await supabaseAdmin.from("audit_logs").select("entity_type").limit(100)
  json(res, 200, { actions: [...new Set((actions || []).map((a) => a.action))], entityTypes: [...new Set((entityTypes || []).map((e) => e.entity_type))] })
}

async function handleDashboard(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const [{ count: totalUsers }, { count: activeUsers }, { count: completedProfiles }, { count: pendingApprovals }, { count: resumesCreated }, { count: newUsersThisMonth }, { count: recentImports }, { count: failedImports }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("profile_status", "approved"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("profile_status", "submitted"),
      supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", firstDayOfMonth),
      supabaseAdmin.from("import_batches").select("id", { count: "exact", head: true }).gte("created_at", firstDayOfMonth),
      supabaseAdmin.from("import_batches").select("id", { count: "exact", head: true }).in("status", ["failed", "completed_with_errors"]).gte("created_at", firstDayOfMonth),
    ])
    json(res, 200, {
      stats: { totalUsers: totalUsers || 0, activeUsers: activeUsers || 0, completedProfiles: completedProfiles || 0, pendingApprovals: pendingApprovals || 0, resumesCreated: resumesCreated || 0, newUsersThisMonth: newUsersThisMonth || 0, recentImports: recentImports || 0, failedImports: failedImports || 0 },
      recentLogs: [],
      failedImports: [],
    })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleGetTemplates(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const includeInactive = url.searchParams.get("includeInactive") === "true"
  let query = supabaseAdmin.from("resume_templates").select("*").order("sort_order", { ascending: true })
  if (!includeInactive) query = query.eq("is_active", true)
  const { data, error } = await query
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data || [])
}

async function handleGetTemplate(req, res) {
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resume_templates").select("*").eq("id", id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Template not found" })
  json(res, 200, data)
}

async function handleCreateTemplate(req, res) {
  try {
    const { name, slug, description, thumbnail_url, default_sections, is_active = true, sort_order = 0 } = req.body
    const { data: maxOrder } = await supabaseAdmin.from("resume_templates").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    const order = sort_order || (maxOrder ? (maxOrder.sort_order || 0) + 1 : 1)
    const { data, error } = await supabaseAdmin.from("resume_templates").insert({ name, slug, description: description || null, thumbnail_url: thumbnail_url || null, default_sections: default_sections || [], is_active, sort_order: order }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, data)
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateTemplate(req, res) {
  const id = req.url.split("/").pop()
  try {
    const { data, error } = await supabaseAdmin.from("resume_templates").update(req.body).eq("id", id).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, data)
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleDeleteTemplate(req, res) {
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("resume_templates").delete().eq("id", id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Template deleted" })
}

async function handleGetTemplateSections(req, res) {
  const parts = req.url.split("/")
  const templateId = parts[parts.indexOf("templates") + 1]
  const { data, error } = await supabaseAdmin.from("resume_template_sections").select("*").eq("template_id", templateId).order("sort_order", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data || [])
}

async function handleCreateTemplateSection(req, res) {
  const parts = req.url.split("/")
  const templateId = parts[parts.indexOf("templates") + 1]
  try {
    const { data: maxOrder } = await supabaseAdmin.from("resume_template_sections").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1
    const { data, error } = await supabaseAdmin.from("resume_template_sections").insert({ ...req.body, template_id: templateId, sort_order: nextOrder }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, data)
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateTemplateSection(req, res) {
  const id = req.url.split("/").pop()
  try {
    const { data, error } = await supabaseAdmin.from("resume_template_sections").update(req.body).eq("id", id).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, data)
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleDeleteTemplateSection(req, res) {
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("resume_template_sections").delete().eq("id", id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Section deleted" })
}

async function handleReorderTemplateSections(req, res) {
  try {
    const { orderedIds } = req.body
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabaseAdmin.from("resume_template_sections").update({ sort_order: i + 1, updated_at: new Date().toISOString() }).eq("id", orderedIds[i])
      if (error) return json(res, 500, { message: error.message })
    }
    json(res, 200, { message: "Reordered" })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleGetResumes(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const url = new URL(req.url, `http://${req.headers.host}`)
  const page = parseInt(url.searchParams.get("page") || "1", 10)
  const perPage = parseInt(url.searchParams.get("perPage") || "25", 10)
  const status = url.searchParams.get("status") || null
  const search = url.searchParams.get("search") || null
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  let query = supabaseAdmin.from("resumes").select("id, user_id, template_id, title, status, data, created_at, updated_at", { count: "exact" }).order("updated_at", { ascending: false }).range(from, to)
  if (status) query = query.eq("status", status)
  const { data, error, count } = await query
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { resumes: data || [], total: count || 0, page, perPage })
}

async function handleGetResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resumes").select("*").eq("id", id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Resume not found" })
  json(res, 200, data)
}

async function handleUpdateResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resumes").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data)
}

async function handleDeleteResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("resumes").delete().eq("id", id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Resume deleted" })
}

async function handleGetResumeStats(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const [{ count: total }, { count: draft }, { count: published }] = await Promise.all([
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }).eq("status", "published"),
  ])
  json(res, 200, { total: total || 0, draft: draft || 0, published: published || 0 })
}

async function handleGetPublicTemplates(req, res) {
  const { data, error } = await supabaseAdmin.from("resume_templates").select("id, name, slug, description, thumbnail_url").eq("is_active", true).order("sort_order", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data || [])
}

async function handleGetPublicTemplateDetail(req, res) {
  const slug = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resume_templates").select("*").eq("slug", slug).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Template not found" })
  const { data: sections } = await supabaseAdmin.from("resume_template_sections").select("*").eq("template_id", data.id).order("sort_order", { ascending: true })
  json(res, 200, { ...data, sections: sections || [] })
}

async function handleGetMyResumes(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data || [])
}

async function handleGetMyResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resumes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Resume not found" })
  json(res, 200, data)
}

async function handleCreateMyResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const { data, error } = await supabaseAdmin.from("resumes").insert({ ...req.body, user_id: user.id, status: "draft" }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, data)
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateMyResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resumes").update({ ...req.body, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", user.id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data)
}

async function handleDeleteMyResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("resumes").delete().eq("id", id).eq("user_id", user.id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Resume deleted" })
}

async function handleGetMyProfile(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("profiles").select("*").eq("id", user.id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data)
}

async function handleUpdateMyProfile(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("profiles").update(req.body).eq("id", user.id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data)
}

async function handleSubmitProfile(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("profiles").update({ profile_status: "submitted", updated_at: new Date().toISOString() }).eq("id", user.id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data)
}

async function handleUploadAvatar(req, res) {
  json(res, 501, { message: "Avatar upload not yet implemented in serverless mode" })
}

async function handleGetAvatarHistory(req, res) {
  json(res, 200, [])
}

async function handleImportUsers(req, res) {
  json(res, 501, { message: "Import not yet implemented in serverless mode" })
}

async function handleGetBatches(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("import_batches").select("*").order("created_at", { ascending: false })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data || [])
}

async function handleGetBatch(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("import_batches").select("*").eq("id", id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Batch not found" })
  json(res, 200, data)
}

async function handleGetBatchErrors(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const parts = req.url.split("/")
  const batchId = parts[parts.indexOf("batches") + 1]
  const { data, error } = await supabaseAdmin.from("import_errors").select("*").eq("batch_id", batchId)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, data || [])
}

export default async function handler(req, res) {
  setCorsHeaders(req, res)
  if (req.method === "OPTIONS") return res.status(204).end()
  req.body = await parseBody(req)
  const url = new URL(req.url, `http://${req.headers.host}`)
  let pathname = url.pathname.replace(/\/+$/, "") || "/"
  if (!pathname.startsWith("/api")) pathname = "/api" + pathname

  if (pathname === "/api/health") return json(res, 200, { status: "ok", service: "digital-year-book-api" })
  if (pathname === "/api/auth/login" && req.method === "POST") return handleLogin(req, res)

  if (pathname === "/api/admin/users" && req.method === "GET") return handleGetUsers(req, res)
  if (pathname === "/api/admin/users" && req.method === "POST") return handleCreateUser(req, res)
  if (pathname.startsWith("/api/admin/users/") && req.method === "GET") return handleGetUser(req, res)
  if (pathname.startsWith("/api/admin/users/") && req.method === "PATCH") return handleUpdateUser(req, res)
  if (pathname.startsWith("/api/admin/users/") && req.method === "DELETE") return handleDeleteUser(req, res)
  if (pathname.match(/\/api\/admin\/users\/.+\/reset-password$/) && req.method === "POST") return handleResetPassword(req, res)

  if (pathname === "/api/admin/yearbook/settings" && req.method === "GET") return handleGetSettings(req, res)
  if (pathname === "/api/admin/yearbook/settings" && req.method === "PATCH") return handleUpdateSettings(req, res)
  if (pathname === "/api/admin/yearbook/profiles" && req.method === "GET") return handleGetProfiles(req, res)
  if (pathname === "/api/admin/yearbook/profiles" && req.method === "POST") return handleAddProfile(req, res)
  if (pathname.startsWith("/api/admin/yearbook/profiles/") && req.method === "PATCH") return handleUpdateProfile(req, res)
  if (pathname.startsWith("/api/admin/yearbook/profiles/") && req.method === "DELETE") return handleRemoveProfile(req, res)
  if (pathname === "/api/admin/yearbook/approved-profiles" && req.method === "GET") return handleGetApprovedProfiles(req, res)
  if (pathname === "/api/admin/yearbook/reorder" && req.method === "POST") return handleReorderProfiles(req, res)
  if (pathname === "/api/admin/yearbook/sections" && req.method === "GET") return handleGetSections(req, res)
  if (pathname === "/api/admin/yearbook/sections" && req.method === "POST") return handleAddSection(req, res)
  if (pathname.startsWith("/api/admin/yearbook/sections/") && req.method === "DELETE") return handleRemoveSection(req, res)
  if (pathname === "/api/admin/yearbook/flipbook" && req.method === "GET") return handleGetPublicFlipbook(req, res)
  if (pathname === "/api/admin/yearbook/pdf-pages" && req.method === "GET") return handleGetPdfPages(req, res)
  if (pathname === "/api/admin/yearbook/pdf-pages" && req.method === "POST") return handleAddPdfPage(req, res)
  if (pathname.startsWith("/api/admin/yearbook/pdf-pages/") && req.method === "PATCH") return handleUpdatePdfPage(req, res)
  if (pathname.startsWith("/api/admin/yearbook/pdf-pages/") && req.method === "DELETE") return handleRemovePdfPage(req, res)
  if (pathname === "/api/admin/yearbook/pdf-pages/reorder" && req.method === "POST") return handleReorderPdfPages(req, res)

  if (pathname === "/api/admin/logs" && req.method === "GET") return handleListLogs(req, res)
  if (pathname === "/api/admin/logs/filters" && req.method === "GET") return handleGetFilters(req, res)
  if (pathname.startsWith("/api/admin/logs/") && req.method === "GET") return handleGetLog(req, res)
  if (pathname === "/api/admin/dashboard" && req.method === "GET") return handleDashboard(req, res)

  if (pathname === "/api/admin/resume-templates" && req.method === "GET") return handleGetTemplates(req, res)
  if (pathname === "/api/admin/resume-templates" && req.method === "POST") return handleCreateTemplate(req, res)
  if (pathname.match(/\/api\/admin\/resume-templates\/[^/]+\/sections$/) && req.method === "GET") return handleGetTemplateSections(req, res)
  if (pathname.match(/\/api\/admin\/resume-templates\/[^/]+\/sections$/) && req.method === "POST") return handleCreateTemplateSection(req, res)
  if (pathname.match(/\/api\/admin\/resume-templates\/[^/]+\/sections\/reorder$/) && req.method === "POST") return handleReorderTemplateSections(req, res)
  if (pathname.startsWith("/api/admin/resume-templates/") && req.method === "GET") return handleGetTemplate(req, res)
  if (pathname.startsWith("/api/admin/resume-templates/") && req.method === "PATCH") return handleUpdateTemplate(req, res)
  if (pathname.startsWith("/api/admin/resume-templates/") && req.method === "DELETE") return handleDeleteTemplate(req, res)
  if (pathname.match(/\/api\/admin\/resume-sections\/.+$/) && req.method === "PATCH") return handleUpdateTemplateSection(req, res)
  if (pathname.match(/\/api\/admin\/resume-sections\/.+$/) && req.method === "DELETE") return handleDeleteTemplateSection(req, res)

  if (pathname === "/api/admin/resumes" && req.method === "GET") return handleGetResumes(req, res)
  if (pathname.startsWith("/api/admin/resumes/") && req.method === "GET") return handleGetResume(req, res)
  if (pathname.startsWith("/api/admin/resumes/") && req.method === "PATCH") return handleUpdateResume(req, res)
  if (pathname.startsWith("/api/admin/resumes/") && req.method === "DELETE") return handleDeleteResume(req, res)
  if (pathname === "/api/admin/resumes/stats" && req.method === "GET") return handleGetResumeStats(req, res)

  if (pathname === "/api/resume-templates" && req.method === "GET") return handleGetPublicTemplates(req, res)
  if (pathname.startsWith("/api/resume-templates/") && req.method === "GET") return handleGetPublicTemplateDetail(req, res)
  if (pathname === "/api/my/resumes" && req.method === "GET") return handleGetMyResumes(req, res)
  if (pathname === "/api/my/resumes" && req.method === "POST") return handleCreateMyResume(req, res)
  if (pathname.startsWith("/api/my/resumes/") && req.method === "GET") return handleGetMyResume(req, res)
  if (pathname.startsWith("/api/my/resumes/") && req.method === "PATCH") return handleUpdateMyResume(req, res)
  if (pathname.startsWith("/api/my/resumes/") && req.method === "DELETE") return handleDeleteMyResume(req, res)

  if (pathname === "/api/profiles/me" && req.method === "GET") return handleGetMyProfile(req, res)
  if (pathname === "/api/profiles/me" && req.method === "PATCH") return handleUpdateMyProfile(req, res)
  if (pathname === "/api/profiles/submit" && req.method === "POST") return handleSubmitProfile(req, res)
  if (pathname === "/api/profiles/me/avatar" && req.method === "POST") return handleUploadAvatar(req, res)
  if (pathname === "/api/profiles/me/avatar/history" && req.method === "GET") return handleGetAvatarHistory(req, res)

  if (pathname === "/api/admin/import/users" && req.method === "POST") return handleImportUsers(req, res)
  if (pathname === "/api/admin/import/batches" && req.method === "GET") return handleGetBatches(req, res)
  if (pathname.match(/\/api\/admin\/import\/batches\/[^/]+\/errors$/) && req.method === "GET") return handleGetBatchErrors(req, res)
  if (pathname.startsWith("/api/admin/import/batches/") && req.method === "GET") return handleGetBatch(req, res)

  json(res, 404, { message: "Not found", pathname })
}
