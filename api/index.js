import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import * as XLSX from "xlsx"

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAdmin = createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
  auth: { autoRefreshToken: false, persistSession: false },
})

const PROFILE_COLUMNS =
  "id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,avatar_url,is_public,resume_public,school,year_graduated,home_address,contact_number,website,about_me,quote,skills,qr_data,social_link1,social_link2,social_link3"

const PROFILE_COLUMNS_MINIMAL =
  "id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,avatar_url,is_public,resume_public,social_link1,social_link2,social_link3"

const PROFILE_COLUMNS_WITH_DATES =
  "id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,created_at,updated_at"

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

async function authenticate(req, res) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) { json(res, 401, { message: "Authorization token required" }); return null }
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !authData?.user) { json(res, 401, { message: "Invalid or expired token" }); return null }
  const { data: profile, error: profileError } = await supabaseAdmin.from("profiles").select("id, role, status").eq("id", authData.user.id).maybeSingle()
  if (profileError || !profile) { json(res, 401, { message: "User profile not found" }); return null }
  if (profile.status !== "active") { json(res, 403, { message: "Account is inactive" }); return null }
  return { ...authData.user, id: profile.id, role: profile.role }
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

// Binary-safe multipart parser. The previous implementation converted the
// entire request body to a UTF-8 string (`body.toString("utf8")`) before
// slicing it apart. Binary file bytes (JPEG/PNG/etc.) are NOT valid UTF-8
// in general, so that conversion silently and irreversibly corrupted image
// data — uploads "succeeded" (validation/size checks still passed) but the
// bytes written to storage no longer matched the original file, producing
// a broken image. This version operates on the raw Buffer end-to-end and
// never round-trips file data through a JS string.
function parseMultipart(body, boundary) {
  const parts = {}
  const boundaryBuf = Buffer.from(`--${boundary}`)
  const CRLF = Buffer.from("\r\n")
  const CRLFCRLF = Buffer.from("\r\n\r\n")

  // Split the buffer on boundary markers, working with byte offsets only.
  const sectionBuffers = []
  let searchStart = 0
  while (true) {
    const boundaryIndex = body.indexOf(boundaryBuf, searchStart)
    if (boundaryIndex === -1) break
    const sectionStart = searchStart
    if (sectionStart > 0) {
      sectionBuffers.push(body.subarray(sectionStart, boundaryIndex))
    }
    searchStart = boundaryIndex + boundaryBuf.length
  }

  for (let section of sectionBuffers) {
    // Strip a leading CRLF left over from the previous boundary line.
    if (section.subarray(0, 2).equals(CRLF)) {
      section = section.subarray(2)
    }
    // Skip the closing "--" terminator section.
    if (section.length === 0 || section.subarray(0, 2).toString("utf8") === "--") continue

    const headerEndIndex = section.indexOf(CRLFCRLF)
    if (headerEndIndex === -1) continue

    // Headers are plain ASCII text, so UTF-8 decoding here is safe.
    const headers = section.subarray(0, headerEndIndex).toString("utf8")

    // Content runs from right after the header block to right before the
    // trailing CRLF that precedes the next boundary marker.
    let content = section.subarray(headerEndIndex + 4)
    if (content.subarray(content.length - 2).equals(CRLF)) {
      content = content.subarray(0, content.length - 2)
    }

    const nameMatch = headers.match(/name="([^"]+)"/)
    const filenameMatch = headers.match(/filename="([^"]+)"/)
    if (!nameMatch) continue

    if (filenameMatch) {
      const filename = filenameMatch[1]
      const mimeMatch = headers.match(/Content-Type:\s*([^\r\n]+)/)
      const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream"
      // `content` is already a Buffer slice of the original body — no
      // string conversion, so the original bytes are preserved exactly.
      parts[nameMatch[1]] = { filename, mimeType, data: Buffer.from(content) }
    } else {
      // Plain form fields are text, so utf8 decoding is correct here.
      parts[nameMatch[1]] = content.toString("utf8")
    }
  }
  return parts
}

function validateAvatarFile(file) {
  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!validMimeTypes.includes(file.mimeType)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.")
  }
  const maxSize = 2 * 1024 * 1024
  if (file.data.length > maxSize) {
    throw new Error("File too large. Maximum size is 2MB.")
  }
  return { ...file, size: file.data.length }
}

