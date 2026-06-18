import { getDashboard } from "../services/dashboardService.js"

export async function getDashboardController(req, res, next) {
  try {
    const data = await getDashboard()
    res.json(data)
  } catch (error) {
    next(error)
  }
}