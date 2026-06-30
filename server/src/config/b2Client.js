import { S3Client } from "@aws-sdk/client-s3"
import { config } from "./env.js"

const b2 = new S3Client({
  region: config.b2.region,
  endpoint: config.b2.endpoint,
  credentials: {
    accessKeyId: config.b2.keyId,
    secretAccessKey: config.b2.applicationKey,
  },
})

export default b2
