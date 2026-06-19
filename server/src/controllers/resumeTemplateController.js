import {
  getTemplates,
  getTemplateById,
  getTemplateBySlug,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateSections,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
} from "../services/resumeTemplateService.js"

export async function listTemplates(req, res, next) {
  try {
    const { includeInactive } = req.query
    const templates = await getTemplates({ includeInactive: includeInactive === "true" })
    res.json({ templates })
  } catch (error) {
    next(error)
  }
}

export async function getTemplate(req, res, next) {
  try {
    const { id } = req.params
    const template = await getTemplateById(id)

    if (!template) {
      return res.status(404).json({ message: "Template not found" })
    }

    const sections = await getTemplateSections(template.id)

    res.json({ template, sections })
  } catch (error) {
    next(error)
  }
}

export async function createNewTemplate(req, res, next) {
  try {
    const { name, slug, description, thumbnail_url, default_sections, is_active, sort_order } = req.body

    if (!name || !slug) {
      return res.status(400).json({ message: "name and slug are required" })
    }

    const template = await createTemplate({
      name,
      slug,
      description,
      thumbnail_url,
      default_sections,
      is_active,
      sort_order,
    })

    res.status(201).json({ template })
  } catch (error) {
    next(error)
  }
}

export async function patchTemplate(req, res, next) {
  try {
    const { id } = req.params
    const { name, description, thumbnail_url, default_sections, is_active, is_default, sort_order } = req.body

    const template = await updateTemplate(id, {
      name,
      description,
      thumbnail_url,
      default_sections,
      is_active,
      is_default,
      sort_order,
    })

    if (!template) {
      return res.status(404).json({ message: "Template not found" })
    }

    res.json({ template })
  } catch (error) {
    next(error)
  }
}

export async function removeTemplate(req, res, next) {
  try {
    const { id } = req.params
    await deleteTemplate(id)
    res.json({ message: "Template deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export async function listSections(req, res, next) {
  try {
    const { templateId } = req.params
    const sections = await getTemplateSections(templateId)
    res.json({ sections })
  } catch (error) {
    next(error)
  }
}

export async function createSection(req, res, next) {
  try {
    const { templateId } = req.params
    const { section_key, label, description, icon, field_type, is_required, sort_order, config } = req.body

    if (!section_key || !label) {
      return res.status(400).json({ message: "section_key and label are required" })
    }

    const section = await addSection(templateId, {
      section_key,
      label,
      description,
      icon,
      field_type,
      is_required,
      sort_order,
      config,
    })

    res.status(201).json({ section })
  } catch (error) {
    next(error)
  }
}

export async function patchSection(req, res, next) {
  try {
    const { id } = req.params
    const { label, description, icon, field_type, is_required, sort_order, config } = req.body

    const section = await updateSection(id, {
      label,
      description,
      icon,
      field_type,
      is_required,
      sort_order,
      config,
    })

    if (!section) {
      return res.status(404).json({ message: "Section not found" })
    }

    res.json({ section })
  } catch (error) {
    next(error)
  }
}

export async function removeSection(req, res, next) {
  try {
    const { id } = req.params
    await deleteSection(id)
    res.json({ message: "Section deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export async function reorderTemplateSections(req, res, next) {
  try {
    const { templateId } = req.params
    const { orderedIds } = req.body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ message: "orderedIds array is required" })
    }

    await reorderSections(templateId, orderedIds)
    res.json({ message: "Sections reordered successfully" })
  } catch (error) {
    next(error)
  }
}
