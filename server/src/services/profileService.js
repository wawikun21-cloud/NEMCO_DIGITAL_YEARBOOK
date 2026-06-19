import { supabaseAdmin } from "../config/supabase.js"

export async function getProfileByUserId(userId) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,is_public")
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

export async function updateProfile(userId, data) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,is_public")
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
    .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,is_public")
    .maybeSingle()

  if (error) {
    throw new Error("Failed to submit profile")
  }

  if (!profile) {
    throw new Error("Profile not found")
  }

  return profile
}