const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
const normalizedApiBaseUrl = API_BASE_URL.replace(/\/+$/, "")
const profileApiBaseUrl = normalizedApiBaseUrl.endsWith("/profiles")
  ? normalizedApiBaseUrl
  : `${normalizedApiBaseUrl}/profiles`

function profileUrl(path) {
  return `${profileApiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

function getAuthHeaders(extra = {}) {
  const token = sessionStorage.getItem("digitalYearbookAccessToken")
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function parseResponse(response) {
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server error (${response.status}). Please try again later.`)
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed")
  }

  return normalizeResponseData(data)
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
  const trimmed = String(value).trim()
  if (!trimmed) return ""
  try {
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

function normalizeResponseData(data) {
  if (data?.profile) {
    return { ...data, profile: normalizeProfile(data.profile) }
  }
  return data
}

export async function getMyProfile() {
  const response = await fetch(profileUrl("me"), {
    method: "GET",
    headers: getAuthHeaders(),
  })
  const data = await parseResponse(response)
  return data.profile
}

export async function getPublicProfile(identifier) {
  const response = await fetch(profileUrl(`public/${encodeURIComponent(identifier)}`), {
    method: "GET",
  })
  const data = await parseResponse(response)
  return data.profile
}

export async function updateMyProfile(payload) {
  const response = await fetch(profileUrl("me"), {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  })
  const data = await parseResponse(response)
  return data.profile
}

export async function uploadAvatar(file) {
  const formData = new FormData()
  formData.append("avatar", file)

  const response = await fetch(profileUrl("me/avatar"), {
    method: "POST",
    headers: getAuthHeaders(), // no Content-Type — browser sets multipart boundary
    body: formData,
  })
  return parseResponse(response)
}

export async function getAvatarHistory(page = 1, perPage = 25) {
  const response = await fetch(
    profileUrl(`me/avatar/history?page=${page}&perPage=${perPage}`),
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  )
  return parseResponse(response)
}

export async function submitProfile() {
  const response = await fetch(profileUrl("submit"), {
    method: "POST",
    headers: getAuthHeaders(),
  })
  const data = await parseResponse(response)
  return data.profile
}

// Triggers first-time QR generation, or a manual refresh of an existing one.
export async function generateProfileQrCode() {
  const response = await fetch(profileUrl("me/qrcode/generate"), {
    method: "POST",
    headers: getAuthHeaders(),
  })
  const data = await parseResponse(response)
  return data.profile
}