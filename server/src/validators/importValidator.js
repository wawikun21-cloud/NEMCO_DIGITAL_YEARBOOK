import { z } from "zod"

const VALID_ROLES = ["admin", "user"]

const normalizeRole = (value) => {
  if (typeof value !== "string") return value
  const role = value.trim().toLowerCase()
  return role === "student" ? "user" : role
}

const roleSchema = z
  .any()
  .transform(normalizeRole)
  .pipe(z.enum(VALID_ROLES, { message: "Role must be 'admin' or 'user'" }))

/*
  With { raw: false } in parseExcelFile, SheetJS returns every cell as a
  formatted string — so student_number "0026284" stays "0026284".

  We keep z.coerce.string() as a belt-and-suspenders measure (it is a no-op
  when the value is already a string, but safely handles any edge case where
  a raw number slips through).  This does NOT alter a string value at all, so
  leading zeros are still preserved.
*/
export const importRowSchema = z.object({
   student_number:   z.coerce.string().trim().min(1, "Student number is required"),
   email:            z.string().trim().email("Invalid email format"),
   full_name:        z.string().trim().min(1, "Full name is required"),
   role:             roleSchema,
   year_level:       z.coerce.string().trim().min(1, "Year level is required"),
   course_or_strand: z.string().trim().min(1, "Course or strand is required"),
   sub_course:       z.string().trim().nullish().transform((v) => v || ""),
   section:          z.string().trim().nullish().transform((v) => v || ""),
   display_name:     z.string().trim().nullish().transform((v) => v || ""),
   bio:              z.string().trim().nullish().transform((v) => v || ""),
   quote:            z.string().trim().nullish().transform((v) => v || ""),
})

export const validateFile = (buffer, filename) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("No file uploaded")
  }

  const ext = filename?.toLowerCase().split(".").pop()
  if (!["xlsx", "xls"].includes(ext)) {
    throw new Error("Invalid file type. Only .xlsx and .xls files are allowed")
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("File size exceeds 5MB limit")
  }

  return true
}

export const validateRequiredColumns = (headers) => {
  const requiredColumns = [
    "student_number",
    "email",
    "full_name",
    "role",
    "year_level",
    "course_or_strand",
  ]
  const missing = requiredColumns.filter((col) => !headers.includes(col))
  if (missing.length > 0) {
    throw new Error(`Missing required columns: ${missing.join(", ")}`)
  }
}