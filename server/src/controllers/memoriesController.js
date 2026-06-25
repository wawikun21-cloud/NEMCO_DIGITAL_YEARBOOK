import {
  getAlbumsForStudent,
  getAlbumById,
  getFavoriteItemsForStudent,
  toggleFavorite,
  toggleAlbumFavorite,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  createMemoryItem,
  createMemoryItemsBulk,
  updateMemoryItem,
  deleteMemoryItem,
  reorderItems,
  getAdminAlbums,
  getTaggedStudents,
} from "../services/memoriesService.js"
import { logAudit } from "../services/userService.js"

export async function getStudentAlbumsController(req, res, next) {
   try {
     const { category, search, shared, sortBy, page, perPage, favorites } = req.query
     const result = await getAlbumsForStudent(req.user.id, {
       category,
       search,
       sharedOnly: shared === "true",
       favorites: favorites === "true",
       sortBy: sortBy || "newest",
       page: parseInt(page) || 1,
       perPage: parseInt(perPage) || 12,
     })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getStudentAlbumDetailController(req, res, next) {
  try {
    const album = await getAlbumById(req.params.albumId, req.user.id)
    res.json({ album })
  } catch (error) {
    next(error)
  }
}

export async function getStudentFavoritesController(req, res, next) {
  try {
    const { sortBy, page, perPage } = req.query
    const result = await getFavoriteItemsForStudent(req.user.id, {
      sortBy: sortBy || "newest",
      page: parseInt(page) || 1,
      perPage: parseInt(perPage) || 12,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function toggleFavoriteController(req, res, next) {
  try {
    const isFavorite = await toggleFavorite(req.user.id, req.params.itemId)
    res.json({ is_favorite: isFavorite })
  } catch (error) {
    next(error)
  }
}

export async function toggleAlbumFavoriteController(req, res, next) {
  try {
    const isFavorite = await toggleAlbumFavorite(req.user.id, req.params.albumId)
    res.json({ is_favorite: isFavorite })
  } catch (error) {
    next(error)
  }
}

export async function getAdminAlbumsController(req, res, next) {
  try {
    const { page, perPage, search, category } = req.query
    const result = await getAdminAlbums({
      page: parseInt(page) || 1,
      perPage: parseInt(perPage) || 20,
      search,
      category,
    })
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function createAlbumController(req, res, next) {
  try {
    const album = await createAlbum({ ...req.body, created_by: req.user.id })
    await logAudit({
      adminId: req.user.id,
      action: "create_memory_album",
      entityType: "memory_album",
      entityId: album.id,
      newData: album,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })
    res.status(201).json({ album })
  } catch (error) {
    next(error)
  }
}

export async function updateAlbumController(req, res, next) {
  try {
    const oldAlbum = await getAlbumById(req.params.albumId)
    const album = await updateAlbum(req.params.albumId, req.body)
    await logAudit({
      adminId: req.user.id,
      action: "update_memory_album",
      entityType: "memory_album",
      entityId: album.id,
      oldData: oldAlbum,
      newData: album,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })
    res.json({ album })
  } catch (error) {
    next(error)
  }
}

export async function deleteAlbumController(req, res, next) {
  try {
    const oldAlbum = await getAlbumById(req.params.albumId)
    await deleteAlbum(req.params.albumId)
    await logAudit({
      adminId: req.user.id,
      action: "delete_memory_album",
      entityType: "memory_album",
      entityId: req.params.albumId,
      oldData: oldAlbum,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function createMemoryItemController(req, res, next) {
  try {
    const item = await createMemoryItem(req.body)
    res.status(201).json({ item })
  } catch (error) {
    next(error)
  }
}

export async function createMemoryItemsBulkController(req, res, next) {
  try {
    const items = req.body.items.map((item) => ({
      album_id: req.body.album_id,
      cloud_url: item.cloud_url,
      thumbnail_url: item.thumbnail_url || null,
      media_type: item.media_type || "photo",
      caption: item.caption || null,
      tagged_student_ids: item.tagged_student_ids || [],
      order_index: item.order_index || 0,
    }))
    const created = await createMemoryItemsBulk(items)
    res.status(201).json({ items: created, count: created.length })
  } catch (error) {
    next(error)
  }
}

export async function updateMemoryItemController(req, res, next) {
  try {
    const item = await updateMemoryItem(req.params.itemId, req.body)
    res.json({ item })
  } catch (error) {
    next(error)
  }
}

export async function deleteMemoryItemController(req, res, next) {
  try {
    await deleteMemoryItem(req.params.itemId)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function reorderItemsController(req, res, next) {
  try {
    await reorderItems(req.params.albumId, req.body.itemIds)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
}

export async function getTaggedStudentsController(req, res, next) {
  try {
    const ids = req.query.ids ? req.query.ids.split(",") : []
    const students = await getTaggedStudents(ids)
    res.json({ students })
  } catch (error) {
    next(error)
  }
}
