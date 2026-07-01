import { Storage } from '@google-cloud/storage'
import { config } from './env.js'

const opts = {}
if (config.gcs.projectId) opts.projectId = config.gcs.projectId
if (config.gcs.keyFile) opts.keyFilename = config.gcs.keyFile
if (config.gcs.credentials) {
  try {
    opts.credentials = JSON.parse(config.gcs.credentials)
  } catch (e) {
    // ignore parse errors, SDK will use keyFile or env
  }
}

const storage = new Storage(opts)
const bucket = storage.bucket(config.gcs.bucket)

export { storage, bucket }
