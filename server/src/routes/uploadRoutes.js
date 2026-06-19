import { Router } from "express"
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

router.post("/upload/pdf", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const { originalname, buffer, size, mimetype } = req.file

    const { publicUrl, filePath } = await uploadPdfFile(buffer, originalname, mimetype)

    res.json({
      fileUrl: publicUrl,
      filePath,
      fileName: originalname,
      fileSize: size,
    })
  } catch (error) {
    next(error)
  }
})

router.delete("/upload/pdf", requireAuth, async (req, res, next) => {
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
