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
  console.log("[AUTH] requireAuth called, has token:", !!token)

  if (!token) {
    return res.status(401).json({ message: "Authorization token required" })
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
    console.log("[AUTH] getUser result:", authError ? authError.message : "success")

    if (authError || !authData?.user) {
      return res.status(401).json({ message: "Invalid or expired token" })
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, status")
      .eq("id", authData.user.id)
      .maybeSingle()

    console.log("[AUTH] profile lookup:", profileError ? profileError.message : (profile ? `role=${profile.role} status=${profile.status}` : "not found"))

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
    console.error("[AUTH] Error:", error.message)
    next(error)
  }
}

export async function requireAdmin(req, res, next) {
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

    if (profile.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" })
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
