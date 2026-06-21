import { Router } from "express"
import {
  listResumes,
  getResume,
  patchResume,
  removeResume,
  getStats,
} from "../controllers/resumeController.js"
import { requireAdmin } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/resumes/stats", requireAdmin, getStats)
router.get("/resumes", requireAdmin, listResumes)
router.get("/resumes/:id", requireAdmin, getResume)
router.patch("/resumes/:id", requireAdmin, patchResume)
router.delete("/resumes/:id", requireAdmin, removeResume)

export default router
