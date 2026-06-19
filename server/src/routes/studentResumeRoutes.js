import { Router } from "express"
import {
  listMyResumes,
  getMyResume,
  createNewResume,
  updateResumeData,
  removeResume,
  listPublicTemplates,
  getPublicTemplateDetail,
} from "../controllers/studentResumeController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/resume-templates", listPublicTemplates)
router.get("/resume-templates/:slug", getPublicTemplateDetail)

router.get("/my/resumes", requireAuth, listMyResumes)
router.get("/my/resumes/:id", requireAuth, getMyResume)
router.post("/my/resumes", requireAuth, createNewResume)
router.patch("/my/resumes/:id", requireAuth, updateResumeData)
router.delete("/my/resumes/:id", requireAuth, removeResume)

export default router
