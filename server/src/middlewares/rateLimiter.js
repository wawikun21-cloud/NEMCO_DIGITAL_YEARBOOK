import { supabaseAdmin } from "../config/supabase.js"

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

export async function avatarRateLimit(req, res, next) {
  const userId = req.user?.id
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)

  const { data: recentUploads, error } = await supabaseAdmin
    .from("avatar_uploads")
    .select("id", { count: "exact" })
    .eq("user_id", userId)
    .gte("created_at", windowStart.toISOString())

  if (error) {
    console.error("[RATE LIMIT ERROR]", error.message)
  }

  const uploadCount = recentUploads?.length || 0

  if (uploadCount >= RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil(RATE_LIMIT_WINDOW_MS / 1000 / 60)
    return res.status(429).json({
      message: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} uploads per 15 minutes.`,
      retryAfter: retryAfter,
    })
  }

  next()
}