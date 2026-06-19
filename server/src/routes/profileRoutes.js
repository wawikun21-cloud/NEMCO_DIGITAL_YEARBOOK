import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/authMiddleware.js"
import { avatarRateLimit } from "../middlewares/rateLimiter.js"
import {
  getMyProfileController,
  updateMyProfileController,
  submitProfileController,
  uploadAvatarController,
  getAvatarHistoryController,
} from "../controllers/profileController.js"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

const router = Router()

router.get("/me", authenticate, getMyProfileController)
router.patch("/me", authenticate, updateMyProfileController)
router.post("/submit", authenticate, submitProfileController)
router.post(
  "/me/avatar",
  authenticate,
  avatarRateLimit,
  upload.single("avatar"),
  uploadAvatarController
)
router.get("/me/avatar/history", authenticate, getAvatarHistoryController)

export default router