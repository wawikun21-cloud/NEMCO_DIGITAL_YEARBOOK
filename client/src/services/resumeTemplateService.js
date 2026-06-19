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

export async function getTemplates({ includeInactive = false } = {}) {
  const authHeaders = await getAuthHeaders()
  const params = new URLSearchParams()
  if (includeInactive) params.set("includeInactive", "true")

  const response = await fetch(`${API_BASE_URL}/admin/resume-templates?${params}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch templates")
  return data.templates
}

export async function getTemplateDetail(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates/${id}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch template")
  return data
}

export async function createTemplate({ name, slug, description, thumbnail_url, default_sections, is_active, sort_order }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ name, slug, description, thumbnail_url, default_sections, is_active, sort_order }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to create template")
  return data.template
}

export async function updateTemplate(id, updates) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to update template")
  return data.template
}

export async function deleteTemplate(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to delete template")
  return true
}

export async function getTemplateSections(templateId) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates/${templateId}/sections`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch sections")
  return data.sections
}

export async function addTemplateSection(templateId, { section_key, label, description, icon, field_type, is_required, sort_order, config }) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates/${templateId}/sections`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ section_key, label, description, icon, field_type, is_required, sort_order, config }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to add section")
  return data.section
}

export async function updateTemplateSection(id, updates) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-sections/${id}`, {
    method: "PATCH",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to update section")
  return data.section
}

export async function deleteTemplateSection(id) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-sections/${id}`, {
    method: "DELETE",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to delete section")
  return true
}

export async function reorderTemplateSections(templateId, orderedIds) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/resume-templates/${templateId}/sections/reorder`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to reorder sections")
  return true
}
