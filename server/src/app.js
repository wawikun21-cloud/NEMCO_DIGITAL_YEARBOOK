import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import { config } from "./config/env.js"
import authRoutes from "./routes/authRoutes.js"
import { errorHandler } from "./middlewares/errorHandler.js"

const app = express()

app.disable("x-powered-by")
app.use(helmet())

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
app.use(morgan("dev"))

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "digital-year-book-api" })
})

app.use("/api/auth", authRoutes)

app.use(errorHandler)

export default app
