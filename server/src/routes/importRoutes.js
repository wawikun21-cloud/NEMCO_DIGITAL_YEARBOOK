import { Router } from "express"
import multer from "multer"
import { uploadImport, listBatches, getBatch, getBatchErrors } from "../controllers/importController.js"
import { requireAuth } from "../middlewares/authMiddleware.js"

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const router = Router()

router.post("/users", requireAuth, upload.single("file"), uploadImport)
router.get("/batches", requireAuth, listBatches)
router.get("/batches/:id", requireAuth, getBatch)
router.get("/batches/:id/errors", requireAuth, getBatchErrors)

export default router