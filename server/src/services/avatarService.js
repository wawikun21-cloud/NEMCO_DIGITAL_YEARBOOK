import { supabaseAdmin } from "../config/supabase.js"

export async function uploadAvatar(userId, fileBuffer, filename, mimeType, size) {
  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!validMimeTypes.includes(mimeType)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.")
  }

  const maxSize = 2 * 1024 * 1024
  if (size > maxSize) {
    throw new Error("File too large. Maximum size is 2MB.")
  }

  const { data: currentProfile } = await supabaseAdmin
    .from("profiles")
    .select("avatar_url")
    .eq("id", userId)
    .single()

  const oldAvatarUrl = currentProfile?.avatar_url || null

  const fileExt = filename.split(".").pop()?.toLowerCase() || "jpg"
  const storagePath = `${userId}/avatar.${fileExt}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from("avatars")
    .upload(storagePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`)
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("avatars")
    .getPublicUrl(storagePath)

  const avatarUrl = publicUrlData.publicUrl

  const { data: updatedProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single()

  if (profileError) {
    console.error("[PROFILE UPDATE ERROR]", profileError.message)
  }

  const { data: uploadRecord, error: recordError } = await supabaseAdmin
    .from("avatar_uploads")
    .insert({
      user_id: userId,
      file_path: storagePath,
      file_name: filename,
      mime_type: mimeType,
      file_size: size,
      old_avatar_url: oldAvatarUrl,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (recordError) {
    console.error("[AVATAR METADATA ERROR]", {
      message: recordError.message,
      storagePath,
      userId,
    })
    throw new Error(`Failed to save avatar metadata: ${recordError.message}`)
  }

  return {
    avatarUrl,
    uploadRecord: uploadRecord || null,
    previousAvatarUrl: oldAvatarUrl,
    profile: updatedProfile || null,
  }
}

export async function getAvatarHistory(userId, page = 1, perPage = 25) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  const { data, error, count } = await supabaseAdmin
    .from("avatar_uploads")
    .select("id, file_name, mime_type, file_size, file_path, old_avatar_url, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(`Failed to fetch avatar history: ${error.message}`)
  }

  return {
    uploads: data || [],
    total: count || 0,
    page,
    perPage,
  }
}