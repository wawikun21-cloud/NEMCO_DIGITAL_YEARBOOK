import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

dotenv.config()

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUCKET_NAME = "flipbook-pdfs"

async function setup() {
  console.log("Checking Supabase Storage...")

  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()

  if (listError) {
    console.error("Error listing buckets:", listError.message)
    process.exit(1)
  }

  console.log("Existing buckets:", buckets?.map(b => b.name))

  const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME)

  if (bucketExists) {
    console.log(`Bucket "${BUCKET_NAME}" already exists.`)
  } else {
    console.log(`Creating bucket "${BUCKET_NAME}"...`)
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: ["application/pdf"],
    })

    if (createError) {
      console.error("Error creating bucket:", createError.message)
      process.exit(1)
    }
    console.log(`Bucket "${BUCKET_NAME}" created successfully!`)
  }
}

setup()
