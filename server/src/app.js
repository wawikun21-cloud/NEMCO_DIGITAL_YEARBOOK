import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"
import { config } from "./config/env.js"
import authRoutes from "./routes/authRoutes.js"
import importRoutes from "./routes/importRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import auditLogRoutes from "./routes/auditLogRoutes.js"
import resumeRoutes from "./routes/resumeRoutes.js"
import resumeTemplateRoutes from "./routes/resumeTemplateRoutes.js"
import studentResumeRoutes from "./routes/studentResumeRoutes.js"
import flipbookRoutes from "./routes/flipbookRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js"
import profileRoutes from "./routes/profileRoutes.js"
import memoriesRoutes from "./routes/memoriesRoutes.js"
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
app.use(express.json({ limit: "10mb" }))
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"))

app.post("/api/test-no-middleware", (req, res) => {
  let total = 0
  req.on("data", (chunk) => { total += chunk.length })
  req.on("end", () => {
    console.log("[NO-MIDDLEWARE] Received", total, "bytes")
    res.json({ received: total })
  })
})

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "digital-year-book-api" })
})

app.post("/api/test-upload", (req, res) => {
  console.log("[TEST] Content-Type:", req.headers["content-type"])
  let total = 0
  req.on("data", (chunk) => { total += chunk.length })
  req.on("end", () => {
    console.log("[TEST] Received", total, "bytes")
    res.json({ received: total })
  })
})

const testUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

app.post("/api/test-multer", testUpload.single("file"), (req, res) => {
  console.log("[MULTER] File:", req.file ? req.file.originalname : "none", req.file ? req.file.size : 0)
  res.json({ success: true, fileName: req.file?.originalname, size: req.file?.size })
})

app.post("/api/test-upload-full", testUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }
    const { originalname, buffer, size, mimetype } = req.file
    console.log("[TEST-FULL] Starting Supabase upload:", originalname, size, "bytes")
    const { uploadPdfFile } = await import("./services/fileUploadService.js")
    const { publicUrl, filePath } = await uploadPdfFile(buffer, originalname, mimetype)
    console.log("[TEST-FULL] Supabase upload done:", filePath)
    res.json({ fileUrl: publicUrl, filePath, fileName: originalname, fileSize: size })
  } catch (error) {
    console.error("[TEST-FULL] Error:", error.message)
    res.status(500).json({ message: error.message })
  }
})

app.use("/api/auth", authRoutes)
app.use("/api/admin/import", importRoutes)
app.use("/api/admin/users", userRoutes)
app.use("/api/admin", auditLogRoutes)
app.use("/api/admin", resumeRoutes)
app.use("/api/admin", resumeTemplateRoutes)
app.use("/api", studentResumeRoutes)
app.use("/api/admin", flipbookRoutes)
app.use("/api/admin/upload", uploadRoutes)
app.use("/api/admin", dashboardRoutes)
app.use("/api/profiles", profileRoutes)
app.use("/api/memories", memoriesRoutes)

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
