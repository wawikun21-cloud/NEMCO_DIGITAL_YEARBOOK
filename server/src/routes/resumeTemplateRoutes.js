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
import { requireAdmin } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/resume-templates", listTemplates)
router.get("/resume-templates/:id", requireAdmin, getTemplate)
router.post("/resume-templates", requireAdmin, createNewTemplate)
router.patch("/resume-templates/:id", requireAdmin, patchTemplate)
router.delete("/resume-templates/:id", requireAdmin, removeTemplate)

router.get("/resume-templates/:templateId/sections", listSections)
router.post("/resume-templates/:templateId/sections", requireAdmin, createSection)
router.patch("/resume-sections/:id", requireAdmin, patchSection)
router.delete("/resume-sections/:id", requireAdmin, removeSection)
router.post("/resume-templates/:templateId/sections/reorder", requireAdmin, reorderTemplateSections)

export default router
