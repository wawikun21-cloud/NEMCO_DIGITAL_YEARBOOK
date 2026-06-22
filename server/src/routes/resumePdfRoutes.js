import { Router } from "express"
import { generateResumePdf } from "../controllers/resumePdfController.js"
import { authenticate } from "../middlewares/authMiddleware.js"

const router = Router()

// POST /api/generate-resume-pdf
// Authenticated student route — generates and streams a PDF for the caller's resume.
router.post("/generate-resume-pdf", authenticate, generateResumePdf)

export default router
