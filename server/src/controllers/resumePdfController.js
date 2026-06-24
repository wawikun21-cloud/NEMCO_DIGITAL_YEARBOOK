/**
 * resumePdfController.js  (server/src/controllers)
 *
 * DEPRECATED: This controller is no longer wired into the Express app.
 * PDF generation is now handled client-side via html2canvas + jspdf in:
 *   - client/src/hooks/usePdfExport.js
 *   - client/src/hooks/useResumePdfDownload.js
 *
 * Optionally, deploy supabase/functions/generate-resume-pdf as an Edge Function
 * for server-side PDF generation.
 *
 * Kept for reference — safe to delete.
 */

import pdfHandler from "../../../api/generate-resume-pdf.js"

export async function generateResumePdf(req, res, next) {
  try {
    await pdfHandler(req, res)
  } catch (error) {
    // Only forward to Express error handler if headers haven't been sent yet
    if (!res.headersSent) {
      next(error)
    } else {
      // Headers already sent (PDF was streaming), just log
      console.error("[resumePdfController] Error after headers sent:", error.message)
    }
  }
}