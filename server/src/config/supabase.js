import { createClient } from "@supabase/supabase-js"
import { config } from "./env.js"

export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    },
  },
})

export const supabaseAnon = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function ensureAvatarBucket() {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
  if (listError) return

  const exists = buckets?.some((b) => b.name === "avatars")
  if (!exists) {
    await supabaseAdmin.storage.createBucket("avatars", {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    })
  } else {
    await supabaseAdmin.storage.updateBucket("avatars", {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    })
  }
}

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
