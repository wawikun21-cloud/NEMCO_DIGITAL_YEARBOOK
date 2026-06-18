import express from "express"
import cors from "cors"
import helmet from "helmet"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const app = express()

app.disable("x-powered-by")
app.use(helmet({ contentSecurityPolicy: false }))

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error("CORS origin not allowed"))
  },
  credentials: true,
}))
app.use(express.json({ limit: "1mb" }))

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
}

const supabaseAdmin = createClient(supabaseUrl || "", supabaseServiceRoleKey || "", {
  auth: { autoRefreshToken: false, persistSession: false },
})

const loginSchema = z.object({
  studentId: z.string().trim().min(1, "Student ID is required"),
  password: z.string().min(1, "Password is required"),
})

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "digital-year-book-api" })
})

app.post("/api/auth/login", async (req, res) => {
  try {
    const body = loginSchema.parse(req.body)
    const identifier = body.studentId.trim()

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id,email,role,status,student_number")
      .ilike("student_number", identifier)
      .maybeSingle()

    if (profileError) {
      return res.status(500).json({ message: "Unable to find your account" })
    }
    if (!profile) {
      return res.status(404).json({ message: "No account found for this Student ID" })
    }
    if (profile.status !== "active") {
      return res.status(403).json({ message: "This account is inactive. Please contact an administrator" })
    }
    if (!["admin", "user"].includes(profile.role)) {
      return res.status(403).json({ message: "This account does not have a valid role" })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.email,
      password: body.password,
    })

    if (authError) {
      return res.status(401).json({ message: "Invalid Student ID or password" })
    }

    const { data: publicProfile } = await supabaseAdmin
      .from("profiles")
      .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,avatar_url,is_public,resume_public")
      .eq("id", profile.id)
      .maybeSingle()

    res.json({
      message: "Login successful",
      user: authData.user,
      session: authData.session,
      profile: publicProfile,
    })
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.errors[0]?.message || "Invalid request body" })
    }
    console.error("[ERROR]", error.message, error.stack)
    res.status(500).json({ message: "Internal server error" })
  }
})

export default app
