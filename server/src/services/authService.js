import { supabaseAdmin } from "../config/supabase.js"

const normalizeStudentNumber = (value) => {
  const normalized = String(value).trim()
  if (!normalized) return undefined
  return normalized.padStart(7, "0")
}

export async function loginWithStudentId({ studentId, password }) {
  const identifier = normalizeStudentNumber(studentId)

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id,email,role,status,student_number")
    .ilike("student_number", identifier)
    .maybeSingle()

  if (profileError) {
    throw new Error("Unable to find your account")
  }

  if (!profile) {
    throw new Error("No account found for this Student ID")
  }

  if (profile.status !== "active") {
    throw new Error("This account is inactive. Please contact an administrator")
  }

  if (!["admin", "user"].includes(profile.role)) {
    throw new Error("This account does not have a valid role")
  }

  const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
    email: profile.email,
    password,
  })

  if (authError) {
    throw new Error("Invalid Student ID or password")
  }

  const { data: publicProfile, error: publicProfileError } = await supabaseAdmin
    .from("profiles")
    .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,section,bio,quote,avatar_url,is_public,resume_public,social_link1,social_link2,social_link3")
    .eq("id", profile.id)
    .maybeSingle()

  if (publicProfileError || !publicProfile) {
    throw new Error("Login succeeded but profile data could not be loaded")
  }

  return {
    user: authData.user,
    session: authData.session,
    profile: publicProfile,
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle()

  if (!profile) {
    throw new Error("User not found")
  }

  const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  })

  if (signInError) {
    throw new Error("Current password is incorrect")
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (updateError) {
    throw new Error(updateError.message || "Failed to change password")
  }

  return { success: true }
}
