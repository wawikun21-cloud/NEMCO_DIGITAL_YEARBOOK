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

export async function getAuditLogs({ page = 1, perPage = 25, action, entityType, userId, search, dateFrom, dateTo } = {}) {
  const authHeaders = await getAuthHeaders()

  const params = new URLSearchParams()
  params.set("page", page)
  params.set("perPage", perPage)
  if (action) params.set("action", action)
  if (entityType) params.set("entityType", entityType)
  if (userId) params.set("userId", userId)
  if (search) params.set("search", search)
  if (dateFrom) params.set("dateFrom", dateFrom)
  if (dateTo) params.set("dateTo", dateTo)

  const response = await fetch(`${API_BASE_URL}/admin/logs?${params}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch audit logs")
  }

  return data
}

export async function getAuditLogDetail(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/logs/${id}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch audit log detail")
  }

  return data.log
}

export async function getAuditLogFilters() {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/logs/filters`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch audit log filters")
  }

  return data
}
