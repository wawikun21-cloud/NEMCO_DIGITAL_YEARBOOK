import { supabaseAdmin } from "../config/supabase.js"

const PASSWORD = "NemcoYearbook@123"

const users = [
  {
    email: "admin@nemco.test",
    studentNumber: "ADMIN-0001",
    fullName: "Admin User",
    displayName: "Admin",
    role: "admin",
    status: "active",
    profileStatus: "approved",
    yearLevel: null,
    courseOrStrand: null,
    section: null,
    bio: "System administrator account",
    quote: "Managing the digital yearbook",
    isPublic: true,
    resumePublic: false,
  },
  {
    email: "user@nemco.test",
    studentNumber: "2026-0001",
    fullName: "Sample User",
    displayName: "Sample User",
    role: "user",
    status: "active",
    profileStatus: "approved",
    yearLevel: "4th Year",
    courseOrStrand: "BS Information Technology",
    section: "Section A",
    bio: "Sample student profile for testing the digital yearbook.",
    quote: "Building memories one page at a time.",
    isPublic: true,
    resumePublic: true,
  },
]

async function seed() {
  const userIdMap = {}

  for (const u of users) {
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("student_number", u.studentNumber)
      .maybeSingle()

    let userId = existing?.id

    if (!userId) {
      const { data: created, error: createError } =
        await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: PASSWORD,
          email_confirm: true,
          user_metadata: {
            full_name: u.fullName,
            display_name: u.displayName,
            student_number: u.studentNumber,
          },
        })

      if (createError) {
        console.error(`Failed to create ${u.email}:`, createError.message)
        continue
      }

      userId = created.user.id
      console.log(`Created auth user: ${u.email} (${userId})`)
    } else {
      console.log(`User already exists: ${u.email} (${userId})`)
    }

    userIdMap[u.role] = userId

    const { error: upsertError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: u.email,
          student_number: u.studentNumber,
          full_name: u.fullName,
          display_name: u.displayName,
          role: u.role,
          status: u.status,
          profile_status: u.profileStatus,
          year_level: u.yearLevel,
          course_or_strand: u.courseOrStrand,
          section: u.section,
          bio: u.bio,
          quote: u.quote,
          is_public: u.isPublic,
          resume_public: u.resumePublic,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )

    if (upsertError) {
      console.error(`Failed to upsert profile for ${u.email}:`, upsertError.message)
    } else {
      console.log(`Profile upserted for: ${u.email}`)
    }
  }

  if (userIdMap.admin && userIdMap.user) {
    await seedAuditLogs(userIdMap.admin, userIdMap.user)
  }

  console.log("Seed complete.")
  process.exit(0)
}

async function seedAuditLogs(adminId, userId) {
  const { count: existingCount } = await supabaseAdmin
    .from("audit_logs")
    .select("id", { count: "exact", head: true })

  if (existingCount && existingCount > 0) {
    console.log(`Audit logs already seeded (${existingCount} entries). Skipping.`)
    return
  }

  const now = Date.now()
  const day = 86400000

  const logs = [
    { user_id: adminId, action: "login", entity_type: "auth", ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 0.1).toISOString() },
    { user_id: adminId, action: "user_created", entity_type: "profile", entity_id: userId, new_data: JSON.stringify({ email: "user@nemco.test", role: "user" }), ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 0.5).toISOString() },
    { user_id: adminId, action: "import_completed", entity_type: "import_batch", new_data: JSON.stringify({ filename: "batch_march.xlsx", total_rows: 50, success_count: 48, failed_count: 2 }), ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 1).toISOString() },
    { user_id: adminId, action: "settings_updated", entity_type: "yearbook_settings", old_data: JSON.stringify({ public_yearbook_enabled: false }), new_data: JSON.stringify({ public_yearbook_enabled: true }), ip_address: "192.168.1.10", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 2).toISOString() },
    { user_id: userId, action: "login", entity_type: "auth", ip_address: "192.168.1.25", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 2.5).toISOString() },
    { user_id: userId, action: "profile_updated", entity_type: "profile", entity_id: userId, old_data: JSON.stringify({ bio: "" }), new_data: JSON.stringify({ bio: "Sample student profile for testing the digital yearbook." }), ip_address: "192.168.1.25", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 3).toISOString() },
    { user_id: userId, action: "resume_created", entity_type: "resume", new_data: JSON.stringify({ title: "My Resume", template: "simple" }), ip_address: "192.168.1.25", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 3.5).toISOString() },
    { user_id: adminId, action: "login", entity_type: "auth", ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 4).toISOString() },
    { user_id: adminId, action: "user_role_changed", entity_type: "profile", old_data: JSON.stringify({ role: "user" }), new_data: JSON.stringify({ role: "admin" }), ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 5).toISOString() },
    { user_id: adminId, action: "import_failed", entity_type: "import_batch", new_data: JSON.stringify({ filename: "bad_batch.xlsx", error: "Missing required columns" }), ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 6).toISOString() },
    { user_id: userId, action: "login_failed", entity_type: "auth", ip_address: "10.0.0.5", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 7).toISOString() },
    { user_id: adminId, action: "user_status_changed", entity_type: "profile", old_data: JSON.stringify({ status: "active" }), new_data: JSON.stringify({ status: "inactive" }), ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 8).toISOString() },
    { user_id: userId, action: "profile_submitted", entity_type: "profile", entity_id: userId, ip_address: "192.168.1.25", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 9).toISOString() },
    { user_id: adminId, action: "profile_approved", entity_type: "profile", entity_id: userId, ip_address: "127.0.0.1", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 9.5).toISOString() },
    { user_id: userId, action: "resume_updated", entity_type: "resume", new_data: JSON.stringify({ title: "My Updated Resume" }), ip_address: "192.168.1.25", user_agent: "Mozilla/5.0", created_at: new Date(now - day * 10).toISOString() },
  ]

  const { error } = await supabaseAdmin.from("audit_logs").insert(logs)
  if (error) {
    console.error("Failed to seed audit logs:", error.message)
  } else {
    console.log(`Seeded ${logs.length} audit log entries.`)
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
