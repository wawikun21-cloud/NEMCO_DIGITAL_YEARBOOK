import { supabase } from "@/lib/supabaseClient"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

// ─── Helper: get the current access token and build auth headers ──────────────
async function getAuthHeaders() {
  // Try Supabase session first, fallback to stored token
  const { data: supabaseData } = await supabase.auth.getSession()
  const accessToken = supabaseData?.session?.access_token || sessionStorage.getItem("digitalYearbookAccessToken")

  if (!accessToken) {
    throw new Error("You must be logged in to perform this action.")
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

// ─── Upload & import an Excel file ───────────────────────────────────────────
export async function uploadImport(file, sheetName) {
  const authHeaders = await getAuthHeaders()

  const formData = new FormData()
  formData.append("file", file)
  if (sheetName) {
    formData.append("sheetName", sheetName)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}/admin/import/users`, {
      method: "POST",
      headers: authHeaders,   // NOTE: do NOT set Content-Type manually with FormData
      body: formData,
    })
  } catch (networkError) {
    throw new Error(networkError.message || "Network error during import", { cause: networkError })
  }

  let data
  try {
    data = await response.json()
  } catch (parseError) {
    const text = await response.text().catch(() => "")
    throw new Error(`Import failed with status ${response.status}: ${text || "Invalid JSON response"}`, { cause: parseError })
  }

  if (!response.ok) {
    throw new Error(data.message || "Import failed", { cause: data })
  }

  return data
}

// ─── List all import batches ──────────────────────────────────────────────────
export async function getBatches() {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/import/batches`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch batches")
  }

  return data.batches
}

// ─── Get a single batch by ID ─────────────────────────────────────────────────
export async function getBatch(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/import/batches/${id}`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch batch")
  }

  return data.batch
}

// ─── Get errors for a batch ───────────────────────────────────────────────────
export async function getBatchErrors(id) {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/import/batches/${id}/errors`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch errors")
  }

  return data.errors
}