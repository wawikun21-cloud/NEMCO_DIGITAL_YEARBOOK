import { supabaseAdmin } from "../config/supabase.js"

const BUCKET_NAME = "flipbook-pdfs"
const MAX_FILE_SIZE = 50 * 1024 * 1024
const UPLOAD_TIMEOUT_MS = 55000

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`))
    }, ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

export async function uploadPdfFile(fileBuffer, fileName, contentType = "application/pdf") {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const filePath = `${timestamp}-${sanitizedFileName}`

  const { data, error: uploadError } = await withTimeout(
    supabaseAdmin.storage.from(BUCKET_NAME).upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    }),
    UPLOAD_TIMEOUT_MS
  )

  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(filePath)

  return {
    filePath,
    publicUrl: urlData.publicUrl,
  }
}

export async function deletePdfFile(filePath) {
  const { error } = await supabaseAdmin.storage.from(BUCKET_NAME).remove([filePath])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }

  return true
}

export function extractFilePathFromUrl(publicUrl) {
  try {
    const url = new URL(publicUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf(BUCKET_NAME)
    if (bucketIndex === -1) return null
    return pathParts.slice(bucketIndex + 1).join("/")
  } catch {
    return null
  }
}
