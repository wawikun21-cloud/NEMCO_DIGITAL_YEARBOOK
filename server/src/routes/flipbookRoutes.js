import { Router, json } from "express"
import {
  fetchSettings,
  updateSettings,
  fetchProfiles,
  fetchApprovedProfiles,
  addProfile,
  updateProfile,
  removeProfile,
  reorderProfiles,
  fetchSections,
  addSection,
  removeSection,
  fetchPublicFlipbook,
  fetchPdfPages,
  addPdfPage,
  updatePdfPage,
  removePdfPage,
  reorderPdfPages,
} from "../controllers/flipbookController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()
router.use(json({ limit: "10mb" }))

router.get("/yearbook/flipbook", fetchPublicFlipbook)
router.get("/yearbook/settings", requireAuth, fetchSettings)
router.patch("/yearbook/settings", requireAuth, updateSettings)
router.get("/yearbook/profiles", requireAuth, fetchProfiles)
router.get("/yearbook/approved-profiles", requireAuth, fetchApprovedProfiles)
router.post("/yearbook/profiles", requireAuth, addProfile)
router.patch("/yearbook/profiles/:id", requireAuth, updateProfile)
router.delete("/yearbook/profiles/:id", requireAuth, removeProfile)
router.post("/yearbook/reorder", requireAuth, reorderProfiles)
router.get("/yearbook/sections", requireAuth, fetchSections)
router.post("/yearbook/sections", requireAuth, addSection)
router.delete("/yearbook/sections/:id", requireAuth, removeSection)

router.get("/yearbook/pdf-pages", requireAuth, fetchPdfPages)
router.post("/yearbook/pdf-pages", requireAuth, addPdfPage)
router.patch("/yearbook/pdf-pages/:id", requireAuth, updatePdfPage)
router.delete("/yearbook/pdf-pages/:id", requireAuth, removePdfPage)
router.post("/yearbook/pdf-pages/reorder", requireAuth, reorderPdfPages)

export default router
