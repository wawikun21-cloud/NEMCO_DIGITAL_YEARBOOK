import { supabaseAdmin } from "../config/supabase.js"
import { parseExcelFile, processImportRows, createImportBatch, updateBatchProgress } from "../services/importService.js"

export async function uploadImport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" })
    }

    const adminId = req.user.id
    const batch = await createImportBatch(req.file.originalname, adminId)

    const sheetName = req.body.sheetName || undefined
    const rows = await parseExcelFile(req.file.buffer, sheetName)

    // Guard: reject very large imports to prevent timeouts
    if (rows.length > 500) {
      await updateBatchProgress(batch.id, {
        status: "failed",
        message: "Too many rows. Maximum 500 rows per import.",
      })
      return res.status(400).json({
        message: `Too many rows (${rows.length}). Please split into batches of 500 or fewer.`,
      })
    }

    await updateBatchProgress(batch.id, {
      total_rows: rows.length,
      status: "processing",
    })

    // processImportRows is async and handles per-row errors internally.
    // It will NOT throw — it collects errors and returns counts.
    const results = await processImportRows(rows, batch.id)
    const status = results.errorCount > 0 ? "completed_with_errors" : "completed"

    await updateBatchProgress(batch.id, {
      status,
      success_count: results.successCount,
      failed_count: results.errorCount,
    })

    res.json({
      message:
        status === "completed_with_errors" ? "Import completed with errors" : "Import completed",
      batchId: batch.id,
      status,
      totalRows: rows.length,
      successCount: results.successCount,
      errorCount: results.errorCount,
    })
  } catch (error) {
    // If a fatal error happens before processing starts, try to mark the batch as failed
    console.error("[IMPORT] Fatal error in uploadImport:", error.message)
    next(error)
  }
}

export async function listBatches(req, res, next) {
  try {
    const { data, error } = await supabaseAdmin
      .from("import_batches")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch batches: ${error.message}`)
    }

    res.json({ batches: data })
  } catch (error) {
    next(error)
  }
}

export async function getBatch(req, res, next) {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from("import_batches")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (error || !data) {
      return res.status(404).json({ message: "Batch not found" })
    }

    res.json({ batch: data })
  } catch (error) {
    next(error)
  }
}

export async function getBatchErrors(req, res, next) {
  try {
    const { id } = req.params

    const { count } = await supabaseAdmin
      .from("import_batches")
      .select("id", { count: "exact", head: true })
      .eq("id", id)

    if (count === 0) {
      return res.status(404).json({ message: "Batch not found" })
    }

    const { data, error } = await supabaseAdmin
      .from("import_errors")
      .select("*")
      .eq("batch_id", id)
      .order("row_number", { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch errors: ${error.message}`)
    }

    res.json({ errors: data })
  } catch (error) {
    next(error)
  }
}