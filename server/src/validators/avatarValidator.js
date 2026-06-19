import { z } from "zod"

export const avatarUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  mimeType: z.enum(["image/jpeg", "image/png", "image/gif", "image/webp"], {
    error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
  }),
  size: z.number().max(2 * 1024 * 1024, "File too large. Maximum size is 2MB."),
})

export function validateAvatarFile(file) {
  if (!file) {
    throw new Error("No file provided")
  }

  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  if (!validMimeTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.")
  }

  const maxSize = 2 * 1024 * 1024
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 2MB.")
  }

  return {
    filename: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    buffer: file.buffer,
  }
}