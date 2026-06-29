import { supabaseAdmin } from "../config/supabase.js"
import * as XLSX from "xlsx"
import { importRowSchema, validateRequiredColumns } from "../validators/importValidator.js"

// ─── Student number normalization ───
const normalizeStudentNumber = (value) => {
  const normalized = normalizeTextValue(value)
  if (!normalized) return undefined
  return normalized.padStart(7, "0")
}

// ─── Default password = padded student_number (e.g. "0026284") ───
// Must be padded before use so short numeric IDs meet the minimum 6 char length.
const getDefaultImportPassword = (rowData) => String(rowData.student_number)

const normalizeTextValue = (value) => {
  if (value == null) return undefined
  return String(value).trim()
}

const normalizeRoleValue = (value) => {
  if (value == null) return ""
  return String(value).trim().toLowerCase()
}

export async function parseExcelFile(buffer, sheetName) {
  const workbook = XLSX.read(buffer, { type: "buffer" })
  const resolvedSheetName = sheetName || workbook.SheetNames[0]
  if (!workbook.SheetNames.includes(resolvedSheetName)) {
    throw new Error(`Sheet "${resolvedSheetName}" not found. Available sheets: ${workbook.SheetNames.join(", ")}`)
  }
  const sheet = workbook.Sheets[resolvedSheetName]

  /*
    KEY FIX: { raw: false } tells SheetJS to return every cell value as the
    formatted string that Excel *displays* — not the underlying JS number.

    Without this, a cell formatted as "0026284" (with a leading-zero custom
    format, or stored as text) is returned as the number 26284, which then
    gets String()-coerced to "26284", silently dropping the leading zero.

    With { raw: false }:
      - "0026284" → "0026284"   ✅  leading zero preserved
      - "26284"   → "26284"     ✅  unaffected
      - "admin"   → "admin"     ✅  strings pass through unchanged
      - dates     → formatted date string (acceptable for our fields)

    This is the correct approach for any sheet where cell formatting matters
    (student numbers, IDs, zip codes, phone numbers, etc.).
  */
  const data = XLSX.utils.sheet_to_json(sheet, { raw: false })

  if (data.length === 0) {
    throw new Error("Excel file is empty or has no data rows")
  }

  // Normalise header keys to lower_snake_case for the required-columns check
  const headers = Object.keys(data[0]).map((h) => h.toLowerCase().trim())
  validateRequiredColumns(headers)

  return data.map((row, index) => ({
    rowNumber: index + 2,
    data: row,
  }))
}

export async function validateRow(row) {
  // Student numbers are padded to 7 digits in normalizeStudentNumber above.
  // We normalise for safety (trim, lowercase role, handle Title Case keys).
  const rawStudentNumber = row.student_number ?? row["Student Number"]
  const rawYearLevel     = row.year_level     ?? row["Year Level"]
  const rawSection       = row.section        ?? row["Section"]
  const rawDisplayName   = row.display_name   ?? row["Display Name"]

   const normalizedRow = {
     student_number:   normalizeStudentNumber(rawStudentNumber),
     email:            normalizeTextValue(row.email            ?? row["Email"]),
     full_name:        normalizeTextValue(row.full_name        ?? row["Full Name"]),
     role:             normalizeRoleValue(row.role             ?? row["Role"]),
     year_level:       normalizeTextValue(rawYearLevel),
     course_or_strand: normalizeTextValue(row.course_or_strand ?? row["Course or Strand"]),
     sub_course:       normalizeTextValue(row.sub_course       ?? row["Sub-Course"] ?? row["Sub Course"] ?? row["Major"]),
     section:          normalizeTextValue(rawSection),
     display_name:     normalizeTextValue(rawDisplayName),
     bio:              normalizeTextValue(row.bio              ?? row["Bio"]),
     quote:            normalizeTextValue(row.quote            ?? row["Quote"]),
   }

  try {
    return { valid: true, data: importRowSchema.parse(normalizedRow) }
  } catch (error) {
    return { valid: false, data: normalizedRow, errors: error.errors ?? [{ message: error.message }] }
  }
}

