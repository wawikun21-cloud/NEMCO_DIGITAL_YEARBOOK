import { Router, json } from "express"
import https from "https"
import http from "http"
import { getUploadUrl, getDownloadUrl, extractKeyFromUrl, deletePdfFile, buildPublicUrl } from "../services/fileUploadService.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const MAX_FILE_SIZE = 500 * 1024 * 1024
const router = Router()

function setCorsHeaders(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin || "http://localhost:3000")
  res.setHeader("Access-Control-Allow-Credentials", "true")
}

router.options("*", (req, res) => {
  const origin = req.headers.origin || "*"
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.setHeader("Access-Control-Allow-Credentials", "true")
  res.setHeader("Access-Control-Max-Age", "3600")
  res.status(204).end()
})

router.get("/file/*", async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params[0])
    const origin = req.headers.origin
    setCorsHeaders(res, origin)
    const downloadUrl = await getDownloadUrl(key)
    const mod = downloadUrl.startsWith("https") ? https : http

    const upstreamReq = mod.get(downloadUrl, (downloadRes) => {
      try {
        if (downloadRes.statusCode >= 400) {
          res.status(downloadRes.statusCode).json({ message: "File not found or inaccessible" })
          downloadRes.resume()
          return
        }
        res.setHeader("Content-Type", downloadRes.headers["content-type"] || "application/pdf")
        if (downloadRes.headers["content-length"]) {
          res.setHeader("Content-Length", downloadRes.headers["content-length"])
        }
        downloadRes.pipe(res)
      } catch (err) {
        if (!res.headersSent) next(err)
        else res.destroy(err)
      }
    })
    upstreamReq.on("error", next)
  } catch (error) {
    next(error)
  }
})

router.post("/presigned-url", requireAuth, async (req, res, next) => {
  try {
    const { fileName, contentType, fileSize } = req.body

    if (!fileName) {
      return res.status(400).json({ message: "fileName is required" })
    }

    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({ message: "File too large. Maximum size is 500MB." })
    }

    const { uploadUrl, key, fileUrl } = await getUploadUrl(fileName, contentType || "application/pdf")

    setCorsHeaders(res, req.headers.origin)
    res.json({ uploadUrl, key, fileUrl })
  } catch (error) {
    next(error)
  }
})

router.post("/confirm-upload", requireAuth, async (req, res, next) => {
  try {
    const { key, fileName, fileSize } = req.body

    if (!key || !fileName) {
      return res.status(400).json({ message: "key and fileName are required" })
    }

    const fileUrl = buildPublicUrl(key)

    setCorsHeaders(res, req.headers.origin)
    res.json({
      fileUrl,
      fileKey: key,
      fileName,
      fileSize: fileSize || null,
    })
  } catch (error) {
    next(error)
  }
})

router.post("/pdf", requireAuth, async (req, res, next) => {
  try {
    const contentType = req.headers["content-type"] || ""
    if (!contentType.startsWith("multipart/form-data")) {
      return res.status(400).json({ message: "Expected multipart/form-data" })
    }

    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^\s;]+))/)
    if (!boundaryMatch) {
      return res.status(400).json({ message: "Invalid multipart form data" })
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2]

    const chunks = []
    await new Promise((resolve, reject) => {
      req.on("data", (chunk) => chunks.push(chunk))
      req.on("error", reject)
      req.on("end", resolve)
    })

    const raw = Buffer.concat(chunks)
    const crlf = Buffer.from("\r\n")
    const boundaryBuf = Buffer.from(`--${boundary}`)

    const fileHeaderIdx = raw.indexOf(Buffer.from('Content-Disposition: form-data; name="file"'))
    if (fileHeaderIdx === -1) {
      return res.status(400).json({ message: "No file field found in upload" })
    }

    const headerEnd = raw.indexOf(Buffer.concat([crlf, crlf]), fileHeaderIdx)
    if (headerEnd === -1) {
      return res.status(400).json({ message: "Malformed multipart data" })
    }

    const headerSection = raw.slice(fileHeaderIdx, headerEnd).toString("utf-8")
    const nameMatch = headerSection.match(/filename="([^"]+)"/)
    const fileName = nameMatch ? nameMatch[1] : "upload.pdf"

    const fileDataStart = headerEnd + 4
    const closingBoundary = raw.indexOf(boundaryBuf, fileDataStart)
    if (closingBoundary === -1) {
      return res.status(400).json({ message: "Malformed multipart data: missing closing boundary" })
    }

    const fileDataEnd = closingBoundary - 2
    const fileBuffer = raw.slice(fileDataStart, fileDataEnd)
    const fileSize = fileBuffer.length

    if (fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({ message: "File too large. Maximum size is 500MB." })
    }

    // Upload using server-side helper (Cloudflare R2)
    const { uploadPdfFile } = await import('../services/fileUploadService.js')
    const result = await uploadPdfFile(fileBuffer, fileName, 'application/pdf')
    const fileUrl = result.fileUrl
    const key = result.key

    setCorsHeaders(res, req.headers.origin)
    res.json({
      fileUrl,
      fileKey: key,
      fileName,
      fileSize,
    })
  } catch (error) {
    console.error("[UPLOAD /pdf] Error:", error.message)
    if (!res.headersSent) {
      next(error)
    }
  }
})

router.get("/download-url", async (req, res, next) => {
  try {
    const { key } = req.query

    if (!key) {
      return res.status(400).json({ message: "key is required" })
    }

    const url = await getDownloadUrl(decodeURIComponent(key))
    setCorsHeaders(res, req.headers.origin)
    res.json({ url })
  } catch (error) {
    next(error)
  }
})

router.delete("/pdf", requireAuth, json({ limit: "10mb" }), async (req, res, next) => {
  try {
    const { fileUrl, fileKey } = req.body

    const key = fileKey || extractKeyFromUrl(fileUrl)

    if (key) {
      await deletePdfFile(key)
    }

    setCorsHeaders(res, req.headers.origin)
    res.json({ message: "File deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export default router
