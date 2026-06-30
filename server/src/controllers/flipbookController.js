import {
  getFlipbookSettings,
  updateFlipbookSettings,
  getPublicFlipbook,
  getFlipbookPdfPages,
  createFlipbookPdfPage,
  updateFlipbookPdfPage,
  deleteFlipbookPdfPage,
  getYearbookCatalog,
  searchDepartments as searchDepartmentsService,
} from "../services/flipbookService.js"

export async function fetchSettings(req, res, next) {
  try {
    const settings = await getFlipbookSettings()
    res.json(settings)
  } catch (error) {
    next(error)
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await updateFlipbookSettings(req.body)
    res.json(settings)
  } catch (error) {
    next(error)
  }
}

export async function fetchPublicFlipbook(req, res, next) {
  try {
    const { department, batch } = req.query
    const result = await getPublicFlipbook(department || null, batch || null)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function fetchPdfPages(req, res, next) {
  try {
    const { department, batch, edition } = req.query
    const pages = await getFlipbookPdfPages(department || null, batch || null, { edition: edition || null })
    res.json({ pages })
  } catch (error) {
    next(error)
  }
}

export async function addPdfPage(req, res, next) {
  try {
    const { title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, sectionName, department, batch, edition } = req.body

    if (!fileUrl || !fileName) {
      return res.status(400).json({ message: "fileUrl and fileName are required" })
    }

    const isMain = (edition || "").toLowerCase() === "main"

    if (!isMain && !department?.trim()) {
      return res.status(400).json({ message: "Course/strand is required. Select a value from student profiles, or choose 'Yearbook Main' edition." })
    }

    const page = await createFlipbookPdfPage({
      title,
      description,
      fileUrl,
      fileName,
      fileSize,
      pageCount,
      coverImageUrl,
      filePath,
      uploadedBy: req.user?.id || null,
      sectionName,
      department: isMain ? null : department,
      batch: isMain ? null : batch,
      edition: isMain ? "main" : (edition || "course"),
    })

    res.json({ page })
  } catch (error) {
    next(error)
  }
}

export async function updatePdfPage(req, res, next) {
  try {
    const { id } = req.params
    const { title, description, sortOrder, isActive, department, batch, edition } = req.body

    const page = await updateFlipbookPdfPage(id, {
      title,
      description,
      sortOrder,
      isActive,
      department,
      batch,
      edition,
    })

    if (!page) {
      return res.status(404).json({ message: "PDF page not found" })
    }

    res.json({ page })
  } catch (error) {
    next(error)
  }
}

export async function removePdfPage(req, res, next) {
  try {
    const { id } = req.params
    await deleteFlipbookPdfPage(id)
    res.json({ message: "PDF page deleted" })
  } catch (error) {
    next(error)
  }
}

export async function fetchCatalog(req, res, next) {
  try {
    const catalog = await getYearbookCatalog()
    res.json(catalog)
  } catch (error) {
    next(error)
  }
}

export async function searchDepartmentsHandler(req, res, next) {
  try {
    const { q } = req.query
    const departments = await searchDepartmentsService(q || "")
    res.json({ departments })
  } catch (error) {
    next(error)
  }
}