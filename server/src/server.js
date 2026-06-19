import app from "./app.js"
import { config } from "./config/env.js"
import { ensureFlipbookBucket } from "./config/supabase.js"

if (process.env.VERCEL !== "1") {
  app.listen(config.port, "0.0.0.0", async () => {
    console.log(`API server running on port ${config.port} (${config.nodeEnv})`)
    try {
      await ensureFlipbookBucket()
      console.log("Flipbook storage bucket verified.")
    } catch (err) {
      console.error("Failed to verify flipbook bucket:", err.message)
    }
  })
}

export default app
