import { supabaseAdmin } from "../config/supabase.js"

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" })
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      return res.status(401).json({ message: "Invalid or expired token" })
    }

    // Fetch profile to get role and status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, status")
      .eq("id", authData.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return res.status(401).json({ message: "User profile not found" })
    }

    if (profile.status !== "active") {
      return res.status(403).json({ message: "Account is inactive" })
    }

    req.user = {
      ...authData.user,
      id: profile.id,
      role: profile.role,
    }
    next()
  } catch (error) {
    next(error)
  }
}

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" })
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !authData?.user) {
      return res.status(401).json({ message: "Invalid or expired token" })
    }

    req.user = authData.user

    // Fetch profile to get admin status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, status")
      .eq("id", authData.user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return res.status(401).json({ message: "User profile not found" })
    }

    if (profile.role !== "admin" || profile.status !== "active") {
      return res.status(403).json({ message: "Admin access required" })
    }

    req.user.id = profile.id
    next()
  } catch (error) {
    next(error)
  }
}
