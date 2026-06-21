import { loginSchema, changePasswordSchema } from "../validators/authValidator.js"
import { loginWithStudentId, changePassword } from "../services/authService.js"
import { logAudit } from "../services/userService.js"

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body)
    const result = await loginWithStudentId(body)

    res.json({
      message: "Login successful",
      user: result.user,
      session: result.session,
      profile: result.profile,
    })
  } catch (error) {
    next(error)
  }
}

export async function changePasswordController(req, res, next) {
  try {
    const data = changePasswordSchema.parse(req.body)
    await changePassword(req.user.id, data.currentPassword, data.newPassword)

    await logAudit({
      userId: req.user.id,
      action: "change_password",
      entityType: "user",
      entityId: req.user.id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    next(error)
  }
}
