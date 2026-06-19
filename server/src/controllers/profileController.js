import { getProfileByUserId, updateProfile, submitProfile } from "../services/profileService.js"
import { uploadAvatar, getAvatarHistory } from "../services/avatarService.js"
import { updateProfileSchema } from "../validators/profileValidator.js"
import { validateAvatarFile } from "../validators/avatarValidator.js"
import { logAudit } from "../services/userService.js"

export async function getMyProfileController(req, res, next) {
  try {
    const profile = await getProfileByUserId(req.user.id)

    res.json({ profile })
  } catch (error) {
    next(error)
  }
}

export async function updateMyProfileController(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body)
    const oldProfile = await getProfileByUserId(req.user.id)
    const updatedProfile = await updateProfile(req.user.id, data)

    await logAudit({
      adminId: req.user.id,
      action: "update_profile",
      entityType: "profile",
      entityId: req.user.id,
      oldData: oldProfile,
      newData: updatedProfile,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({ profile: updatedProfile })
  } catch (error) {
    next(error)
  }
}

export async function submitProfileController(req, res, next) {
  try {
    const oldProfile = await getProfileByUserId(req.user.id)
    const updatedProfile = await submitProfile(req.user.id)

    await logAudit({
      adminId: req.user.id,
      action: "submit_profile",
      entityType: "profile",
      entityId: req.user.id,
      oldData: oldProfile,
      newData: updatedProfile,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({ profile: updatedProfile })
  } catch (error) {
    next(error)
  }
}

export async function uploadAvatarController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const file = validateAvatarFile(req.file)
    const result = await uploadAvatar(
      req.user.id,
      file.buffer,
      file.filename,
      file.mimeType,
      file.size
    )

    const { avatarUrl, uploadRecord, previousAvatarUrl } = result

    await logAudit({
      userId: req.user.id,
      action: "upload_avatar",
      entityType: "profile",
      entityId: req.user.id,
      oldData: { avatar_url: previousAvatarUrl },
      newData: { avatar_url: avatarUrl },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    const profile = result.profile || await getProfileByUserId(req.user.id)

    res.json({
      profile,
      avatarUrl,
      uploadId: uploadRecord?.id || null,
    })
  } catch (error) {
    if (error.message.includes("Invalid file type") || error.message.includes("File too large") || error.message.includes("No file")) {
      return res.status(400).json({ message: error.message })
    }
    next(error)
  }
}

export async function getAvatarHistoryController(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const perPage = parseInt(req.query.perPage) || 25

    const result = await getAvatarHistory(req.user.id, page, perPage)

    res.json(result)
  } catch (error) {
    next(error)
  }
}