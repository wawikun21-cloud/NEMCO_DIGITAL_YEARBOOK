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

// ---------------------------------------------------------------------------
// Image compression
// ---------------------------------------------------------------------------
// Vercel serverless functions have a hard 4.5 MB request body limit enforced
// at the infrastructure level — it fires a 413 before the function even runs,
// so no server-side workaround can help.  The only reliable fix is to compress
// the image in the browser before it leaves the client.
//
// Strategy:
//   1. Decode the original file into an ImageBitmap (zero-copy, handles
//      JPEG/PNG/WebP natively in all modern browsers).
//   2. Draw it onto an OffscreenCanvas (or a regular <canvas> as fallback)
//      scaled down if either dimension exceeds MAX_DIMENSION.
//   3. Export as JPEG at QUALITY (0.82 ≈ visually lossless for headshots).
//   4. If the result is still above TARGET_BYTES, re-encode at progressively
//      lower quality until it fits or we hit MIN_QUALITY.
//
// Typical results: a 4 MB phone JPEG comes out ~180–400 KB. A 5 MB PNG
// comes out ~250–600 KB.  Both are well under the 4.5 MB ceiling and upload
// noticeably faster.
// ---------------------------------------------------------------------------

const MAX_DIMENSION = 1200  // px — enough for a crisp resume headshot
const INITIAL_QUALITY = 0.82
const MIN_QUALITY = 0.45
const QUALITY_STEP = 0.1
const TARGET_BYTES = 2.5 * 1024 * 1024   // 2.5 MB target (well under Vercel's 4.5 MB ceiling)

/**
 * Compress a photo File/Blob before uploading.
 * Returns a new Blob (image/jpeg) that is ≤ TARGET_BYTES in most cases.
 *
 * @param {File|Blob} file
 * @returns {Promise<Blob>}
 */
export async function compressResumePhoto(file) {
  // 1. Decode into a bitmap
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // createImageBitmap not supported (very old browsers) — return as-is
    return file
  }

  // 2. Calculate output dimensions, preserving aspect ratio
  let { width, height } = bitmap
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  // 3. Draw onto a canvas
  let canvas
  try {
    // OffscreenCanvas avoids needing a DOM element and works in workers too
    canvas = new OffscreenCanvas(width, height)
  } catch {
    // Safari < 17 and some older browsers lack OffscreenCanvas
    canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
  }

  const ctx = canvas.getContext("2d")
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()  // free GPU memory if supported

  // 4. Encode as JPEG, reducing quality until under TARGET_BYTES
  let quality = INITIAL_QUALITY
  let blob

  while (quality >= MIN_QUALITY) {
    if (canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({ type: "image/jpeg", quality })
    } else {
      blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality)
      )
    }

    if (!blob || blob.size <= TARGET_BYTES) break
    quality = Math.round((quality - QUALITY_STEP) * 100) / 100
  }

  // Safety valve: if compression somehow made it larger, return original
  if (!blob || blob.size >= file.size) return file

  return blob
}

// ---------------------------------------------------------------------------
// API service functions
// ---------------------------------------------------------------------------

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

/**
 * Compress the photo client-side then upload it.
 * The compressed blob is sent as multipart/form-data exactly like before —
 * the server-side handler is unchanged.
 *
 * @param {string} resumeId
 * @param {File} file  - raw File from <input type="file">
 */
export async function uploadResumePhoto(resumeId, file) {
  const authHeaders = await getAuthHeaders()

  // Compress before sending — keeps payload well under Vercel's 4.5 MB limit
  const compressed = await compressResumePhoto(file)

  const formData = new FormData()
  // Preserve the original filename for the server's MIME-type detection,
  // but force a .jpg extension since we always output JPEG after compression.
  const outputName = file.name.replace(/\.[^.]+$/, "") + ".jpg"
  formData.append("photo", compressed, outputName)

  const response = await fetch(`${API_BASE_URL}/my/resumes/${resumeId}/photo`, {
    method: "POST",
    headers: authHeaders,
    body: formData,
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.message || "Failed to upload photo")
  return data
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