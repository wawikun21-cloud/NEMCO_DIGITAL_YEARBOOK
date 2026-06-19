import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import path from "path"
import { fileURLToPath } from "url"
import { config } from "./config/env.js"
import authRoutes from "./routes/authRoutes.js"
import importRoutes from "./routes/importRoutes.js"
import auditLogRoutes from "./routes/auditLogRoutes.js"
import resumeRoutes from "./routes/resumeRoutes.js"
import resumeTemplateRoutes from "./routes/resumeTemplateRoutes.js"
import flipbookRoutes from "./routes/flipbookRoutes.js"
import { errorHandler } from "./middlewares/errorHandler.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

const app = express()

app.disable("x-powered-by")
app.use(helmet({
  contentSecurityPolicy: false,
}))

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (config.allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error("CORS origin is not allowed"))
  },
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json({ limit: "1mb" }))
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"))

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "digital-year-book-api" })
})

app.use("/api/auth", authRoutes)
app.use("/api/admin/import", importRoutes)
app.use("/api/admin", auditLogRoutes)
app.use("/api/admin", resumeRoutes)
app.use("/api/admin", resumeTemplateRoutes)
app.use("/api/admin", flipbookRoutes)

if (config.nodeEnv === "production" && process.env.VERCEL !== "1") {
  const clientDistPath = path.resolve(__dirname, "../../client/dist")
  app.use(express.static(clientDistPath))

  app.use((req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientDistPath, "index.html"))
    }
  })
}

app.use(errorHandler)

export default app
