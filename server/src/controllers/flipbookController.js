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
import {
  renderPdfPages,
  getPdfPageImages,
  hasRenderedImages,
  queueRenderJob,
} from "../services/pdfRenderService.js"

function setCorsHeaders(req, res) {
  if (!res.getHeader("Access-Control-Allow-Origin")) {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*")
    res.setHeader("Access-Control-Allow-Credentials", "true")
  }
}

export async function fetchSettings(req, res, next) {
  try {
    const settings = await getFlipbookSettings()
    setCorsHeaders(req, res)
    res.json(settings)
  } catch (error) {
    next(error)
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await updateFlipbookSettings(req.body)
    setCorsHeaders(req, res)
    res.json(settings)
  } catch (error) {
    next(error)
  }
}

export async function fetchPublicFlipbook(req, res, next) {
  try {
    const { department, batch } = req.query
    const result = await getPublicFlipbook(department || null, batch || null)
    setCorsHeaders(req, res)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function fetchPdfPages(req, res, next) {
  try {
    const { department, batch, edition } = req.query
    const pages = await getFlipbookPdfPages(department || null, batch || null, { edition: edition || null })
    setCorsHeaders(req, res)
    res.json({ pages })
  } catch (error) {
    next(error)
  }
}

export async function addPdfPage(req, res, next) {
  try {
    const { title, description, fileUrl, fileName, fileSize, pageCount, coverImageUrl, filePath, sectionName, department, batch, edition } = req.body

    if (!fileUrl || !fileName) {
      setCorsHeaders(req, res)
      return res.status(400).json({ message: "fileUrl and fileName are required" })
    }

    const isMain = (edition || "").toLowerCase() === "main"

    if (!isMain && !department?.trim()) {
      setCorsHeaders(req, res)
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

    setCorsHeaders(req, res)
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
      setCorsHeaders(req, res)
      return res.status(404).json({ message: "PDF page not found" })
    }

    setCorsHeaders(req, res)
    res.json({ page })
  } catch (error) {
    next(error)
  }
}

export async function removePdfPage(req, res, next) {
  try {
    const { id } = req.params
    await deleteFlipbookPdfPage(id)
    setCorsHeaders(req, res)
    res.json({ message: "PDF page deleted" })
  } catch (error) {
    next(error)
  }
}

export async function fetchCatalog(req, res, next) {
  try {
    const catalog = await getYearbookCatalog()
    setCorsHeaders(req, res)
    res.json(catalog)
  } catch (error) {
    next(error)
  }
}

export async function searchDepartmentsHandler(req, res, next) {
  try {
    const { q } = req.query
    const departments = await searchDepartmentsService(q || "")
    setCorsHeaders(req, res)
    res.json({ departments })
  } catch (error) {
    next(error)
  }
}

export async function renderPdfImages(req, res, next) {
  try {
    const { id } = req.params
    const { fileUrl, file_path } = req.query
    
    if (!fileUrl && !file_path) {
      return res.status(400).json({ message: "Either fileUrl or file_path is required" })
    }
    
    queueRenderJob(id, fileUrl, file_path)
    
    setCorsHeaders(req, res)
    res.json({ message: "PDF rendering started in background", pdfId: id })
  } catch (error) {
    next(error)
  }
}

export async function getPdfImages(req, res, next) {
  try {
    const { id } = req.params
    const { scale } = req.query
    
    const images = await getPdfPageImages(id, parseFloat(scale) || 2.0)
    setCorsHeaders(req, res)
    res.json({ images })
  } catch (error) {
    next(error)
  }
}

export async function checkPdfImages(req, res, next) {
  try {
    const { id } = req.params
    const rendered = await hasRenderedImages(id)
    setCorsHeaders(req, res)
    res.json({ rendered, pdfId: id })
  } catch (error) {
    next(error)
  }
}