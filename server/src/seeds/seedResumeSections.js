import { supabaseAdmin } from "../config/supabase.js"

const resumeSections = {
  simple: [
    { section_key: "personal", label: "Personal Information", description: "Your full name, job title, email, phone, location and LinkedIn", field_type: "personal", is_required: true, sort_order: 0, config: {} },
    { section_key: "objective", label: "Objective / Summary", description: "A short professional summary or career objective", field_type: "textarea", is_required: false, sort_order: 1, config: { rows: 4 } },
    { section_key: "education", label: "Education", field_type: "education", is_required: true, sort_order: 2, config: {} },
    { section_key: "skills", label: "Skills", field_type: "skills", is_required: true, sort_order: 3, config: {} },
    { section_key: "experience", label: "Work Experience", field_type: "experience", is_required: false, sort_order: 4, config: {} },
    { section_key: "achievements", label: "Achievements", field_type: "achievements", is_required: false, sort_order: 5, config: {} },
  ],
  modern: [
    { section_key: "personal", label: "Personal Information", description: "Your full name, job title, email, phone, location and LinkedIn", field_type: "personal", is_required: true, sort_order: 0, config: {} },
    { section_key: "objective", label: "Professional Summary", description: "A concise summary of your strongest qualifications", field_type: "textarea", is_required: true, sort_order: 1, config: { rows: 4 } },
    { section_key: "education", label: "Education", field_type: "education", is_required: true, sort_order: 2, config: {} },
    { section_key: "skills", label: "Technical Skills", field_type: "skills", is_required: true, sort_order: 3, config: {} },
    { section_key: "experience", label: "Work Experience", field_type: "experience", is_required: false, sort_order: 4, config: {} },
    { section_key: "projects", label: "Projects", field_type: "list", is_required: false, sort_order: 5, config: {} },
    { section_key: "organizations", label: "Organizations", field_type: "list", is_required: false, sort_order: 6, config: {} },
    { section_key: "references", label: "References", field_type: "references", is_required: false, sort_order: 7, config: {} },
  ],
  classic: [
    { section_key: "personal", label: "Personal Information", description: "Your full name, job title, email, phone, location and LinkedIn", field_type: "personal", is_required: true, sort_order: 0, config: {} },
    { section_key: "objective", label: "Career Objective", description: "A formal career objective aligned with the role you are seeking", field_type: "textarea", is_required: true, sort_order: 1, config: { rows: 4 } },
    { section_key: "education", label: "Education", field_type: "education", is_required: true, sort_order: 2, config: {} },
    { section_key: "experience", label: "Work Experience", field_type: "experience", is_required: true, sort_order: 3, config: {} },
    { section_key: "skills", label: "Skills & Competencies", field_type: "skills", is_required: true, sort_order: 4, config: {} },
    { section_key: "achievements", label: "Achievements & Awards", field_type: "achievements", is_required: false, sort_order: 5, config: {} },
    { section_key: "organizations", label: "Organizations & Affiliations", field_type: "list", is_required: false, sort_order: 6, config: {} },
    { section_key: "references", label: "References", field_type: "references", is_required: false, sort_order: 7, config: {} },
  ],
}

async function getTemplateBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from("resume_templates")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch resume template ${slug}: ${error.message}`)
  }

  return data
}

async function seedSectionsForTemplate(template) {
  const sections = resumeSections[template.slug]
  if (!sections) return 0

  for (const section of sections) {
    const { error } = await supabaseAdmin
      .from("resume_sections")
      .upsert({ template_id: template.id, ...section }, { onConflict: "template_id,section_key" })

    if (error) {
      throw new Error(`Failed to seed ${template.slug}/${section.section_key}: ${error.message}`)
    }
  }

  return sections.length
}

async function seed() {
  const slugs = Object.keys(resumeSections)

  for (const slug of slugs) {
    const template = await getTemplateBySlug(slug)
    if (!template) {
      console.warn(`Template "${slug}" not found. Skipping resume sections.`)
      continue
    }

    const count = await seedSectionsForTemplate(template)
    console.log(`Seeded ${count} resume sections for ${template.slug}.`)
  }

  console.log("Resume sections seed complete.")
  process.exit(0)
}

seed().catch((error) => {
  console.error("Resume sections seed failed:", error)
  process.exit(1)
})
