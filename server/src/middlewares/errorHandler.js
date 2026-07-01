export function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*")
  res.setHeader("Access-Control-Allow-Credentials", "true")

  if (error.name === "ZodError") {
    const message = error.errors[0]?.message || "Invalid request body"
    return res.status(400).json({ message })
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON request body" })
  }

  const status = error.status || 500
  const message = status === 500 ? "Internal server error" : error.message

  if (status === 500) {
    console.error("[ERROR]", error.message, error.stack)
  }

  return res.status(status).json({ message })
}