let avatarBucketInitialized = false
let avatarBucketInitialization = null

async function ensureAvatarBucket() {
  if (avatarBucketInitialized) return
  if (!avatarBucketInitialization) {
    avatarBucketInitialization = (async () => {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
      if (listError) {
        avatarBucketInitialized = true
        return
      }
      const exists = buckets?.some((b) => b.name === "avatars")
      if (!exists) {
        await supabaseAdmin.storage.createBucket("avatars", {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        })
      } else {
        await supabaseAdmin.storage.updateBucket("avatars", {
          public: true,
          fileSizeLimit: 2 * 1024 * 1024,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        })
      }
      avatarBucketInitialized = true
    })()
  }
  await avatarBucketInitialization
}

function validateResumePhoto(file) {
  const validMimeTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!validMimeTypes.includes(file.mimeType)) {
    const error = new Error("Invalid photo type. Only JPEG, PNG, and WebP are allowed.")
    error.status = 400
    throw error
  }
  const maxSize = 5 * 1024 * 1024
  if (file.data.length > maxSize) {
    const error = new Error("Photo too large. Maximum size is 5MB.")
    error.status = 400
    throw error
  }
  return { ...file, size: file.data.length }
}

function getImageExtension(mimeType) {
  const extensions = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  }
  return extensions[mimeType] || "jpg"
}

