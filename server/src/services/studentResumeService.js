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

  return { template, sections: sections || [] }
}
