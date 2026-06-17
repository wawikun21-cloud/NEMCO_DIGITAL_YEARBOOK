import { loginSchema } from "../validators/authValidator.js"
import { loginWithStudentId } from "../services/authService.js"

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
