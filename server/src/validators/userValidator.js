import { z } from "zod"

export const createUserSchema = z.object({
  student_number: z.string().trim().regex(/^\d{7}$/, "Student number must be exactly 7 digits"),
  email: z.string().trim().email("Invalid email format"),
  full_name: z.string().trim().min(2, "Full name must be at least 2 characters"),
  role: z.enum(["admin", "user"], "Role must be admin or user"),
  year_level: z.string().trim().min(1, "Year level is required"),
  course_or_strand: z.string().trim().min(1, "Course or strand is required"),
  section: z.string().trim().max(20, "Section too long").optional(),
  bio: z.string().optional(),
  quote: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
  profile_status: z.enum(["draft", "completed", "submitted", "approved", "rejected"]).default("draft"),
})

export const updateUserSchema = createUserSchema.partial()

export const resetPasswordSchema = z.object({
  redirectTo: z.string().url().optional(),
})

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  year_level: z.string().optional(),
  course_or_strand: z.string().optional(),
  section: z.string().optional(),
})