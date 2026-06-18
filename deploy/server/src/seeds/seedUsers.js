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

  console.log("Seed complete.")
  process.exit(0)
}

seed().catch((err) => {
  console.error("Seed failed:", err)
  process.exit(1)
})
