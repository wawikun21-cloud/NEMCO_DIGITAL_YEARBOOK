import { supabase } from "@/lib/supabaseClient"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

export async function loginWithBackend({ studentId, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentId, password }),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server error (${response.status}). Please try again later.`)
  }

  if (!response.ok) {
    throw new Error(data.message || "Login failed")
  }

  /*
    FIX: The old code saved the session to sessionStorage but never told
    Supabase about it. So supabase.auth.getSession() always returned null,
    AuthProvider saw no user, and App.jsx kept showing the login page.

    We now call supabase.auth.setSession() with the tokens the backend
    returned. Supabase will persist them in its own storage (localStorage
    by default) and handle token refresh automatically.
  */
  if (data.session) {
    // Try to set the session, but don't fail if it doesn't work
    // (e.g., token created with service_role key is incompatible with anon client)
    try {
      await supabase.auth.setSession(data.session)
    } catch {
      // Silently ignore - we'll use sessionStorage for auth state
    }
  }

  // Store user, profile, and session tokens in sessionStorage for AuthProvider
  if (data.user && data.profile) {
    sessionStorage.setItem("digitalYearbookUser", JSON.stringify(data.user))
    sessionStorage.setItem("digitalYearbookProfile", JSON.stringify(data.profile))
    if (data.session?.access_token) {
      sessionStorage.setItem("digitalYearbookAccessToken", data.session.access_token)
    }
  }

  return data
}

// Kept for any legacy callers — but AuthProvider no longer uses these
export function getStoredUser() {
  const stored = sessionStorage.getItem("digitalYearbookUser")
  return stored ? JSON.parse(stored) : null
}

export function getStoredProfile() {
  const stored = sessionStorage.getItem("digitalYearbookProfile")
  return stored ? JSON.parse(stored) : null
}

export function clearStoredAuth() {
  sessionStorage.removeItem("digitalYearbookUser")
  sessionStorage.removeItem("digitalYearbookProfile")
  sessionStorage.removeItem("digitalYearbookSession")
  sessionStorage.removeItem("digitalYearbookAccessToken")
}