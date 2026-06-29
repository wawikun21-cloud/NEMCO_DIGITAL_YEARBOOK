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

export async function getPublicFlipbook(department = null, batch = null) {
  const params = new URLSearchParams()
  if (department) params.set("department", department)
  if (batch) params.set("batch", batch)

  const response = await fetch(`${API_BASE_URL}/admin/yearbook/flipbook?${params}`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch public flipbook")
  return data
}

export async function getPdfPages(department = null, batch = null) {
  const authHeaders = await getAuthHeaders()
  const params = new URLSearchParams()
  if (department) params.set("department", department)
  if (batch) params.set("batch", batch)

  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages?${params}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch PDF pages")
  return data.pages
}

export async function addPdfPage({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, department, subDepartment, batch }) {
   const authHeaders = await getAuthHeaders()
   const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages`, {
     method: "POST",
     headers: { ...authHeaders, "Content-Type": "application/json" },
     body: JSON.stringify({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, department, subDepartment, batch }),
   })
   const data = await response.json()
   if (!response.ok) throw new Error(data.message || "Failed to add PDF page")
   return data.page
}

export async function updatePdfPage(id, { title, description, sortOrder, isActive, department, subDepartment, batch }) {
   const authHeaders = await getAuthHeaders()
   const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${id}`, {
     method: "PATCH",
     headers: { ...authHeaders, "Content-Type": "application/json" },
     body: JSON.stringify({ title, description, sortOrder, isActive, department, subDepartment, batch }),
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

export async function uploadPdfFile(file, onProgress) {
  const authHeaders = await getAuthHeaders()
  const formData = new FormData()
  formData.append("file", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const timeoutId = setTimeout(() => {
      xhr.abort()
      reject(new Error("Upload timed out. Please check your connection and try again."))
    }, 55000)

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener("load", () => {
      clearTimeout(timeoutId)
      console.log("[UPLOAD] Response status:", xhr.status, "response:", xhr.responseText)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          resolve(data)
        } catch (e) {
          console.error("[UPLOAD] Parse error:", e)
          reject(new Error("Failed to parse server response"))
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          console.error("[UPLOAD] Server error:", errorData)
          reject(new Error(errorData.message || `Upload failed with status ${xhr.status}`))
        } catch {
          console.error("[UPLOAD] Non-JSON error response:", xhr.responseText)
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText || "Unknown error"}`))
        }
      }
    })

    xhr.addEventListener("error", () => {
      clearTimeout(timeoutId)
      reject(new Error("Network error during upload"))
    })

    xhr.addEventListener("abort", () => {
      clearTimeout(timeoutId)
      reject(new Error("Upload was aborted"))
    })

    xhr.open("POST", `${API_BASE_URL}/admin/upload/pdf`)
    Object.entries(authHeaders).forEach(([key, value]) => xhr.setRequestHeader(key, value))
    xhr.send(formData)
  })
}

export async function getYearbookCatalog() {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/catalog`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch yearbook catalog")
  return data
}

export async function searchDepartments(query) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/departments/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to search departments")
  return data.departments
}