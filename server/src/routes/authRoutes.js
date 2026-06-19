import { Router } from "express"
import { login, changePasswordController } from "../controllers/authController.js"
import { authenticate } from "../middlewares/authMiddleware.js"

const router = Router()

router.post("/login", login)
router.post("/change-password", authenticate, changePasswordController)

export default router
