import { createClient } from "@supabase/supabase-js"
import { config } from "./env.js"

export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const supabaseAnon = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function ensureFlipbookBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) return

  const exists = buckets?.some((b) => b.name === "flipbook-pdfs")
  if (!exists) {
    await supabaseAdmin.storage.createBucket("flipbook-pdfs", { public: true })
  }
}

export async function ensureResumePhotoBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) return

  const exists = buckets?.some((b) => b.name === "resume-photos")
  if (!exists) {
    await supabaseAdmin.storage.createBucket("resume-photos", {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    })
  }
}
