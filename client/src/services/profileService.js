import { supabase } from "@/lib/supabaseClient"
import { getStoredProfile, getStoredUser } from "@/services/authService"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

async function getAuthHeaders(isJson = true) {
  const { data: supabaseData } = await supabase.auth.getSession()
  const accessToken = supabaseData?.session?.access_token || sessionStorage.getItem("digitalYearbookAccessToken")

  if (!accessToken) {
    throw new Error("You must be logged in to perform this action.")
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  }

  if (isJson) {
    headers["Content-Type"] = "application/json"
  }

  return headers
}

export async function uploadAvatar(file) {
  let authHeaders
  let hasAuth = false

  try {
    authHeaders = await getAuthHeaders(false)
    hasAuth = true
  } catch (error) {
    if (error.message !== "You must be logged in to perform this action.") {
      throw error
    }
  }

  if (!hasAuth) {
    const storedUser = getStoredUser()
    const storedProfile = getStoredProfile() || {}
    const mockAvatarUrl = URL.createObjectURL(file)
    const updatedProfile = { ...storedProfile, avatar_url: mockAvatarUrl }

    if (storedUser) {
      sessionStorage.setItem("digitalYearbookProfile", JSON.stringify(updatedProfile))
    }
    return { profile: updatedProfile, avatarUrl: mockAvatarUrl }
  }

  const formData = new FormData()
  formData.append("avatar", file)

  const response = await fetch(`${API_BASE_URL}/profiles/me/avatar`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))

    if (response.status === 429) {
      throw new Error(data.message || "Rate limit exceeded. Please try again later.")
    }

    throw new Error(data.message || "Failed to upload avatar")
  }

  const data = await response.json()
  return data
}

export async function getAvatarHistory(page = 1, perPage = 25) {
  try {
    const authHeaders = await getAuthHeaders()

    const response = await fetch(
      `${API_BASE_URL}/profiles/me/avatar/history?page=${page}&perPage=${perPage}`,
      {
        method: "GET",
        headers: authHeaders,
      }
    )

    if (!response.ok) {
      throw new Error("Failed to fetch avatar history")
    }

    return response.json()
  } catch (error) {
    if (error.message === "You must be logged in to perform this action.") {
      throw error
    }
    return { uploads: [], total: 0, page, perPage }
  }
}

export async function getMyProfile() {
  let authHeaders
  try {
    authHeaders = await getAuthHeaders()
  } catch {
    const stored = getStoredProfile()
    if (stored) return stored
    throw new Error("You must be logged in to perform this action.")
  }

  try {
    const response = await fetch(`${API_BASE_URL}/profiles/me`, {
      method: "GET",
      headers: authHeaders,
    })

    if (!response.ok) {
      const stored = getStoredProfile()
      if (stored) return stored
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || "Failed to fetch profile")
    }

    const data = await response.json()
    return data.profile
  } catch (error) {
    const stored = getStoredProfile()
    if (stored) return stored
    throw error instanceof Error ? error : new Error("Failed to fetch profile")
  }
}

export async function updateMyProfile(profileData) {
  try {
    const authHeaders = await getAuthHeaders()

    const response = await fetch(`${API_BASE_URL}/profiles/me`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify(profileData),
    })

    if (!response.ok) {
      throw new Error((await response.json().catch(() => ({}))).message || "Failed to update profile")
    }

    const data = await response.json()
    return data.profile
  } catch {
    const storedUser = getStoredUser()
    const storedProfile = getStoredProfile() || {}
    const updatedProfile = { ...storedProfile, ...profileData }

    if (storedUser) {
      sessionStorage.setItem("digitalYearbookProfile", JSON.stringify(updatedProfile))
    }
    return updatedProfile
  }
}

export async function submitMyProfile() {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/profiles/submit`, {
    method: "POST",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit profile")
  }

  return data.profile
}