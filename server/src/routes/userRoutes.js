import { Router } from "express"
import { requireAuth } from "../middlewares/authMiddleware.js"
import {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  resetPasswordController,
} from "../controllers/userController.js"

const router = Router()

router.get("/", requireAuth, getUsersController)
router.get("/:id", requireAuth, getUserController)
router.post("/", requireAuth, createUserController)
router.patch("/:id", requireAuth, updateUserController)
router.delete("/:id", requireAuth, deleteUserController)
router.post("/:id/reset-password", requireAuth, resetPasswordController)

export default router