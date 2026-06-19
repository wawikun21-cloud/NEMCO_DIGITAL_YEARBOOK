import { Router } from "express"
import {
  listTemplates,
  getTemplate,
  createNewTemplate,
  patchTemplate,
  removeTemplate,
  listSections,
  createSection,
  patchSection,
  removeSection,
  reorderTemplateSections,
} from "../controllers/resumeTemplateController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/resume-templates", listTemplates)
router.get("/resume-templates/:id", requireAuth, getTemplate)
router.post("/resume-templates", requireAuth, createNewTemplate)
router.patch("/resume-templates/:id", requireAuth, patchTemplate)
router.delete("/resume-templates/:id", requireAuth, removeTemplate)

router.get("/resume-templates/:templateId/sections", listSections)
router.post("/resume-templates/:templateId/sections", requireAuth, createSection)
router.patch("/resume-sections/:id", requireAuth, patchSection)
router.delete("/resume-sections/:id", requireAuth, removeSection)
router.post("/resume-templates/:templateId/sections/reorder", requireAuth, reorderTemplateSections)

export default router
