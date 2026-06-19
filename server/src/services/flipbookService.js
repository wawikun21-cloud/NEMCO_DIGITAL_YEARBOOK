import { supabaseAdmin } from "../config/supabase.js"

const FLIPBOOK_SETTINGS_DEFAULTS = {
  enabled: true,
  title: "NEMCO Digital Yearbook",
  subtitle: "Academic Year 2025-2026",
  cover_url: "",
  theme: "default",
  flip_speed: 0.5,
  show_page_numbers: true,
  auto_flip: false,
  auto_flip_interval: 10,
}

export async function getFlipbookSettings() {
  const { data, error } = await supabaseAdmin
    .from("flipbook_settings")
    .select("key, value")

  if (error) {
    throw new Error(`Failed to fetch flipbook settings: ${error.message}`)
  }

  const settings = { ...FLIPBOOK_SETTINGS_DEFAULTS }
  for (const row of data || []) {
    Object.assign(settings, row.value)
  }

  return settings
}

export async function updateFlipbookSettings(updates) {
  const entries = Object.entries(updates)
  if (entries.length === 0) return getFlipbookSettings()

  for (const [key, value] of entries) {
    const { error } = await supabaseAdmin
      .from("flipbook_settings")
      .upsert(
        { key, value: { [key]: value }, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      )

    if (error) {
      throw new Error(`Failed to update flipbook setting "${key}": ${error.message}`)
    }
  }

  return getFlipbookSettings()
}

export async function getFlipbookProfiles({
  page = 1,
  perPage = 25,
  section = null,
  search = null,
} = {}) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabaseAdmin
    .from("flipbook_profiles")
    .select(
      "id, profile_id, section_name, page_order, layout_template, is_included, created_at, updated_at",
      { count: "exact" }
    )
    .order("page_order", { ascending: true })
    .range(from, to)

  if (section) {
    query = query.eq("section_name", section)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch flipbook profiles: ${error.message}`)
  }

  const profiles = data || []
  const profileIds = profiles.map((p) => p.profile_id).filter(Boolean)

  let profileMap = {}
  if (profileIds.length > 0) {
    let profileQuery = supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote, profile_status")
      .in("id", profileIds)

    if (search) {
      profileQuery = profileQuery.or(
        `display_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%,student_number.ilike.%${search}%`
      )
    }

    const { data: profileData } = await profileQuery
    for (const p of profileData || []) {
      profileMap[p.id] = p
    }
  }

  return {
    profiles: profiles.map((p) => ({
      ...p,
      profile: p.profile_id ? profileMap[p.profile_id] || null : null,
    })),
    total: count || 0,
    page,
    perPage,
  }
}

export async function getApprovedProfilesForFlipbook() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote")
    .eq("profile_status", "approved")
    .order("full_name", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch approved profiles: ${error.message}`)
  }

  return data || []
}

export async function addProfileToFlipbook(profileId, { sectionName, layoutTemplate = "default" }) {
  const { data: maxOrder } = await supabaseAdmin
    .from("flipbook_profiles")
    .select("page_order")
    .order("page_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = maxOrder ? (maxOrder.page_order || 0) + 1 : 1

  const { data, error } = await supabaseAdmin
    .from("flipbook_profiles")
    .upsert(
      {
        profile_id: profileId,
        section_name: sectionName || null,
        page_order: nextOrder,
        layout_template: layoutTemplate,
        is_included: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "profile_id" }
    )
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to add profile to flipbook: ${error.message}`)
  }

  return data
}

export async function updateFlipbookProfile(id, { sectionName, pageOrder, layoutTemplate, isIncluded }) {
  const updateData = { updated_at: new Date().toISOString() }
  if (sectionName !== undefined) updateData.section_name = sectionName
  if (pageOrder !== undefined) updateData.page_order = pageOrder
  if (layoutTemplate !== undefined) updateData.layout_template = layoutTemplate
  if (isIncluded !== undefined) updateData.is_included = isIncluded

  const { data, error } = await supabaseAdmin
    .from("flipbook_profiles")
    .update(updateData)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to update flipbook profile: ${error.message}`)
  }

  return data
}

export async function removeProfileFromFlipbook(id) {
  const { error } = await supabaseAdmin
    .from("flipbook_profiles")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to remove profile from flipbook: ${error.message}`)
  }

  return true
}

export async function reorderFlipbookProfiles(orderedIds) {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabaseAdmin
      .from("flipbook_profiles")
      .update({ page_order: i + 1, updated_at: new Date().toISOString() })
      .eq("id", orderedIds[i])

    if (error) {
      throw new Error(`Failed to reorder flipbook profile at position ${i}: ${error.message}`)
    }
  }

  return true
}

export async function getFlipbookSections() {
  const { data, error } = await supabaseAdmin
    .from("flipbook_sections")
    .select("id, name, sort_order")
    .order("sort_order", { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch flipbook sections: ${error.message}`)
  }

  return data || []
}

export async function createFlipbookSection(name) {
  const { data: maxOrder } = await supabaseAdmin
    .from("flipbook_sections")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = maxOrder ? (maxOrder.sort_order || 0) + 1 : 1

  const { data, error } = await supabaseAdmin
    .from("flipbook_sections")
    .insert({ name, sort_order: nextOrder })
    .select()
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to create flipbook section: ${error.message}`)
  }

  return data
}

export async function deleteFlipbookSection(id) {
  const { error } = await supabaseAdmin
    .from("flipbook_sections")
    .delete()
    .eq("id", id)

  if (error) {
    throw new Error(`Failed to delete flipbook section: ${error.message}`)
  }

  return true
}

export async function getPublicFlipbook() {
  const settings = await getFlipbookSettings()

  if (!settings.enabled) {
    return { settings, profiles: [], sections: [] }
  }

  const { data: flipbookProfiles, error: fpError } = await supabaseAdmin
    .from("flipbook_profiles")
    .select("id, profile_id, section_name, page_order, layout_template")
    .eq("is_included", true)
    .order("page_order", { ascending: true })

  if (fpError) {
    throw new Error(`Failed to fetch public flipbook profiles: ${fpError.message}`)
  }

  const profileIds = (flipbookProfiles || []).map((p) => p.profile_id).filter(Boolean)
  let profileMap = {}

  if (profileIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, full_name, student_number, avatar_url, year_level, course_or_strand, section, bio, quote")
      .in("id", profileIds)
      .eq("is_public", true)

    for (const p of profiles || []) {
      profileMap[p.id] = p
    }
  }

  const sections = await getFlipbookSections()

  return {
    settings,
    profiles: (flipbookProfiles || []).map((p) => ({
      ...p,
      profile: profileMap[p.profile_id] || null,
    })),
    sections,
  }
}
