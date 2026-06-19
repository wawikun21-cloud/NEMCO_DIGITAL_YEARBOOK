import { Router, json } from "express"
import multer from "multer"
import { uploadPdfFile, extractFilePathFromUrl, deletePdfFile } from "../services/fileUploadService.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"), false)
    }
  },
})

function extractPageCount(buffer) {
  try {
    const str = buffer.toString("latin1")
    let count = 0
    const pagePattern = /\/Type\s*\/Page[^s]/g
    let match
    while ((match = pagePattern.exec(str)) !== null) {
      count++
    }
    if (count > 0) return count
    const pagesPattern = /\/Pages\s*\d+\s+\d+\s+R/
    if (pagesPattern.test(str)) {
      const kidsMatch = str.match(/\/Kids\s*\[.*?\]/s)
      if (kidsMatch) {
        return (kidsMatch[0].match(/\d+\s+\d+\s+R/g) || []).length
      }
    }
    return 0
  } catch {
    return 0
  }
}

router.post("/pdf", requireAuth, (req, res, next) => {
  console.log("[UPLOAD] multer processing started")
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.log("[UPLOAD] Multer error:", err.code, err.message)
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum size is 50MB." })
      }
      return res.status(400).json({ message: err.message })
    } else if (err) {
      console.log("[UPLOAD] Other error:", err.message)
      return res.status(400).json({ message: err.message })
    }
    console.log("[UPLOAD] multer done, file:", req.file ? req.file.originalname : "none")
    next()
  })
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const { originalname, buffer, size, mimetype } = req.file
    console.log("[UPLOAD] Starting Supabase upload:", originalname, size, "bytes")

    const { publicUrl, filePath } = await uploadPdfFile(buffer, originalname, mimetype)
    console.log("[UPLOAD] Supabase upload done:", filePath)

    const pageCount = extractPageCount(buffer)

    res.json({
      fileUrl: publicUrl,
      filePath,
      fileName: originalname,
      fileSize: size,
      pageCount,
    })
  } catch (error) {
    console.error("[UPLOAD] Error:", error.message)
    if (!res.headersSent) {
      next(error)
    }
  }
})

router.delete("/pdf", requireAuth, json({ limit: "10mb" }), async (req, res, next) => {
  try {
    const { fileUrl } = req.body

    if (!fileUrl) {
      return res.status(400).json({ message: "fileUrl is required" })
    }

    const filePath = extractFilePathFromUrl(fileUrl)

    if (filePath) {
      await deletePdfFile(filePath)
    }

    res.json({ message: "File deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export default router
