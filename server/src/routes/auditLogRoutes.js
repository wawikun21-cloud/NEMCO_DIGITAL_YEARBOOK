import { Router } from "express"
import { listLogs, getLog, getFilters } from "../controllers/auditLogController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const router = Router()

router.get("/logs", requireAuth, listLogs)
router.get("/logs/filters", requireAuth, getFilters)
router.get("/logs/:id", requireAuth, getLog)

export default router
