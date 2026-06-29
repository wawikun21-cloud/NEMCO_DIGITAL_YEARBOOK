import { z } from "zod"

export const updateProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),

  // student_number and email are intentionally NOT included here — they're
  // disabled in the edit UI and should only ever change via an admin flow,
  // not a self-service profile update. If you ever need to allow them,
  // add them back here AND remove the `disabled` flag in EditProfileDialog.

   school: z.string().trim().max(120).optional(),
   course_or_strand: z.string().trim().max(100).optional(),
   sub_course: z.string().trim().max(100).optional(),
   year_graduated: z.string().trim().max(20).optional(),
  home_address: z.string().trim().max(300).optional(),
  contact_number: z.string().trim().max(30).optional(),
  website: z.string().trim().max(100).optional(),
  social_link1: z.string().trim().max(200).optional(),
  social_link2: z.string().trim().max(200).optional(),
  social_link3: z.string().trim().max(200).optional(),

  // These three were missing entirely before, which is why edits to them
  // silently disappeared — Zod drops any key not declared in the schema.
  about_me: z.string().trim().max(110).optional(),
  quote: z.string().trim().max(200).optional(),
  skills: z.array(z.string().trim().min(1).max(30)).max(3).optional(),
})