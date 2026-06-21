import { supabaseAdmin } from "../config/supabase.js"

const PROFILE_COLUMNS =
  "id,email,student_number,full_name,role,status,profile_status,course_or_strand,about_me,quote,skills,avatar_url,is_public,qr_data,contact_number,website,home_address,school,year_graduated,social_link1,social_link2,social_link3"

const PUBLIC_PROFILE_BASE_URL = process.env.PUBLIC_PROFILE_BASE_URL || "https://yourapp.com/u"

function normalizePublicBaseUrl(baseUrl) {
  const value = (baseUrl || PUBLIC_PROFILE_BASE_URL).replace(/\/+$/, "")
  try {
    const parsed = new URL(value)
    if (baseUrl && parsed.pathname === "/") return `${value}/u`
  } catch {
    return value
  }
  return value
}

// The QR always encodes a stable public profile URL rather than raw data,
// so the QR itself never needs to change shape — only the data behind it does.
function buildQrPayload(profile, baseUrl) {
  return `${normalizePublicBaseUrl(baseUrl)}/${profile.student_number || profile.id}`
}

export async function getProfileByUserId(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to fetch profile")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  return profile
}

export async function getPublicProfileByIdentifier(identifier) {
  const normalizedIdentifier = identifier.trim()

  if (!normalizedIdentifier) {
    const error = new Error("Profile not found or not shared")
    error.status = 404
    throw error
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .or(`student_number.eq.${normalizedIdentifier},id.eq.${normalizedIdentifier}`)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to fetch profile")
  }

  if (!profile || (!profile.is_public && !profile.qr_data)) {
    const notFoundError = new Error("Profile not found or not shared")
    notFoundError.status = 404
    throw notFoundError
  }

  return profile
}

export async function updateProfile(userId, data, publicBaseUrl) {
  const existing = await getProfileByUserId(userId)
  const merged = { ...existing, ...data }

  const updatePayload = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  // Regenerate the QR payload only if a QR already exists — first-time
  // generation stays an explicit user action via "Generate QR".
  if (existing.qr_data) {
    updatePayload.qr_data = buildQrPayload(merged, publicBaseUrl)
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to update profile")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  return profile
}

export async function submitProfile(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({
      profile_status: "submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to submit profile")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  return profile
}

// First-time QR generation, and the regeneration path called after an
// avatar upload (since the photo is part of what the QR-linked profile shows).
export async function generateOrRefreshQrCode(userId, publicBaseUrl) {
  const existing = await getProfileByUserId(userId)
  const qrData = buildQrPayload(existing, publicBaseUrl)

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({
      qr_data: qrData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (error) {
    throw new Error("Failed to generate QR code")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  return profile
}