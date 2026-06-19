import { supabaseAdmin } from "../config/supabase.js"

const BUCKET_NAME = "flipbook-pdfs"

export async function uploadPdfFile(fileBuffer, fileName, contentType = "application/pdf") {
  const timestamp = Date.now()
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const filePath = `${timestamp}-${sanitizedFileName}`

  const { data, error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(filePath, fileBuffer, {
      contentType,
      upsert: false,
    })

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
