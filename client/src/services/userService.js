import { supabase } from "@/lib/supabaseClient"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

async function getAuthHeaders() {
  const { data: supabaseData } = await supabase.auth.getSession()
  const accessToken = supabaseData?.session?.access_token || sessionStorage.getItem("digitalYearbookAccessToken")

  if (!accessToken) {
    throw new Error("You must be logged in to perform this action.")
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }
}

export async function getUsers(filters = {}) {
  let authHeaders
  let hasAuth = false

  try {
    authHeaders = await getAuthHeaders()
    hasAuth = true
  } catch (error) {
    if (error.message !== "You must be logged in to perform this action.") {
      throw error
    }
  }

  if (!hasAuth) {
    const storedUsers = sessionStorage.getItem("digitalYearbookUsers")
    if (storedUsers) {
      return JSON.parse(storedUsers)
    }
    const storedProfile = sessionStorage.getItem("digitalYearbookProfile")
    const profile = storedProfile ? JSON.parse(storedProfile) : null
    return profile ? [profile] : []
  }

  const searchParams = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== "all") {
      searchParams.append(key, value)
    }
  })

  const response = await fetch(`${API_BASE_URL}/admin/users?${searchParams.toString()}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users")
  }

  return data.users
}

export async function getUser(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user")
  }

  return data.user
}

export async function createUser(userData) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/users`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify(userData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || "Failed to create user")
  }

  return data.user
}

export async function updateUser(id, userData) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify(userData),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to update user")
  }

  return data.user
}

export async function deleteUser(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete user")
  }

  return data
}

export async function resetPassword(id, redirectTo) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ redirectTo }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to reset password")
  }

  return data
}