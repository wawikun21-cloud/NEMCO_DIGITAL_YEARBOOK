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
  }
}

export async function getFlipbookSettings() {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/settings`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch flipbook settings")
  return data
}

export async function updateFlipbookSettings(updates) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/settings`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to update flipbook settings")
  return data
}

export async function getFlipbookProfiles({ page = 1, perPage = 25, section, search } = {}) {
  const authHeaders = await getAuthHeaders()
  const params = new URLSearchParams()
  params.set("page", page)
  params.set("perPage", perPage)
  if (section) params.set("section", section)
  if (search) params.set("search", search)

  const response = await fetch(`${API_BASE_URL}/admin/yearbook/profiles?${params}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch flipbook profiles")
  return data
}

export async function getApprovedProfiles() {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/approved-profiles`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch approved profiles")
  return data.profiles
}

export async function addProfileToFlipbook(profileId, { sectionName, layoutTemplate }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/profiles`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, sectionName, layoutTemplate }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to add profile to flipbook")
  return data.profile
}

export async function updateFlipbookProfile(id, updates) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/profiles/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to update flipbook profile")
  return data.profile
}

export async function removeProfileFromFlipbook(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/profiles/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to remove profile from flipbook")
  return true
}

export async function reorderFlipbookProfiles(orderedIds) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/reorder`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to reorder flipbook")
  return true
}

export async function getFlipbookSections() {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/sections`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch sections")
  return data.sections
}

export async function addFlipbookSection(name) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/sections`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to add section")
  return data.section
}

export async function removeFlipbookSection(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/sections/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to delete section")
  return true
}

export async function getPublicFlipbook() {
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/flipbook`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch public flipbook")
  return data
}

export async function getPdfPages() {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch PDF pages")
  return data.pages
}

export async function addPdfPage({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to add PDF page")
  return data.page
}

export async function updatePdfPage(id, { title, description, sortOrder, isActive }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title, description, sortOrder, isActive }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to update PDF page")
  return data.page
}

export async function removePdfPage(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to delete PDF page")
  return true
}

export async function reorderPdfPages(orderedIds) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/reorder`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to reorder PDF pages")
  return true
}

export async function uploadPdfFile(file) {
  const authHeaders = await getAuthHeaders()
  const formData = new FormData()
  formData.append("file", file)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000)

  try {
    const response = await fetch(`${API_BASE_URL}/admin/upload/pdf`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Failed to upload PDF file")
    return data
  } catch (error) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Upload timed out. Please try again with a smaller file.")
    }
    throw error
  }
}