export async function createUserFromRow(rowData) {
  // Guard: duplicate student number
  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, email, student_number")
    .eq("student_number", rowData.student_number)
    .maybeSingle()

  if (existingProfile) {
    throw new Error(
      `Student number ${rowData.student_number} already exists (user: ${existingProfile.email})`
    )
  }

  // Guard: duplicate email
  const { data: existingEmail } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", rowData.email)
    .maybeSingle()

  if (existingEmail) {
    throw new Error(`Email ${rowData.email} already exists`)
  }

  // Default password = padded student_number string (e.g. "0026284").
  // normalizeStudentNumber already enforces 7 digits for numeric IDs.
  const defaultPassword = getDefaultImportPassword(rowData)

  // Create Supabase Auth user
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: rowData.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: {
      full_name: rowData.full_name,
      display_name: rowData.display_name || rowData.full_name,
      student_number: rowData.student_number,
    },
  })

  if (authError) {
    throw new Error(`Auth creation failed: ${authError.message}`)
  }

  const userId = authData.user.id

   // Create profile record
   const { error: profileError } = await supabaseAdmin
     .from("profiles")
     .upsert(
       {
         id: userId,
         email: rowData.email,
         student_number: rowData.student_number,
         full_name: rowData.full_name,
         display_name: rowData.display_name || rowData.full_name,
         role: rowData.role,
         status: "active",
         profile_status: "approved",
         year_level: rowData.year_level,
         course_or_strand: rowData.course_or_strand,
         sub_course: rowData.sub_course || null,
         section: rowData.section || null,
         bio: rowData.bio || null,
         quote: rowData.quote || null,
         is_public: true,
         resume_public: false,
         created_at: new Date().toISOString(),
         updated_at: new Date().toISOString(),
       },
       { onConflict: "id" }
     )

  if (profileError) {
    // Roll back auth user if profile insert fails
    await supabaseAdmin.auth.admin.deleteUser(userId)
    throw new Error(`Profile creation failed: ${profileError.message}`)
  }

  return { userId, email: rowData.email }
}

export async function createImportBatch(fileName, adminId) {
  const { data, error } = await supabaseAdmin
    .from("import_batches")
    .insert({
      filename: fileName,
      status: "pending",
      total_rows: 0,
      success_count: 0,
      failed_count: 0,
      admin_id: adminId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create import batch: ${error.message}`)
  }

  return data
}

export async function updateBatchProgress(batchId, updates) {
  const { data, error } = await supabaseAdmin
    .from("import_batches")
    .update(updates)
    .eq("id", batchId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update batch: ${error.message}`)
  }

  return data
}

export async function recordError(batchId, rowNumber, errorMessage, email, studentNumber) {
  const { error } = await supabaseAdmin.from("import_errors").insert({
    batch_id: batchId,
    row_number: rowNumber,
    message: errorMessage,
    email: email,
    student_number: studentNumber,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Failed to record error:", error.message)
  }
}

const getErrorMessage = (errors) => errors?.[0]?.message || "Unknown validation error"

// ─── Delay helper for rate-limit avoidance ───
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function processImportRows(rows, batchId) {
  let successCount = 0
  let errorCount = 0

  for (const { rowNumber, data } of rows) {
    const validation = await validateRow(data)

    if (!validation.valid) {
      errorCount++
      await recordError(
        batchId,
        rowNumber,
        getErrorMessage(validation.errors),
        validation.data.email,
        validation.data.student_number
      )
      continue
    }

    // Retry logic: Supabase Auth API can rate-limit or fail transiently.
    // Try up to 3 times with exponential backoff.
    const maxRetries = 3
    let succeeded = false
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await createUserFromRow(validation.data)
        successCount++
        succeeded = true
        break
      } catch (error) {
        if (attempt === maxRetries) {
          errorCount++
          await recordError(
            batchId,
            rowNumber,
            error.message,
            validation.data.email,
            validation.data.student_number
          )
        } else {
          // Exponential backoff: 500ms, 1000ms, 2000ms
          await sleep(500 * Math.pow(2, attempt - 1))
        }
      }
    }

    // Small delay between rows to avoid hitting Supabase rate limits
    if (!succeeded || successCount % 5 === 0) {
      await sleep(200)
    }
  }

  return { successCount, errorCount }
}