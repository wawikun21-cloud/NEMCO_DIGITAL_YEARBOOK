import { supabaseAdmin } from "../config/supabase.js"

export async function getUsers(filters = {}) {
   let query = supabaseAdmin
     .from("profiles")
     .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,sub_course,section,bio,quote,avatar_url,created_at,updated_at")
     .order("created_at", { ascending: false })

  if (filters.search) {
    const searchTerm = `%${filters.search}%`
    query = query.or([
      `full_name.ilike.${searchTerm}`,
      `email.ilike.${searchTerm}`,
      `student_number.ilike.${searchTerm}`,
    ].join(","))
  }

  if (filters.role) {
    query = query.eq("role", filters.role)
  }

  if (filters.year_level) {
    query = query.eq("year_level", filters.year_level)
  }

  if (filters.course_or_strand) {
    query = query.eq("course_or_strand", filters.course_or_strand)
  }

  if (filters.section) {
    query = query.eq("section", filters.section)
  }

  const BATCH_SIZE = 1000
  let allUsers = []
  let from = 0
  let hasMore = true

  while (hasMore) {
    const to = from + BATCH_SIZE - 1
    const { data: users, error } = await query.range(from, to)

    if (error) {
      throw new Error("Failed to fetch users")
    }

    const batch = users || []
    allUsers = allUsers.concat(batch)
    hasMore = batch.length === BATCH_SIZE
    from = to + 1
  }

  return allUsers
}

export async function getUserById(id) {
   const { data: user, error } = await supabaseAdmin
     .from("profiles")
     .select("id,email,student_number,full_name,display_name,role,status,profile_status,year_level,course_or_strand,sub_course,section,bio,quote,avatar_url,created_at,updated_at")
     .eq("id", id)
     .maybeSingle()

  if (error) {
    throw new Error("Failed to fetch user")
  }

  if (!user) {
    const err = new Error("User not found")
    err.status = 404
    throw err
  }

  return user
}

export async function createUser(data) {
  const { student_number, email, full_name, ...profileFields } = data

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("student_number", student_number)
    .maybeSingle()

  if (existingProfile) {
    const err = new Error("Student number already exists")
    err.status = 409
    throw err
  }

  const { data: existingEmail } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existingEmail) {
    const err = new Error("Email already exists")
    err.status = 409
    throw err
  }

  const defaultPassword = student_number

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      student_number,
      full_name,
    },
  })

  if (authError) {
    if (authError.message?.includes("already registered")) {
      const err = new Error("Email already registered")
      err.status = 409
      throw err
    }
    const err = new Error(authError.message || "Failed to create user")
    err.status = 400
    throw err
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: authUser.user.id,
      email,
      student_number,
      full_name,
      display_name: full_name.split(" ")[0],
      ...profileFields,
    }, { onConflict: "id" })
    .select()
    .maybeSingle()

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
    const err = new Error("Failed to create user profile")
    err.status = 500
    throw err
  }

  return { user: authUser.user, profile }
}

export async function updateUser(id, data) {
  const { data: updated, error } = await supabaseAdmin
    .from("profiles")
    .update(data)
    .eq("id", id)
    .select()
    .maybeSingle()

  if (error) {
    const err = new Error("Failed to update user")
    err.status = 400
    throw err
  }

  if (data.email) {
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      email: data.email,
    })

    if (authError) {
      console.error("Auth email update error:", authError)
    }
  }

  return updated
}

export async function deleteUser(id) {
  const user = await getUserById(id)

  const { error } = await supabaseAdmin.auth.admin.deleteUser(id)

  if (error) {
    const err = new Error("Failed to delete user")
    err.status = 400
    throw err
  }

  return user
}

export async function resetUserPassword(id, redirectTo) {
  const { data: { user }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(id)

  if (getUserError || !user) {
    const err = new Error("User not found")
    err.status = 404
    throw err
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "recovery",
    email: user.email,
    options: redirectTo ? { redirectTo } : undefined,
  })

  if (error) {
    const err = new Error("Failed to generate password reset link")
    err.status = 400
    throw err
  }

  return { link: data?.properties?.action_link, email: user.email }
}

export async function logAudit({ adminId, userId, action, entityType, entityId, oldData, newData, ipAddress, userAgent }) {
  const { error } = await supabaseAdmin
    .from("audit_logs")
    .insert({
      user_id: adminId ?? userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData,
      new_data: newData,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

  if (error) {
    console.error("Audit log error:", error)
  }
}