import {
  getFlipbookSettings,
  updateFlipbookSettings,
  getFlipbookProfiles,
  getApprovedProfilesForFlipbook,
  addProfileToFlipbook,
  updateFlipbookProfile,
  removeProfileFromFlipbook,
  reorderFlipbookProfiles,
  getFlipbookSections,
  createFlipbookSection,
  deleteFlipbookSection,
  getPublicFlipbook,
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

export async function fetchProfiles(req, res, next) {
  try {
    const { page = 1, perPage = 25, section, search } = req.query

    const result = await getFlipbookProfiles({
      page: parseInt(page, 10),
      perPage: parseInt(perPage, 10),
      section: section || null,
      search: search || null,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function fetchApprovedProfiles(req, res, next) {
  try {
    const profiles = await getApprovedProfilesForFlipbook()
    res.json({ profiles })
  } catch (error) {
    next(error)
  }
}

export async function addProfile(req, res, next) {
  try {
    const { profileId, sectionName, layoutTemplate } = req.body

    if (!profileId) {
      return res.status(400).json({ message: "profileId is required" })
    }

    const result = await addProfileToFlipbook(profileId, { sectionName, layoutTemplate })
    res.json({ profile: result })
  } catch (error) {
    next(error)
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { id } = req.params
    const { sectionName, pageOrder, layoutTemplate, isIncluded } = req.body

    const result = await updateFlipbookProfile(id, {
      sectionName,
      pageOrder,
      layoutTemplate,
      isIncluded,
    })

    if (!result) {
      return res.status(404).json({ message: "Flipbook profile not found" })
    }

    res.json({ profile: result })
  } catch (error) {
    next(error)
  }
}

export async function removeProfile(req, res, next) {
  try {
    const { id } = req.params
    await removeProfileFromFlipbook(id)
    res.json({ message: "Profile removed from flipbook" })
  } catch (error) {
    next(error)
  }
}

export async function reorderProfiles(req, res, next) {
  try {
    const { orderedIds } = req.body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ message: "orderedIds array is required" })
    }

    await reorderFlipbookProfiles(orderedIds)
    res.json({ message: "Flipbook reordered successfully" })
  } catch (error) {
    next(error)
  }
}

export async function fetchSections(req, res, next) {
  try {
    const sections = await getFlipbookSections()
    res.json({ sections })
  } catch (error) {
    next(error)
  }
}

export async function addSection(req, res, next) {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: "Section name is required" })
    }

    const section = await createFlipbookSection(name)
    res.json({ section })
  } catch (error) {
    next(error)
  }
}

export async function removeSection(req, res, next) {
  try {
    const { id } = req.params
    await deleteFlipbookSection(id)
    res.json({ message: "Section deleted" })
  } catch (error) {
    next(error)
  }
}

export async function fetchPublicFlipbook(req, res, next) {
  try {
    const result = await getPublicFlipbook()
    res.json(result)
  } catch (error) {
    next(error)
  }
}
