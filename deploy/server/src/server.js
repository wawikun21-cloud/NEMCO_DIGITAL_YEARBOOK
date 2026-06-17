import app from "./app.js"
import { config } from "./config/env.js"

app.listen(config.port, "0.0.0.0", () => {
  console.log(`API server running on port ${config.port} (${config.nodeEnv})`)
})
