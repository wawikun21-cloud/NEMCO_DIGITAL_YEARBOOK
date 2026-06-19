import {
  getMyResumes,
  getMyResumeById,
  createResume,
  updateMyResume,
  deleteMyResume,
  getPublicTemplates,
  getTemplateWithSections,
} from "../services/studentResumeService.js"

export async function listMyResumes(req, res, next) {
  try {
    const userId = req.user.id
    const resumes = await getMyResumes(userId)
    res.json({ resumes })
  } catch (error) {
    next(error)
  }
}

export async function getMyResume(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    const resume = await getMyResumeById(id, userId)

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" })
    }

    res.json({ resume })
  } catch (error) {
    next(error)
  }
}

export async function createNewResume(req, res, next) {
  try {
    const userId = req.user.id
    const { title, template, data } = req.body

    const resume = await createResume(userId, { title, template, data })
    res.status(201).json({ resume })
  } catch (error) {
    next(error)
  }
}

export async function updateResumeData(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    const { title, data, isPublic, template } = req.body

    const resume = await updateMyResume(id, userId, {
      title,
      data,
      isPublic: isPublic !== undefined ? isPublic : undefined,
      template,
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
    const userId = req.user.id
    const { id } = req.params
    await deleteMyResume(id, userId)
    res.json({ message: "Resume deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export async function listPublicTemplates(req, res, next) {
  try {
    const templates = await getPublicTemplates()
    res.json({ templates })
  } catch (error) {
    next(error)
  }
}

export async function getPublicTemplateDetail(req, res, next) {
  try {
    const { slug } = req.params
    const result = await getTemplateWithSections(slug)

    if (!result) {
      return res.status(404).json({ message: "Template not found" })
    }

    res.json(result)
  } catch (error) {
    next(error)
  }
}
