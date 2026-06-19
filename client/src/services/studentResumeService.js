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

export async function getMyResumes() {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/my/resumes`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch resumes")
  return data.resumes
}

export async function getMyResumeDetail(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/my/resumes/${id}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch resume")
  return data.resume
}

export async function createMyResume({ title, template, data }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/my/resumes`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title, template, data }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || "Failed to create resume")
  return result.resume
}

export async function updateMyResume(id, { title, data, isPublic, template }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/my/resumes/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ title, data, isPublic, template }),
  })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message || "Failed to update resume")
  return result.resume
}

export async function deleteMyResume(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/my/resumes/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to delete resume")
  return true
}

export async function getPublicTemplates() {
  const response = await fetch(`${API_BASE_URL}/resume-templates`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch templates")
  return data.templates
}

export async function getPublicTemplateDetail(slug) {
  const response = await fetch(`${API_BASE_URL}/resume-templates/${slug}`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch template")
  return data
}