async function handleUploadAvatar(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  try {
    const contentType = req.headers["content-type"] || ""
    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) return json(res, 400, { message: "Invalid multipart form data" })
    const parts = parseMultipart(req.body, boundaryMatch[1])
    const file = parts.avatar
    if (!file || !file.data) return json(res, 400, { message: "No file uploaded" })
    const validated = validateAvatarFile(file)
    const { data: currentProfile } = await supabaseAdmin.from("profiles").select("avatar_url").eq("id", user.id).single()
    const oldAvatarUrl = currentProfile?.avatar_url || null
    const fileExt = validated.filename.split(".").pop()?.toLowerCase() || "jpg"
    const storagePath = `${user.id}/avatar.${fileExt}`
    // cacheControl is set explicitly (rather than left to the bucket
    // default) so each upsert advertises a short, known TTL — but the real
    // fix is the cache-busting query param below, since the storage path
    // itself never changes (same user.id + same extension every time),
    // so any CDN/browser layer that caches strictly by URL will otherwise
    // keep serving whatever bytes it first saw at that URL indefinitely.
    const { error: uploadError } = await supabaseAdmin.storage.from("avatars").upload(storagePath, validated.data, { contentType: validated.mimeType, upsert: true, cacheControl: "60" })
    if (uploadError) return json(res, 500, { message: `Failed to upload avatar: ${uploadError.message}` })
    const { data: publicUrlData } = supabaseAdmin.storage.from("avatars").getPublicUrl(storagePath)
    // Cache-bust: append a unique version token so every upload gets a
    // distinct URL, completely bypassing CDN/browser image caching for
    // the fixed avatar.jpg path.
    const avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`
    const { data: updatedProfile } = await supabaseAdmin.from("profiles").update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq("id", user.id).select(PROFILE_COLUMNS).single()
    await supabaseAdmin.from("avatar_uploads").insert({ user_id: user.id, file_path: storagePath, file_name: validated.filename, mime_type: validated.mimeType, file_size: validated.size, old_avatar_url: oldAvatarUrl, created_at: new Date().toISOString() })
    json(res, 200, { profile: updatedProfile, avatarUrl })
  } catch (error) { json(res, 500, { message: error.message || "Failed to upload avatar" }) }
}

async function handleUploadResumePhoto(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const match = url.pathname.match(/^\/api\/my\/resumes\/([^/]+)\/photo$/)
    const resumeId = match?.[1]
    if (!resumeId) return json(res, 400, { message: "Resume ID is required" })

    const { data: resume, error: resumeError } = await supabaseAdmin.from("resumes").select("*").eq("id", resumeId).eq("user_id", user.id).maybeSingle()
    if (resumeError) return json(res, 500, { message: resumeError.message })
    if (!resume) return json(res, 404, { message: "Resume not found" })

    const contentType = req.headers["content-type"] || ""
    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) return json(res, 400, { message: "Invalid multipart form data" })
    const parts = parseMultipart(req.body, boundaryMatch[1])
    const file = parts.photo
    if (!file || !file.data) return json(res, 400, { message: "No photo uploaded" })

    const validated = validateResumePhoto(file)
    const fileExt = getImageExtension(validated.mimeType)
    const storagePath = `resume-${resumeId}/photo.${fileExt}`
    const { error: uploadError } = await supabaseAdmin.storage.from("resume-photos").upload(storagePath, validated.data, { contentType: validated.mimeType, upsert: true })
    if (uploadError) return json(res, 500, { message: `Failed to upload photo: ${uploadError.message}` })

    const { data: publicUrlData } = supabaseAdmin.storage.from("resume-photos").getPublicUrl(storagePath)
    const photoUrl = publicUrlData?.publicUrl || ""
    const updatedData = {
      ...(resume.data || {}),
      personal: {
        ...(resume.data?.personal || {}),
        photo_url: photoUrl,
      },
    }

    const { data: updatedResume, error: updateError } = await supabaseAdmin.from("resumes").update({ data: updatedData, updated_at: new Date().toISOString() }).eq("id", resumeId).eq("user_id", user.id).select().maybeSingle()
    if (updateError) return json(res, 500, { message: updateError.message })

    json(res, 200, { resume: updatedResume, photoUrl })
  } catch (error) {
    if (error.status) return json(res, error.status, { message: error.message })
    json(res, 500, { message: error.message || "Failed to upload photo" })
  }
}

async function handleGetAvatarHistory(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const page = parseInt(url.searchParams.get("page") || "1", 10)
    const perPage = parseInt(url.searchParams.get("perPage") || "25", 10)
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    const { data: uploads, error, count } = await supabaseAdmin.from("avatar_uploads").select("id,file_name,mime_type,file_size,file_path,old_avatar_url,created_at", { count: "exact" }).eq("user_id", user.id).order("created_at", { ascending: false }).range(from, to)
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, { uploads: uploads || [], total: count || 0, page, perPage })
  } catch (error) { json(res, 500, { message: error.message }) }
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
    const { data: publicProfile } = await supabaseAdmin.from("profiles").select(PROFILE_COLUMNS_MINIMAL).eq("id", profile.id).maybeSingle()
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
  let query = supabaseAdmin.from("profiles").select(PROFILE_COLUMNS_WITH_DATES).order("created_at", { ascending: false })
  if (search) query = query.or([`full_name.ilike.%${search}%`, `email.ilike.%${search}%`, `student_number.ilike.%${search}%`].join(","))
  const { data, error } = await query
  if (error) return json(res, 500, { message: "Failed to fetch users" })
  json(res, 200, { users: data || [] })
}

async function handleGetUser(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("profiles").select(PROFILE_COLUMNS_WITH_DATES).eq("id", id).maybeSingle()
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

const PUBLIC_PROFILE_BASE_URL = process.env.PUBLIC_PROFILE_BASE_URL || "https://nemco-digital-yearbook.vercel.app/u"

function normalizePublicBaseUrl(baseUrl) {
  const value = (baseUrl || PUBLIC_PROFILE_BASE_URL).replace(/\/+$/, "")
  try {
    const parsed = new URL(value)
    if (baseUrl && parsed.pathname === "/") return `${value}/u`
  } catch {
    return value
  }
  return value
}

function resolvePublicProfileBaseUrl(req) {
  return req.headers.origin || PUBLIC_PROFILE_BASE_URL
}

function buildQrPayload(profile, baseUrl) {
  return `${normalizePublicBaseUrl(baseUrl)}/${profile.student_number || profile.id}`
}

async function handleGenerateQrCode(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  try {
    const { data: existing, error: fetchError } = await supabaseAdmin.from("profiles").select("id,student_number,full_name").eq("id", user.id).maybeSingle()
    if (fetchError || !existing) return json(res, 404, { message: "Profile not found" })
    const qrData = buildQrPayload(existing, resolvePublicProfileBaseUrl(req))
    const { data: profile, error } = await supabaseAdmin.from("profiles").update({ qr_data: qrData, updated_at: new Date().toISOString() }).eq("id", user.id).select(PROFILE_COLUMNS).maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, { profile })
  } catch (error) { json(res, 500, { message: error.message }) }
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
    let pq = supabaseAdmin.from("profiles").select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote, profile_status, social_link1, social_link2, social_link3").in("id", profileIds)
    if (search) pq = pq.or(`display_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,student_number.ilike.%${search}%`)
    const { data: pd } = await pq
    for (const p of pd || []) profileMap[p.id] = p
  }
  json(res, 200, { profiles: profiles.map((p) => ({ ...p, profile: p.profile_id ? profileMap[p.profile_id] || null : null })), total: count || 0, page, perPage })
}

async function handleGetApprovedProfiles(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("profiles").select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote, social_link1, social_link2, social_link3").eq("profile_status", "approved").order("full_name", { ascending: true })
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
      const { data: profiles } = await supabaseAdmin.from("profiles").select("id, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote, social_link1, social_link2, social_link3").in("id", profileIds).eq("is_public", true)
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
  json(res, 200, { templates: data || [] })
}

async function handleGetTemplate(req, res) {
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resume_templates").select("*").eq("id", id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Template not found" })
  const { data: sections } = await supabaseAdmin.from("resume_sections").select("*").eq("template_id", data.id).order("sort_order", { ascending: true })
  json(res, 200, { template: data, sections: sections || [] })
}

async function handleCreateTemplate(req, res) {
  try {
    const { name, slug, description, thumbnail_url, default_sections, is_active = true, sort_order = 0 } = req.body
    const { data: maxOrder } = await supabaseAdmin.from("resume_templates").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    const order = sort_order || (maxOrder ? (maxOrder.sort_order || 0) + 1 : 1)
    const { data, error } = await supabaseAdmin.from("resume_templates").insert({ name, slug, description: description || null, thumbnail_url: thumbnail_url || null, default_sections: default_sections || [], is_active, sort_order: order }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, { template: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateTemplate(req, res) {
  const id = req.url.split("/").pop()
  try {
    const { name, description, thumbnail_url, default_sections, is_active, is_default, sort_order } = req.body
    const updatePayload = { updated_at: new Date().toISOString() }
    if (name !== undefined) updatePayload.name = name
    if (description !== undefined) updatePayload.description = description
    if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url
    if (default_sections !== undefined) updatePayload.default_sections = default_sections
    if (is_active !== undefined) updatePayload.is_active = is_active
    if (is_default !== undefined) updatePayload.is_default = is_default
    if (sort_order !== undefined) updatePayload.sort_order = sort_order
    const { data, error } = await supabaseAdmin.from("resume_templates").update(updatePayload).eq("id", id).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, { template: data })
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
  const { data, error } = await supabaseAdmin.from("resume_sections").select("*").eq("template_id", templateId).order("sort_order", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { sections: data || [] })
}

async function handleCreateTemplateSection(req, res) {
  const parts = req.url.split("/")
  const templateId = parts[parts.indexOf("templates") + 1]
  try {
    const { data: maxOrder } = await supabaseAdmin.from("resume_sections").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle()
    const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1
    const { data, error } = await supabaseAdmin.from("resume_sections").insert({ ...req.body, template_id: templateId, sort_order: nextOrder }).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, { section: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateTemplateSection(req, res) {
  const id = req.url.split("/").pop()
  try {
    const { label, description, icon, field_type, is_required, sort_order, config } = req.body
    const updatePayload = { updated_at: new Date().toISOString() }
    if (label !== undefined) updatePayload.label = label
    if (description !== undefined) updatePayload.description = description
    if (icon !== undefined) updatePayload.icon = icon
    if (field_type !== undefined) updatePayload.field_type = field_type
    if (is_required !== undefined) updatePayload.is_required = is_required
    if (sort_order !== undefined) updatePayload.sort_order = sort_order
    if (config !== undefined) updatePayload.config = config
    const { data, error } = await supabaseAdmin.from("resume_sections").update(updatePayload).eq("id", id).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 200, { section: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleDeleteTemplateSection(req, res) {
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("resume_sections").delete().eq("id", id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Section deleted" })
}

async function handleReorderTemplateSections(req, res) {
  try {
    const { orderedIds } = req.body
    for (let i = 0; i < orderedIds.length; i++) {
      const { error } = await supabaseAdmin.from("resume_sections").update({ sort_order: i + 1, updated_at: new Date().toISOString() }).eq("id", orderedIds[i])
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
  const isPublic = url.searchParams.get("isPublic") || null
  const search = url.searchParams.get("search") || null
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  let query = supabaseAdmin.from("resumes").select("id, user_id, title, template, is_public, data, created_at, updated_at", { count: "exact" }).order("updated_at", { ascending: false }).range(from, to)
  if (isPublic !== null) query = query.eq("is_public", isPublic === "true")
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
  json(res, 200, { resume: data })
}

async function handleUpdateResume(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { title, isPublic } = req.body
  const updatePayload = { updated_at: new Date().toISOString() }
  if (title !== undefined) updatePayload.title = title
  if (isPublic !== undefined) updatePayload.is_public = isPublic
  const { data, error } = await supabaseAdmin.from("resumes").update(updatePayload).eq("id", id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { resume: data })
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
  const [{ count: total }, { count: publicCount }, { count: privateCount }] = await Promise.all([
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }).eq("is_public", true),
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }).eq("is_public", false),
  ])
  json(res, 200, { total: total || 0, public: publicCount || 0, private: privateCount || 0 })
}

async function handleGetPublicTemplates(req, res) {
  const { data, error } = await supabaseAdmin.from("resume_templates").select("id, name, slug, description, thumbnail_url").eq("is_active", true).order("sort_order", { ascending: true })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { templates: data || [] })
}

async function handleGetPublicTemplateDetail(req, res) {
  const slug = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resume_templates").select("*").eq("slug", slug).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Template not found" })
  const { data: sections } = await supabaseAdmin.from("resume_sections").select("*").eq("template_id", data.id).order("sort_order", { ascending: true })
  json(res, 200, { template: data, sections: sections || [] })
}

async function handleGetMyResumes(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  const { data, error } = await supabaseAdmin.from("resumes").select("*").eq("user_id", user.id).order("updated_at", { ascending: false })
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { resumes: data || [] })
}

async function handleGetMyResume(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { data, error } = await supabaseAdmin.from("resumes").select("*").eq("id", id).eq("user_id", user.id).maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  if (!data) return json(res, 404, { message: "Resume not found" })
  json(res, 200, { resume: data })
}

async function handleCreateMyResume(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  try {
    const { title, template, data: resumeData } = req.body
    const insertPayload = {
      user_id: user.id,
      title: title || "My Resume",
      template: template || "simple",
      data: resumeData || {},
      is_public: false,
    }
    const { data, error } = await supabaseAdmin.from("resumes").insert(insertPayload).select().maybeSingle()
    if (error) return json(res, 500, { message: error.message })
    json(res, 201, { resume: data })
  } catch (error) { json(res, 500, { message: error.message }) }
}

async function handleUpdateMyResume(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { title, data: resumeData, isPublic, template } = req.body
  const updatePayload = { updated_at: new Date().toISOString() }
  if (title !== undefined) updatePayload.title = title
  if (resumeData !== undefined) updatePayload.data = resumeData
  if (isPublic !== undefined) updatePayload.is_public = isPublic
  if (template !== undefined) updatePayload.template = template
  const { data, error } = await supabaseAdmin.from("resumes").update(updatePayload).eq("id", id).eq("user_id", user.id).select().maybeSingle()
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { resume: data })
}

async function handleDeleteMyResume(req, res) {
  const user = await authenticate(req, res)
  if (!user) return
  const id = req.url.split("/").pop()
  const { error } = await supabaseAdmin.from("resumes").delete().eq("id", id).eq("user_id", user.id)
  if (error) return json(res, 500, { message: error.message })
  json(res, 200, { message: "Resume deleted" })
}

async function handleGetMyProfile(req, res) {
   const user = await authenticate(req, res)
   if (!user) return
   const { data, error } = await supabaseAdmin.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle()
   if (error) return json(res, 500, { message: error.message })
   if (!data) return json(res, 404, { message: "Profile not found" })
   json(res, 200, { profile: data })
 }

// Public, unauthenticated lookup by student_number OR id — this is the
// endpoint hit when someone scans a profile's QR code. This route exists
// in profileRoutes.js/profileController.js for the local Express server,
// but that server is never deployed to Vercel — only this file is — so
// it had no equivalent here and every public profile request 404'd.
async function handleGetPublicProfile(req, res) {
  const identifier = decodeURIComponent(req.url.split("/").pop() || "").trim()
  if (!identifier) return json(res, 404, { message: "Profile not found or not shared" })

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .or(`student_number.eq.${identifier},id.eq.${identifier}`)
    .maybeSingle()

  if (error) return json(res, 500, { message: "Failed to fetch profile" })
  if (!profile || (!profile.is_public && !profile.qr_data)) {
    return json(res, 404, { message: "Profile not found or not shared" })
  }

  json(res, 200, { profile })
}

 async function handleUpdateMyProfile(req, res) {
   const user = await authenticate(req, res)
   if (!user) return
   const updatePayload = { ...req.body, updated_at: new Date().toISOString() }
   const { data, error } = await supabaseAdmin.from("profiles").update(updatePayload).eq("id", user.id).select(PROFILE_COLUMNS).maybeSingle()
   if (error) return json(res, 500, { message: error.message })
   json(res, 200, { profile: data })
 }

 async function handleSubmitProfile(req, res) {
   const user = await authenticate(req, res)
   if (!user) return
   const { data, error } = await supabaseAdmin.from("profiles").update({ profile_status: "submitted", updated_at: new Date().toISOString() }).eq("id", user.id).select(PROFILE_COLUMNS).maybeSingle()
   if (error) return json(res, 500, { message: error.message })
   json(res, 200, { profile: data })
 }

async function handleImportUsers(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return
  try {
    const body = req.body
    if (!Buffer.isBuffer(body) || body.length === 0) {
      return json(res, 400, { message: "No file uploaded or invalid request body" })
    }
    const contentType = req.headers["content-type"] || ""
    const boundaryMatch = contentType.match(/boundary=(.+)/)
    if (!boundaryMatch) {
      return json(res, 400, { message: "Invalid multipart form data - no boundary found" })
    }
    const parts = parseMultipart(body, boundaryMatch[1])
    const file = parts.file
    if (!file || !file.data) return json(res, 400, { message: "No file uploaded" })
    const buffer = file.data
    const filename = file.filename
    const ext = filename?.toLowerCase().split(".").pop()
    if (!["xlsx", "xls"].includes(ext)) {
      return json(res, 400, { message: "Invalid file type. Only .xlsx and .xls files are allowed" })
    }
    if (buffer.length > 5 * 1024 * 1024) {
      return json(res, 400, { message: "File size exceeds 5MB limit" })
    }

    // Parse Excel
    let workbook
    try {
      workbook = XLSX.read(buffer, { type: "buffer" })
    } catch (parseError) {
      return json(res, 400, { message: `Failed to parse Excel: ${parseError.message}` })
    }
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: false })
    if (rows.length === 0) {
      return json(res, 400, { message: "Excel file is empty or has no data rows" })
    }

    // Validate headers
    const headers = Object.keys(rows[0]).map((h) => h.toLowerCase().trim())
    const requiredColumns = ["student_number", "email", "full_name", "role", "year_level", "course_or_strand"]
    const missing = requiredColumns.filter((col) => !headers.includes(col))
    if (missing.length > 0) {
      return json(res, 400, { message: `Missing required columns: ${missing.join(", ")}` })
    }

    // Create batch record
    const { data: batch, error: batchError } = await supabaseAdmin
      .from("import_batches")
      .insert({
        filename: filename,
        status: "processing",
        total_rows: rows.length,
        success_count: 0,
        failed_count: 0,
        admin_id: user.id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (batchError) return json(res, 500, { message: `Failed to create import batch: ${batchError.message}` })

    // Process rows
    let successCount = 0
    let errorCount = 0
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowData = {
        student_number: String(row.student_number || row["Student Number"] || "").trim().padStart(7, "0"),
        email: String(row.email || row["Email"] || "").trim(),
        full_name: String(row.full_name || row["Full Name"] || "").trim(),
        role: ["admin", "user"].includes(String(row.role || row["Role"] || "user").trim().toLowerCase()) 
          ? String(row.role || row["Role"] || "user").trim().toLowerCase() 
          : "user",
        year_level: String(row.year_level || row["Year Level"] || "").trim(),
        course_or_strand: String(row.course_or_strand || row["Course or Strand"] || "").trim(),
        section: String(row.section || row["Section"] || "").trim() || null,
        display_name: String(row.display_name || row["Display Name"] || "").trim() || null,
        bio: String(row.bio || row["Bio"] || "").trim() || null,
        quote: String(row.quote || row["Quote"] || "").trim() || null,
      }

      // Validate required fields
      if (!rowData.student_number || !rowData.email || !rowData.full_name || !rowData.year_level || !rowData.course_or_strand) {
        errorCount++
        await supabaseAdmin.from("import_errors").insert({
          batch_id: batch.id,
          row_number: i + 2,
          message: "Missing required fields",
          email: rowData.email,
          student_number: rowData.student_number,
          created_at: new Date().toISOString(),
        })
        continue
      }

      // Check for duplicates
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("student_number", rowData.student_number)
        .maybeSingle()
      if (existingProfile) {
        errorCount++
        await supabaseAdmin.from("import_errors").insert({
          batch_id: batch.id,
          row_number: i + 2,
          message: `Student number ${rowData.student_number} already exists`,
          email: rowData.email,
          student_number: rowData.student_number,
          created_at: new Date().toISOString(),
        })
        continue
      }

      // Create user
      const defaultPassword = rowData.student_number
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: rowData.email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: rowData.full_name,
          display_name: rowData.display_name || rowData.full_name,
          student_number: rowData.student_number,
        },
      })
      if (authError) {
        errorCount++
        await supabaseAdmin.from("import_errors").insert({
          batch_id: batch.id,
          row_number: i + 2,
          message: authError.message,
          email: rowData.email,
          student_number: rowData.student_number,
          created_at: new Date().toISOString(),
        })
        continue
      }

      // Create profile
      const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
        id: authData.user.id,
        email: rowData.email,
        student_number: rowData.student_number,
        full_name: rowData.full_name,
        display_name: rowData.display_name || rowData.full_name,
        role: rowData.role,
        status: "active",
        profile_status: "approved",
        year_level: rowData.year_level,
        course_or_strand: rowData.course_or_strand,
        section: rowData.section,
        bio: rowData.bio,
        quote: rowData.quote,
        is_public: true,
        resume_public: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })

      if (profileError) {
        errorCount++
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        await supabaseAdmin.from("import_errors").insert({
          batch_id: batch.id,
          row_number: i + 2,
          message: profileError.message,
          email: rowData.email,
          student_number: rowData.student_number,
          created_at: new Date().toISOString(),
        })
        continue
      }

      successCount++
    }

    const finalStatus = errorCount > 0 ? "completed_with_errors" : "completed"
    await supabaseAdmin.from("import_batches").update({
      status: finalStatus,
      success_count: successCount,
      failed_count: errorCount,
    }).eq("id", batch.id)

    json(res, 200, {
      message: finalStatus === "completed_with_errors" ? "Import completed with errors" : "Import completed",
      batchId: batch.id,
      status: finalStatus,
      totalRows: rows.length,
      successCount,
      errorCount,
    })
  } catch (error) {
    json(res, 500, { message: error.message || "Import failed" })
  }
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
  await ensureAvatarBucket()
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    let pathname = url.pathname.replace(/\/+$/, "") || "/"
    if (!pathname.startsWith("/api")) pathname = "/api" + pathname

    // Handle multipart form data for resume photo upload
    const isResumePhotoUpload = pathname.match(/^\/api\/my\/resumes\/[^/]+\/photo$/) && req.method === "POST"
    if (isResumePhotoUpload) {
      req.body = await new Promise((resolve, reject) => {
        const chunks = []
        req.on("data", (chunk) => chunks.push(chunk))
        req.on("end", () => resolve(Buffer.concat(chunks)))
        req.on("error", reject)
      })
      return handleUploadResumePhoto(req, res)
    }

    // Handle multipart form data for avatar upload
    const isAvatarUpload = pathname === "/api/profiles/me/avatar" && req.method === "POST"
    if (isAvatarUpload) {
      const contentType = req.headers["content-type"] || ""
      const boundaryMatch = contentType.match(/boundary=(.+)/)
      if (boundaryMatch) {
        req.body = await new Promise((resolve) => {
          const chunks = []
          req.on("data", (chunk) => chunks.push(chunk))
          req.on("end", () => resolve(Buffer.concat(chunks)))
        })
      }
      return handleUploadAvatar(req, res)
    }

    // Handle multipart form data for import
    const isImport = pathname === "/api/admin/import/users" && req.method === "POST"
    if (isImport) {
      const contentType = req.headers["content-type"] || ""
      const boundaryMatch = contentType.match(/boundary=(.+)/)
      if (!boundaryMatch) {
        return json(res, 400, { message: "No file uploaded or invalid multipart data" })
      }
      req.body = await new Promise((resolve, reject) => {
        const chunks = []
        req.on("data", (chunk) => chunks.push(chunk))
        req.on("end", () => resolve(Buffer.concat(chunks)))
        req.on("error", reject)
      })
      return handleImportUsers(req, res)
    }

    req.body = await parseBody(req)
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

  if (pathname === "/api/admin/resumes/stats" && req.method === "GET") return handleGetResumeStats(req, res)
  if (pathname === "/api/admin/resumes" && req.method === "GET") return handleGetResumes(req, res)
  if (pathname.startsWith("/api/admin/resumes/") && req.method === "GET") return handleGetResume(req, res)
  if (pathname.startsWith("/api/admin/resumes/") && req.method === "PATCH") return handleUpdateResume(req, res)
  if (pathname.startsWith("/api/admin/resumes/") && req.method === "DELETE") return handleDeleteResume(req, res)

  if (pathname === "/api/resume-templates" && req.method === "GET") return handleGetPublicTemplates(req, res)
  if (pathname.startsWith("/api/resume-templates/") && req.method === "GET") return handleGetPublicTemplateDetail(req, res)
  if (pathname === "/api/my/resumes" && req.method === "GET") return handleGetMyResumes(req, res)
  if (pathname === "/api/my/resumes" && req.method === "POST") return handleCreateMyResume(req, res)
  if (pathname.match(/^\/api\/my\/resumes\/[^/]+\/photo$/) && req.method === "POST") return handleUploadResumePhoto(req, res)
  if (pathname.startsWith("/api/my/resumes/") && req.method === "GET") return handleGetMyResume(req, res)
  if (pathname.startsWith("/api/my/resumes/") && req.method === "PATCH") return handleUpdateMyResume(req, res)
  if (pathname.startsWith("/api/my/resumes/") && req.method === "DELETE") return handleDeleteMyResume(req, res)

  if (pathname === "/api/profiles/me" && req.method === "GET") return handleGetMyProfile(req, res)
  if (pathname === "/api/profiles/me" && req.method === "PATCH") return handleUpdateMyProfile(req, res)
  if (pathname === "/api/profiles/submit" && req.method === "POST") return handleSubmitProfile(req, res)
  if (pathname === "/api/profiles/me/avatar/history" && req.method === "GET") return handleGetAvatarHistory(req, res)
  if (pathname === "/api/profiles/me/qrcode/generate" && req.method === "POST") return handleGenerateQrCode(req, res)

  if (pathname === "/api/admin/import/batches" && req.method === "GET") return handleGetBatches(req, res)
  if (pathname.match(/\/api\/admin\/import\/batches\/[^/]+\/errors$/) && req.method === "GET") return handleGetBatchErrors(req, res)
  if (pathname.startsWith("/api/admin/import/batches/") && req.method === "GET") return handleGetBatch(req, res)

  json(res, 404, { message: "Not found", pathname })
  } catch (err) {
    json(res, 500, { message: err.message || "Server error" })
  }
}