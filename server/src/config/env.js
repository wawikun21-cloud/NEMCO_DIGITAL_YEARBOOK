import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const parsePort = (value) => {
  const parsedPort = Number(value)
  return Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 5000
}

const parseOrigins = (value) => {
  if (!value) return []
  return value.split(",").map((origin) => origin.trim().replace(/\/+$/, "")).filter(Boolean)
}

export const config = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || "development",
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  allowedOrigins: parseOrigins(process.env.ALLOWED_ORIGINS),
  jwtSecret: process.env.JWT_SECRET,
  b2: {
    keyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
    bucket: process.env.B2_BUCKET_NAME || "flipbook-pdfs",
    endpoint: process.env.B2_ENDPOINT || "",
    region: process.env.B2_REGION || "",
    publicBaseUrl: process.env.B2_PUBLIC_BASE_URL || "",
  },
}

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(", ")}`)
}
