import { z } from "zod"

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  display_name: z.string().max(50).optional(),
  year_level: z.string().optional(),
  course_or_strand: z.string().optional(),
  section: z.string().optional(),
  bio: z.string().max(500).optional(),
  quote: z.string().max(200).optional(),
  is_public: z.boolean().optional(),
})