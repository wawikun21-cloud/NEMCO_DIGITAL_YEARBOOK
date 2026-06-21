import { Router } from "express"
import { requireAdmin } from "../middlewares/authMiddleware.js"
import {
  getUsersController,
  getUserController,
  createUserController,
  updateUserController,
  deleteUserController,
  resetPasswordController,
} from "../controllers/userController.js"

const router = Router()

router.get("/", requireAdmin, getUsersController)
router.get("/:id", requireAdmin, getUserController)
router.post("/", requireAdmin, createUserController)
router.patch("/:id", requireAdmin, updateUserController)
router.delete("/:id", requireAdmin, deleteUserController)
router.post("/:id/reset-password", requireAdmin, resetPasswordController)

export default router