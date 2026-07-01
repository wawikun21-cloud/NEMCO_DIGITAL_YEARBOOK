import { S3Client } from "@aws-sdk/client-s3"
import { config } from "./env.js"

const r2 = new S3Client({
  region: config.r2.region || "auto",
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
})

export default r2
