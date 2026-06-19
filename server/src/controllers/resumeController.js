import {
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  getResumeStats,
} from "../services/resumeService.js"

export async function listResumes(req, res, next) {
  try {
    const {
      page = 1,
      perPage = 25,
      template,
      isPublic,
      search,
      dateFrom,
      dateTo,
    } = req.query

    const result = await getResumes({
      page: parseInt(page, 10),
      perPage: parseInt(perPage, 10),
      template: template || null,
      isPublic: isPublic !== undefined ? isPublic === "true" : null,
      search: search || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getResume(req, res, next) {
  try {
    const { id } = req.params
    const resume = await getResumeById(id)

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }

    res.json({ resume })
  } catch (error) {
    next(error)
  }
}

export async function patchResume(req, res, next) {
  try {
    const { id } = req.params
    const { title, isPublic } = req.body

    const resume = await updateResume(id, {
      title,
      isPublic: isPublic !== undefined ? isPublic : undefined,
    })

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }

    res.json({ resume })
  } catch (error) {
    next(error)
  }
}

export async function removeResume(req, res, next) {
  try {
    const { id } = req.params
    await deleteResume(id)
    res.json({ message: "Resume deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export async function getStats(req, res, next) {
  try {
    const stats = await getResumeStats()
    res.json(stats)
  } catch (error) {
    next(error)
  }
}
