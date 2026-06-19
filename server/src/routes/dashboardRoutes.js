import { Router } from "express"
import { requireAuth } from "../middlewares/authMiddleware.js"
import { getDashboardController } from "../controllers/dashboardController.js"

const router = Router()

router.get("/dashboard", requireAuth, getDashboardController)

export default router