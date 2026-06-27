import { Router, json } from "express"
import {
  fetchSettings,
  updateSettings,
  fetchPublicFlipbook,
  fetchPdfPages,
  addPdfPage,
  updatePdfPage,
  removePdfPage,
  fetchCatalog,
  searchDepartmentsHandler,
} from "../controllers/flipbookController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()
router.use(json({ limit: "10mb" }))

router.get("/yearbook/flipbook", fetchPublicFlipbook)
router.get("/yearbook/settings", requireAuth, fetchSettings)
router.patch("/yearbook/settings", requireAuth, updateSettings)
router.get("/yearbook/pdf-pages", requireAuth, fetchPdfPages)
router.post("/yearbook/pdf-pages", requireAuth, addPdfPage)
router.patch("/yearbook/pdf-pages/:id", requireAuth, updatePdfPage)
router.delete("/yearbook/pdf-pages/:id", requireAuth, removePdfPage)
router.get("/yearbook/catalog", requireAuth, fetchCatalog)
router.get("/yearbook/departments/search", requireAuth, searchDepartmentsHandler)

export default router