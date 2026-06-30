import { Router, json } from "express"
import multer from "multer"
import { getUploadUrl, uploadPdfFile, extractB2KeyFromUrl, deletePdfFile } from "../services/fileUploadService.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()

const ALLOWED_TYPES = ["application/pdf"]

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true)
    } else {
      cb(new Error("Only PDF files are allowed"), false)
    }
  },
})

router.post("/pdf", requireAuth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ message: "File too large. Maximum size is 500MB." })
      }
      return res.status(400).json({ message: err.message })
    } else if (err) {
      return res.status(400).json({ message: err.message })
    }
    next()
  })
}, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const { originalname, buffer, size, mimetype } = req.file
    const { fileUrl, key } = await uploadPdfFile(buffer, originalname, mimetype)

    res.json({
      fileUrl,
      fileKey: key,
      fileName: originalname,
      fileSize: size,
    })
  } catch (error) {
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
    res.json({ url })
  } catch (error) {
    next(error)
  }
})

router.delete("/pdf", requireAuth, json({ limit: "10mb" }), async (req, res, next) => {
  try {
    const { fileUrl, fileKey } = req.body

    const key = fileKey || extractB2KeyFromUrl(fileUrl)

    if (key) {
      await deletePdfFile(key)
    }

    res.json({ message: "File deleted successfully" })
  } catch (error) {
    next(error)
  }
})

export default router
