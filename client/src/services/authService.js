const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

export async function loginWithBackend({ studentId, password }) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ studentId, password }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Login failed")
  }

  sessionStorage.setItem("digitalYearbookUser", JSON.stringify(data.user))
  sessionStorage.setItem("digitalYearbookProfile", JSON.stringify(data.profile))
  sessionStorage.setItem("digitalYearbookSession", JSON.stringify(data.session))

  return data
}

export function getStoredUser() {
  const storedUser = sessionStorage.getItem("digitalYearbookUser")
  return storedUser ? JSON.parse(storedUser) : null
}

export function getStoredProfile() {
  const storedProfile = sessionStorage.getItem("digitalYearbookProfile")
  return storedProfile ? JSON.parse(storedProfile) : null
}

export function clearStoredAuth() {
  sessionStorage.removeItem("digitalYearbookUser")
  sessionStorage.removeItem("digitalYearbookProfile")
  sessionStorage.removeItem("digitalYearbookSession")
}
