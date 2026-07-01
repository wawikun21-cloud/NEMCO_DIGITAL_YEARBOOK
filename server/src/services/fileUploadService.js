import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import r2 from "../config/r2Client.js"
import { config } from "../config/env.js"

const MAX_FILE_SIZE = 500 * 1024 * 1024
const PRESIGN_EXPIRES = 60 * 60 // seconds

function sanitizeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
}

function getBucketName() {
  return config.r2.bucket
}

export async function uploadPdfFile(fileBuffer, fileName, contentType = "application/pdf") {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  const timestamp = Date.now()
  const sanitized = sanitizeFileName(fileName)
  const key = `yearbooks/${timestamp}-${sanitized}`

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  })
  await r2.send(command)

  return { key, fileUrl: buildPublicUrl(key) }
}

export async function getUploadUrl(fileName, contentType = "application/pdf") {
  const timestamp = Date.now()
  const sanitized = sanitizeFileName(fileName)
  const key = `yearbooks/${timestamp}-${sanitized}`

  const command = new PutObjectCommand({
    Bucket: getBucketName(),
    Key: key,
    ContentType: contentType,
  })
  const uploadUrl = await getSignedUrl(r2, command, { expiresIn: PRESIGN_EXPIRES })

  return { uploadUrl, key, fileUrl: buildPublicUrl(key) }
}

export async function getDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })
  return getSignedUrl(r2, command, { expiresIn: PRESIGN_EXPIRES })
}

export async function deletePdfFile(key) {
  const command = new DeleteObjectCommand({
    Bucket: getBucketName(),
    Key: key,
  })
  await r2.send(command)
  return true
}

export function extractKeyFromUrl(publicUrl) {
  try {
    if (config.r2.publicBaseUrl) {
      const base = config.r2.publicBaseUrl.replace(/\/$/, "")
      if (publicUrl.startsWith(base)) return publicUrl.slice(base.length + 1)
    }
    const url = new URL(publicUrl)
    const pathname = url.pathname.replace(/^\//, "")
    if (config.r2.bucket && pathname.startsWith(config.r2.bucket + "/")) {
      return pathname.slice(config.r2.bucket.length + 1)
    }
    return pathname
  } catch {
    return null
  }
}

export function buildPublicUrl(key) {
  if (config.r2.publicBaseUrl) {
    return `${config.r2.publicBaseUrl.replace(/\/$/, "")}/${key}`
  }
  return `/api/admin/upload/file/${encodeURIComponent(key)}`
}

export { MAX_FILE_SIZE }
