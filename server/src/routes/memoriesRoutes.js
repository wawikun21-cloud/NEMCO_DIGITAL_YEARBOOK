import { Router } from "express"
import { authenticate } from "../middlewares/authMiddleware.js"
import {
  getStudentAlbumsController,
  getStudentAlbumDetailController,
  getStudentFavoritesController,
  toggleFavoriteController,
  getAdminAlbumsController,
  createAlbumController,
  updateAlbumController,
  deleteAlbumController,
  createMemoryItemController,
  createMemoryItemsBulkController,
  updateMemoryItemController,
  deleteMemoryItemController,
  reorderItemsController,
  getTaggedStudentsController,
} from "../controllers/memoriesController.js"

const router = Router()

router.get("/student/albums", authenticate, getStudentAlbumsController)
router.get("/student/albums/:albumId", authenticate, getStudentAlbumDetailController)
router.get("/student/favorites", authenticate, getStudentFavoritesController)
router.post("/student/favorites/:itemId", authenticate, toggleFavoriteController)

router.get("/admin/albums", authenticate, getAdminAlbumsController)
router.post("/admin/albums", authenticate, createAlbumController)
router.patch("/admin/albums/:albumId", authenticate, updateAlbumController)
router.delete("/admin/albums/:albumId", authenticate, deleteAlbumController)

router.post("/admin/items", authenticate, createMemoryItemController)
router.post("/admin/items/bulk", authenticate, createMemoryItemsBulkController)
router.patch("/admin/items/:itemId", authenticate, updateMemoryItemController)
router.delete("/admin/items/:itemId", authenticate, deleteMemoryItemController)
router.post("/admin/albums/:albumId/reorder", authenticate, reorderItemsController)

router.get("/memories/tagged-students", authenticate, getTaggedStudentsController)

export default router
