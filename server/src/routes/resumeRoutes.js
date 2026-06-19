import { Router } from "express"
import {
  listResumes,
  getResume,
  patchResume,
  removeResume,
  getStats,
} from "../controllers/resumeController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/resumes/stats", requireAuth, getStats)
router.get("/resumes", requireAuth, listResumes)
router.get("/resumes/:id", requireAuth, getResume)
router.patch("/resumes/:id", requireAuth, patchResume)
router.delete("/resumes/:id", requireAuth, removeResume)

export default router
