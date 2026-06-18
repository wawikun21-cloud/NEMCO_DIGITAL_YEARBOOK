import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

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
  res.status(status).setHeader("Content-Type", "application/json").end(JSON.stringify(body))
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

export default async function handler(req, res) {
  const origin = req.headers.origin || ""
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)

  if (origin && allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin)
    res.setHeader("Access-Control-Allow-Credentials", "true")
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization")
  }

  if (req.method === "OPTIONS") {
    return res.status(204).end()
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  if (pathname === "/api/health") {
    return handleHealth(req, res)
  }

  if (pathname === "/api/auth/login" && req.method === "POST") {
    return handleLogin(req, res)
  }

  json(res, 404, { message: "Not found" })
}
