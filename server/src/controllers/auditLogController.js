import { getAuditLogs, getAuditLogById, getAuditLogFilters } from "../services/auditLogService.js"

export async function listLogs(req, res, next) {
  try {
    const {
      page = 1,
      perPage = 25,
      action,
      entityType,
      userId,
      search,
      dateFrom,
      dateTo,
    } = req.query

    const result = await getAuditLogs({
      page: parseInt(page, 10),
      perPage: parseInt(perPage, 10),
      action: action || null,
      entityType: entityType || null,
      userId: userId || null,
      search: search || null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    })

    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getLog(req, res, next) {
  try {
    const { id } = req.params
    const log = await getAuditLogById(id)

    if (!log) {
      return res.status(404).json({ message: "Audit log not found" })
    }

    res.json({ log })
  } catch (error) {
    next(error)
  }
}

export async function getFilters(req, res, next) {
  try {
    const filters = await getAuditLogFilters()
    res.json(filters)
  } catch (error) {
    next(error)
  }
}
