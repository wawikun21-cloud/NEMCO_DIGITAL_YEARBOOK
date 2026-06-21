import { Router } from "express"
import multer from "multer"
import { uploadImport, listBatches, getBatch, getBatchErrors } from "../controllers/importController.js"
import { requireAdmin } from "../middlewares/authMiddleware.js"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const router = Router()

router.post("/users", requireAdmin, upload.single("file"), uploadImport)
router.get("/batches", requireAdmin, listBatches)
router.get("/batches/:id", requireAdmin, getBatch)
router.get("/batches/:id/errors", requireAdmin, getBatchErrors)

export default router