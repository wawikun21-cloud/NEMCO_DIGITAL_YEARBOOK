import { Router } from "express"
import multer from "multer"
import { authenticate } from "../middlewares/authMiddleware.js"
import { avatarRateLimit } from "../middlewares/rateLimiter.js"
import {
  getMyProfileController,
  getPublicProfileController,
  updateMyProfileController,
  submitProfileController,
  uploadAvatarController,
  getAvatarHistoryController,
  generateQrCodeController,
} from "../controllers/profileController.js"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
})

const router = Router()

router.get("/me", authenticate, getMyProfileController)
router.get("/public/:identifier", getPublicProfileController)
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
router.post("/me/qrcode/generate", authenticate, generateQrCodeController)

export default router