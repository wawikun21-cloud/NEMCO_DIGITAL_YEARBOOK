import { createClient } from "@supabase/supabase-js"
import { z } from "zod"
import { getAuditLogs, getAuditLogById, getAuditLogFilters } from "../server/src/services/auditLogService.js"

const loginSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  password: z.string().min(1, "Password is required"),
})

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
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

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

  if (!token) {
    json(res, 401, { message: "Authorization token required" })
    return null
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

  if (authError || !authData?.user) {
    json(res, 401, { message: "Invalid or expired token" })
    return null
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, role, status")
    .eq("id", authData.user.id)
    .maybeSingle()

  if (profileError || !profile) {
    json(res, 401, { message: "User profile not found" })
    return null
  }

  if (profile.role !== "admin" || profile.status !== "active") {
    json(res, 403, { message: "Admin access required" })
    return null
  }

  return { ...authData.user, id: profile.id }
}

async function parseBody(req) {
  return new Promise((resolve, reject) => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      resolve({})
      return
    }
    const chunks = []
    req.on("data", (chunk) => chunks.push(chunk))
    req.on("end", () => {
      if (chunks.length === 0) {
        resolve({})
        return
      }
      const raw = Buffer.concat(chunks).toString("utf8")
      try {
        resolve(JSON.parse(raw))
      } catch {
        resolve({})
      }
    })
    req.on("error", reject)
  })
}

async function handleHealth(req, res) {
  json(res, 200, { status: "ok", service: "digital-year-book-api" })
}

async function handleLogin(req, res) {
  try {
    const body = loginSchema.parse(req.body)
    const identifier = body.studentId.trim()

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,email,role,status,student_number")
      .ilike("student_number", identifier)
      .maybeSingle()

    if (profileError) {
      return json(res, 500, { message: "Unable to find your account" })
    }
    if (!profile) {
      return json(res, 404, { message: "No account found for this Student ID" })
    }
    if (profile.status !== "active") {
      return json(res, 403, { message: "This account is inactive. Please contact an administrator" })
    }
    if (!["admin", "user"].includes(profile.role)) {
      return json(res, 403, { message: "This account does not have a valid role" })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.email,
      password: body.password,
    })

    if (authError) {
      return json(res, 401, { message: "Invalid Student ID or password" })
    }

    const { data: publicProfile } = await supabaseAdmin
      .from("profiles")
      .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,avatar_url,is_public,resume_public")
      .eq("id", profile.id)
      .maybeSingle()

    json(res, 200, {
      message: "Login successful",
      user: authData.user,
      session: authData.session,
      profile: publicProfile,
    })
  } catch (error) {
    if (error.name === "ZodError") {
      return json(res, 400, { message: error.errors[0]?.message || "Invalid request body" })
    }
    console.error("[LOGIN ERROR]", error.message, error.stack)
    json(res, 500, { message: "Internal server error" })
  }
}

async function handleListLogs(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return

  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const page = parseInt(url.searchParams.get("page") || "1", 10)
    const perPage = parseInt(url.searchParams.get("perPage") || "25", 10)
    const action = url.searchParams.get("action") || null
    const entityType = url.searchParams.get("entityType") || null
    const userId = url.searchParams.get("userId") || null
    const search = url.searchParams.get("search") || null
    const dateFrom = url.searchParams.get("dateFrom") || null
    const dateTo = url.searchParams.get("dateTo") || null

    const result = await getAuditLogs({ page, perPage, action, entityType, userId, search, dateFrom, dateTo })
    json(res, 200, result)
  } catch (error) {
    console.error("[LIST LOGS ERROR]", error.message)
    json(res, 500, { message: "Failed to fetch audit logs" })
  }
}

async function handleGetLog(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return

  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    const id = url.pathname.split("/").pop()
    const log = await getAuditLogById(id)

    if (!log) {
      return json(res, 404, { message: "Audit log not found" })
    }

    json(res, 200, { log })
  } catch (error) {
    console.error("[GET LOG ERROR]", error.message)
    json(res, 500, { message: "Failed to fetch audit log" })
  }
}

async function handleGetFilters(req, res) {
  const user = await requireAuth(req, res)
  if (!user) return

  try {
    const filters = await getAuditLogFilters()
    json(res, 200, filters)
  } catch (error) {
    console.error("[GET FILTERS ERROR]", error.message)
    json(res, 500, { message: "Failed to fetch audit log filters" })
  }
}

export default async function handler(req, res) {
  setCorsHeaders(req, res)

  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }

  req.body = await parseBody(req)

  const url = new URL(req.url, `http://${req.headers.host}`)
  let pathname = url.pathname.replace(/\/+$/, "") || "/"

  if (!pathname.startsWith("/api")) {
    pathname = "/api" + pathname
  }

  if (pathname === "/api/health") {
    return handleHealth(req, res)
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    return handleLogin(req, res)
  }

  if (pathname === "/api/admin/logs" && req.method === "GET") {
    return handleListLogs(req, res)
  }

  if (pathname === "/api/admin/logs/filters" && req.method === "GET") {
    return handleGetFilters(req, res)
  }

  if (pathname.startsWith("/api/admin/logs/") && req.method === "GET") {
    return handleGetLog(req, res)
  }

  json(res, 404, { message: "Not found", pathname })
}
