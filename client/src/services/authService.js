import { supabase } from "@/lib/supabaseClient"

export { supabase }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

export const FORCE_LOGOUT_EVENT = "force-logout"

export function emitForceLogout(reason) {
  window.dispatchEvent(new CustomEvent(FORCE_LOGOUT_EVENT, { detail: { reason } }))
}

let authStateSubscription = null

export function startAuthStateListener() {
  if (authStateSubscription) return
  const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      emitForceLogout("signed-out")
    }
  })
  authStateSubscription = subscription
}

export function stopAuthStateListener() {
  if (authStateSubscription) {
    authStateSubscription.data?.subscription?.unsubscribe?.()
    authStateSubscription = null
  }
}

function normalizeAvatarUrl(url) {
  if (!url) return ""
  try {
    const parsed = new URL(url)
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : ""
  } catch {
    return ""
  }
}

function normalizeSocialLink(value) {
  if (!value) return ""
  try {
    const trimmed = String(value).trim()
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`)
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href.slice(0, 200) : ""
  } catch {
    return ""
  }
}

function normalizeProfile(profile) {
  if (!profile) return profile
  return {
    ...profile,
    avatar_url: normalizeAvatarUrl(profile.avatar_url),
    social_link1: normalizeSocialLink(profile.social_link1),
    social_link2: normalizeSocialLink(profile.social_link2),
    social_link3: normalizeSocialLink(profile.social_link3),
  }
}

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

  if (data.session) {
    try {
      await supabase.auth.setSession(data.session)
    } catch {
    }
  }

  if (data.user && data.profile) {
    sessionStorage.setItem("digitalYearbookUser", JSON.stringify(data.user))
    sessionStorage.setItem("digitalYearbookProfile", JSON.stringify(normalizeProfile(data.profile)))
    if (data.session?.access_token) {
      sessionStorage.setItem("digitalYearbookAccessToken", data.session.access_token)
    }
  }

  return data
}

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

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`
  const response = await fetch(url, options)
  if (response.status === 401) {
    emitForceLogout("unauthorized")
  }
  return response
}

export async function changePassword(currentPassword, newPassword) {
  const { data: supabaseData } = await supabase.auth.getSession()
  const accessToken = supabaseData?.session?.access_token || sessionStorage.getItem("digitalYearbookAccessToken")

  if (!accessToken) {
    throw new Error("You must be logged in to perform this action.")
  }

  const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword: newPassword }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to change password")
  }

  return data
}
