import { supabaseAdmin } from "../config/supabase.js"

export async function getMyResumes(userId) {
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("id, user_id, title, template, data, is_public, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch resumes: ${error.message}`)
  }

  return data || []
}

export async function getMyResumeById(id, userId) {
  const { data, error } = await supabaseAdmin
    .from("resumes")
    .select("id, user_id, title, template, data, is_public, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch resume: ${error.message}`)
  }

  return data
}

export async function createResume(userId, { title, template, data = {} }) {
  const { data: templateData } = await supabaseAdmin
    .from("resume_templates")
    .select("slug")
    .eq("slug", template)
    .eq("is_active", true)
    .maybeSingle()

  const { data: result, error } = await supabaseAdmin
    .from("resumes")
    .insert({
      user_id: userId,
      title: title || "My Resume",
      template: templateData?.slug || "simple",
      data,
      is_public: false,
    })
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to create resume: ${error.message}`)
  }

  return result
}

export async function updateMyResume(id, userId, { title, data, isPublic, template }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (title !== undefined) updateData.title = title
  if (data !== undefined) updateData.data = data
  if (isPublic !== undefined) updateData.is_public = isPublic
  if (template !== undefined) updateData.template = template

  const { data: result, error } = await supabaseAdmin
    .from("resumes")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update resume: ${error.message}`)
  }

  return result
}

export async function deleteMyResume(id, userId) {
  const { error } = await supabaseAdmin
    .from("resumes")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)

  if (error) {
    throw new Error(`Failed to delete resume: ${error.message}`)
  }

  return true
}

const VALID_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
const PHOTO_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

function validateResumePhotoFile(file) {
  if (!file) {
    throw Object.assign(new Error("No photo uploaded"), { status: 400 })
  }

  if (!VALID_PHOTO_TYPES.has(file.mimetype)) {
    throw Object.assign(new Error("Invalid photo type. Only JPEG, PNG, and WebP are allowed."), { status: 400 })
  }

  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    throw Object.assign(new Error("Photo too large. Maximum size is 5MB."), { status: 400 })
  }
}

export async function uploadResumePhoto(id, userId, file) {
  validateResumePhotoFile(file)

  const { data: resume, error: resumeError } = await supabaseAdmin
    .from("resumes")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle()

  if (resumeError) {
    throw new Error(`Failed to fetch resume: ${resumeError.message}`)
  }

  if (!resume) {
    throw Object.assign(new Error("Resume not found"), { status: 404 })
  }

  const filePath = `resume-${id}/photo.${PHOTO_EXTENSIONS[file.mimetype]}`
  const { error: uploadError } = await supabaseAdmin
    .storage
    .from("resume-photos")
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload photo: ${uploadError.message}`)
  }

   const { data: urlData } = supabaseAdmin.storage.from("resume-photos").getPublicUrl(filePath)
   const photoUrl = urlData?.publicUrl ? `${urlData.publicUrl}?v=${Date.now()}` : ""
  const updatedData = {
    ...(resume.data || {}),
    personal: {
      ...(resume.data?.personal || {}),
      photo_url: photoUrl,
    },
  }

  const { data: result, error: updateError } = await supabaseAdmin
    .from("resumes")
    .update({ data: updatedData, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .maybeSingle()

  if (updateError) {
    throw new Error(`Failed to update resume photo: ${updateError.message}`)
  }

  return { resume: result, photoUrl }
}

export async function getPublicTemplates() {
  const { data, error } = await supabaseAdmin
    .from("resume_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }

  return data || []
}

function normalizeDefaultSections(template, defaultSections = []) {
  if (!Array.isArray(defaultSections)) return []

  return defaultSections
    .filter((section) => section?.key && section?.label)
    .map((section, index) => ({
      id: `default-${section.key}`,
      template_id: template.id,
      section_key: section.key,
      label: section.label,
      description: section.description || null,
      icon: section.icon || null,
      field_type: section.field_type || 'text',
      is_required: Boolean(section.is_required),
      sort_order: section.sort_order ?? index + 1,
      config: section.config || {},
    }))
}

export async function getTemplateWithSections(slug) {
  const { data: template, error: templateError } = await supabaseAdmin
    .from("resume_templates")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle()

  if (templateError) {
    throw new Error(`Failed to fetch template: ${templateError.message}`)
  }

  if (!template) {
    return null
  }

  const { data: sections, error: sectionsError } = await supabaseAdmin
    .from("resume_sections")
    .select("*")
    .eq("template_id", template.id)
    .order("sort_order", { ascending: true })

  if (sectionsError) {
    throw new Error(`Failed to fetch sections: ${sectionsError.message}`)
  }

  const normalizedSections = normalizeDefaultSections(template, template.default_sections)
  const resolvedSections = sections && sections.length > 0 ? sections : normalizedSections

  return { template, sections: resolvedSections || [] }
}
