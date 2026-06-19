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

export async function getResumes({
  page = 1,
  perPage = 25,
  template,
  isPublic,
  search,
  dateFrom,
  dateTo,
} = {}) {
  const authHeaders = await getAuthHeaders()

  const params = new URLSearchParams()
  params.set("page", page)
  params.set("perPage", perPage)
  if (template) params.set("template", template)
  if (isPublic !== undefined && isPublic !== null) params.set("isPublic", isPublic)
  if (search) params.set("search", search)
  if (dateFrom) params.set("dateFrom", dateFrom)
  if (dateTo) params.set("dateTo", dateTo)

  const response = await fetch(`${API_BASE_URL}/admin/resumes?${params}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch resumes")
  }

  return data
}

export async function getResumeDetail(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/resumes/${id}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch resume detail")
  }

  return data.resume
}

export async function updateResume(id, { title, isPublic }) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/resumes/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title, isPublic }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to update resume")
  }

  return data.resume
}

export async function deleteResume(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/resumes/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete resume")
  }

  return true
}

export async function getResumeStats() {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/resumes/stats`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch resume stats")
  }

  return data
}
