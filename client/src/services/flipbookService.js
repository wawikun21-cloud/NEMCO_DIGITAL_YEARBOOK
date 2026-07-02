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
  if (department && batch) params.set("batch", batch)

  const response = await fetch(`${API_BASE_URL}/admin/yearbook/flipbook?${params}`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch public flipbook")
  return data
}

export async function getPdfPages(department = null, batch = null, edition = null) {
  const authHeaders = await getAuthHeaders()
  const params = new URLSearchParams()
  if (department) params.set("department", department)
  if (batch) params.set("batch", batch)
  if (edition) params.set("edition", edition)

  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages?${params}`, {
    method: "GET",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch PDF pages")
  return data.pages
}

export async function addPdfPage({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, department, subDepartment, batch, edition }) {
   const authHeaders = await getAuthHeaders()
   const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages`, {
     method: "POST",
     headers: { ...authHeaders, "Content-Type": "application/json" },
     body: JSON.stringify({ title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, department, subDepartment, batch, edition }),
   })
   const data = await response.json()
   if (!response.ok) throw new Error(data.message || "Failed to add PDF page")
   return data.page
}

export async function updatePdfPage(id, { title, description, sortOrder, isActive, department, subDepartment, batch, edition }) {
   const authHeaders = await getAuthHeaders()
   const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${id}`, {
     method: "PATCH",
     headers: { ...authHeaders, "Content-Type": "application/json" },
     body: JSON.stringify({ title, description, sortOrder, isActive, department, subDepartment, batch, edition }),
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

async function getPresignedUrl(fileName, fileSize) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/upload/presigned-url`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ fileName, contentType: "application/pdf", fileSize }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to get upload URL")
  return data
}

async function confirmUpload(key, fileName, fileSize) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${API_BASE_URL}/admin/upload/confirm-upload`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ key, fileName, fileSize }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to confirm upload")
  return data
}

function uploadViaServer(file, onProgress) {
  const authHeaders = getAuthHeadersSync()
  const formData = new FormData()
  formData.append("file", file)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      xhr.abort()
    }, 900000)

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener("load", () => {
      clearTimeout(timeoutId)
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          reject(new Error("Failed to parse server response"))
        }
      } else {
        try {
          const err = JSON.parse(xhr.responseText)
          reject(new Error(err.message || `Upload failed (${xhr.status})`))
        } catch {
          reject(new Error(`Upload failed (${xhr.status})`))
        }
      }
    })

    xhr.addEventListener("error", () => {
      clearTimeout(timeoutId)
      reject(new Error(timedOut
        ? "Upload timed out. The file may be too large for your connection."
        : "Network error during upload. Check your connection and try again."))
    })

    xhr.addEventListener("abort", () => {
      clearTimeout(timeoutId)
      reject(new Error(timedOut ? "Upload timed out." : "Upload was cancelled."))
    })

    xhr.open("POST", `${API_BASE_URL}/admin/upload/pdf`)
    Object.entries(authHeaders).forEach(([k, v]) => xhr.setRequestHeader(k, v))
    xhr.send(formData)
  })
}

function getAuthHeadersSync() {
  const accessToken = sessionStorage.getItem("digitalYearbookAccessToken")
  if (!accessToken) throw new Error("You must be logged in to perform this action.")
  return { Authorization: `Bearer ${accessToken}` }
}

export async function uploadPdfFile(file, onProgress) {
  try {
    const presigned = await getPresignedUrl(file.name, file.size)

    const result = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      let timedOut = false
      const timeoutId = setTimeout(() => {
        timedOut = true
        xhr.abort()
      }, 900000)

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100)
          onProgress(percent)
        }
      })

      xhr.addEventListener("load", async () => {
        clearTimeout(timeoutId)
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const confirmed = await confirmUpload(presigned.key, file.name, file.size)
            resolve(confirmed)
          } catch (err) {
            reject(err)
          }
        } else {
          reject(new Error(`Upload to storage failed (${xhr.status})`))
        }
      })

      xhr.addEventListener("error", () => {
        clearTimeout(timeoutId)
        if (timedOut) {
          reject(new Error("Upload timed out. Please try a smaller file or check your connection."))
        } else {
          reject({ _corsFallback: true, message: "Direct upload blocked. Falling back to server upload..." })
        }
      })

      xhr.addEventListener("abort", () => {
        clearTimeout(timeoutId)
        reject(new Error(timedOut ? "Upload timed out." : "Upload was cancelled."))
      })

      xhr.open("PUT", presigned.uploadUrl)
      xhr.setRequestHeader("Content-Type", "application/pdf")
      xhr.send(file)
    })

    return result
  } catch (err) {
    if (err && err._corsFallback) {
      return uploadViaServer(file, onProgress)
    }
    throw err
  }
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

export async function renderPdfImages(pdfId, fileUrl, filePath) {
  const authHeaders = await getAuthHeaders()
  const params = new URLSearchParams()
  if (fileUrl) params.set("fileUrl", fileUrl)
  if (filePath) params.set("file_path", filePath)
  
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${pdfId}/render?${params}`, {
    method: "POST",
    headers: authHeaders,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to start PDF rendering")
  return data
}

export async function getPdfPageImages(pdfId, scale = 2.0) {
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${pdfId}/images?scale=${scale}`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to fetch PDF page images")
  return data.images
}

export async function checkPdfImagesRendered(pdfId) {
  const response = await fetch(`${API_BASE_URL}/admin/yearbook/pdf-pages/${pdfId}/images/check`, {
    method: "GET",
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to check PDF images")
  return data.rendered
}