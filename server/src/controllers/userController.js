import { createUserSchema, updateUserSchema, resetPasswordSchema, userFiltersSchema } from "../validators/userValidator.js"
import { getUsers, getUserById, createUser, updateUser, deleteUser, resetUserPassword, logAudit } from "../services/userService.js"

export async function getUsersController(req, res, next) {
  try {
    const filters = userFiltersSchema.parse(req.query)
    const users = await getUsers(filters)

    res.json({ users })
  } catch (error) {
    next(error)
  }
}

export async function getUserController(req, res, next) {
  try {
    const user = await getUserById(req.params.id)

    res.json({ user })
  } catch (error) {
    next(error)
  }
}

export async function createUserController(req, res, next) {
  try {
    const data = createUserSchema.parse(req.body)
    const result = await createUser(data)

    await logAudit({
      adminId: req.user.id,
      action: "create_user",
      entityType: "user",
      entityId: result.user.id,
      newData: { email: data.email, student_number: data.student_number },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.status(201).json({ user: result.profile })
  } catch (error) {
    next(error)
  }
}

export async function updateUserController(req, res, next) {
  try {
    const id = req.params.id
    const data = updateUserSchema.parse(req.body)
    const oldUser = await getUserById(id)

    const updatedUser = await updateUser(id, data)

    await logAudit({
      adminId: req.user.id,
      action: "update_user",
      entityType: "user",
      entityId: id,
      oldData: oldUser,
      newData: updatedUser,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({ user: updatedUser })
  } catch (error) {
    next(error)
  }
}

export async function deleteUserController(req, res, next) {
  try {
    const id = req.params.id
    const deletedUser = await deleteUser(id)

    await logAudit({
      adminId: req.user.id,
      action: "delete_user",
      entityType: "user",
      entityId: id,
      oldData: deletedUser,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({ message: "User deleted successfully" })
  } catch (error) {
    next(error)
  }
}

export async function resetPasswordController(req, res, next) {
  try {
    const { redirectTo } = resetPasswordSchema.parse(req.body)
    const result = await resetUserPassword(req.params.id, redirectTo)

    await logAudit({
      adminId: req.user.id,
      action: "reset_password",
      entityType: "user",
      entityId: req.params.id,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    })

    res.json({ link: result.link, email: result.email })
  } catch (error) {
    next(error)
  }
}