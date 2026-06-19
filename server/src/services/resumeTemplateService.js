import { supabaseAdmin } from "../config/supabase.js"

export async function getTemplates({ includeInactive = false } = {}) {
  let query = supabaseAdmin
    .from("resume_templates")
    .select("*")
    .order("sort_order", { ascending: true })

  if (!includeInactive) {
    query = query.eq("is_active", true)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`)
  }

  return data || []
}

export async function getTemplateById(id) {
  const { data, error } = await supabaseAdmin
    .from("resume_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch template: ${error.message}`)
  }

  return data
}

export async function getTemplateBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from("resume_templates")
    .select("*")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch template: ${error.message}`)
  }

  return data
}

export async function createTemplate({ name, slug, description, thumbnail_url, default_sections, is_active = true, sort_order = 0 }) {
  const { data: maxOrder } = await supabaseAdmin
    .from("resume_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const order = sort_order || (maxOrder ? (maxOrder.sort_order || 0) + 1 : 1)

  const { data, error } = await supabaseAdmin
    .from("resume_templates")
    .insert({
      name,
      slug,
      description: description || null,
      thumbnail_url: thumbnail_url || null,
      default_sections: default_sections || [],
      is_active,
      sort_order: order,
    })
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to create template: ${error.message}`)
  }

  return data
}

export async function updateTemplate(id, { name, description, thumbnail_url, default_sections, is_active, is_default, sort_order }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url
  if (default_sections !== undefined) updateData.default_sections = default_sections
  if (is_active !== undefined) updateData.is_active = is_active
  if (is_default !== undefined) updateData.is_default = is_default
  if (sort_order !== undefined) updateData.sort_order = sort_order

  if (is_default) {
    await supabaseAdmin
      .from("resume_templates")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .neq("id", id)
  }

  const { data, error } = await supabaseAdmin
    .from("resume_templates")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update template: ${error.message}`)
  }

  return data
}

export async function deleteTemplate(id) {
  const { data: template } = await supabaseAdmin
    .from("resume_templates")
    .select("is_default")
    .eq("id", id)
    .maybeSingle()

  if (template?.is_default) {
    throw new Error("Cannot delete the default template")
  }

  const { error } = await supabaseAdmin
    .from("resume_templates")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to delete template: ${error.message}`)
  }

  return true
}

export async function getTemplateSections(templateId) {
  const { data, error } = await supabaseAdmin
    .from("resume_sections")
    .select("*")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch template sections: ${error.message}`)
  }

  return data || []
}

export async function addSection(templateId, { section_key, label, description, icon, field_type = "text", is_required = false, sort_order = 0, config = {} }) {
  const { data: maxOrder } = await supabaseAdmin
    .from("resume_sections")
    .select("sort_order")
    .eq("template_id", templateId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const order = sort_order || (maxOrder ? (maxOrder.sort_order || 0) + 1 : 1)

  const { data, error } = await supabaseAdmin
    .from("resume_sections")
    .insert({
      template_id: templateId,
      section_key,
      label,
      description: description || null,
      icon: icon || null,
      field_type,
      is_required,
      sort_order: order,
      config,
    })
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to add section: ${error.message}`)
  }

  return data
}

export async function updateSection(id, { label, description, icon, field_type, is_required, sort_order, config }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (label !== undefined) updateData.label = label
  if (description !== undefined) updateData.description = description
  if (icon !== undefined) updateData.icon = icon
  if (field_type !== undefined) updateData.field_type = field_type
  if (is_required !== undefined) updateData.is_required = is_required
  if (sort_order !== undefined) updateData.sort_order = sort_order
  if (config !== undefined) updateData.config = config

  const { data, error } = await supabaseAdmin
    .from("resume_sections")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update section: ${error.message}`)
  }

  return data
}

export async function deleteSection(id) {
  const { error } = await supabaseAdmin
    .from("resume_sections")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to delete section: ${error.message}`)
  }

  return true
}

export async function reorderSections(templateId, orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabaseAdmin
      .from("resume_sections")
      .update({ sort_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i])
      .eq("template_id", templateId)

    if (error) {
      throw new Error(`Failed to reorder section at position ${i}: ${error.message}`)
    }
  }

  return true
}
