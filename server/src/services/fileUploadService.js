import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import b2 from "../config/b2Client.js"
import { config } from "../config/env.js"

const BUCKET = config.b2.bucket
const MAX_FILE_SIZE = 500 * 1024 * 1024
const PRESIGN_EXPIRES = 3600

export async function uploadPdfFile(fileBuffer, fileName, contentType = "application/pdf") {
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  }

  const timestamp = Date.now()
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const key = `yearbooks/${timestamp}-${sanitized}`

  await b2.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  }))

  return {
    key,
    fileUrl: buildPublicUrl(key),
  }
}

export async function getUploadUrl(fileName, contentType = "application/pdf") {
  const timestamp = Date.now()
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, "_")
  const key = `yearbooks/${timestamp}-${sanitized}`

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(b2, command, { expiresIn: PRESIGN_EXPIRES })

  return { uploadUrl, key, fileUrl: buildPublicUrl(key) }
}

export async function getDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  })
  return getSignedUrl(b2, command, { expiresIn: PRESIGN_EXPIRES })
}

export async function deletePdfFile(key) {
  await b2.send(new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  }))
  return true
}

export function extractB2KeyFromUrl(publicUrl) {
  try {
    if (config.b2.publicBaseUrl) {
      const base = config.b2.publicBaseUrl.replace(/\/$/, "")
      if (publicUrl.startsWith(base)) {
        return publicUrl.slice(base.length + 1)
      }
    }
    const url = new URL(publicUrl)
    const pathParts = url.pathname.split("/")
    const bucketIndex = pathParts.indexOf(BUCKET)
    if (bucketIndex !== -1) {
      return pathParts.slice(bucketIndex + 1).join("/")
    }
    if (pathParts.length >= 2) {
      return pathParts.slice(1).join("/")
    }
    return null
  } catch {
    return null
  }
}

export function buildPublicUrl(key) {
  if (config.b2.publicBaseUrl) {
    return `${config.b2.publicBaseUrl.replace(/\/$/, "")}/${key}`
  }
  return `${config.b2.endpoint}/${BUCKET}/${key}`
}

export { MAX_FILE_SIZE }
