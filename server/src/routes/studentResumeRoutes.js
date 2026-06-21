import { Router } from "express"
import multer from "multer"
import {
  listMyResumes,
  getMyResume,
  createNewResume,
  updateResumeData,
  removeResume,
  uploadResumePhotoForResume,
  listPublicTemplates,
  getPublicTemplateDetail,
} from "../controllers/studentResumeController.js"
import { authenticate } from "../middlewares/authMiddleware.js"

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

router.get("/resume-templates", listPublicTemplates)
router.get("/resume-templates/:slug", getPublicTemplateDetail)

router.get("/my/resumes", authenticate, listMyResumes)
router.get("/my/resumes/:id", authenticate, getMyResume)
router.post("/my/resumes", authenticate, createNewResume)
router.post(
  "/my/resumes/:id/photo",
  authenticate,
  upload.single("photo"),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: "No photo uploaded" })
    }
    return uploadResumePhotoForResume(req, res, next)
  },
  (error, req, res, next) => {
    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Photo too large. Maximum size is 5MB." })
    }
    return next(error)
  }
)
router.patch("/my/resumes/:id", authenticate, updateResumeData)
router.delete("/my/resumes/:id", authenticate, removeResume)

export default router
