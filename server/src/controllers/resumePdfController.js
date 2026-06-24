/**
 * resumePdfController.js  (server/src/controllers)
 *
 * Thin Express wrapper around api/generate-resume-pdf.js.
 * The shared handler owns all logic; this file only adapts it to Express.
 *
 * NOTE: The shared handler calls res.end() / res.json() directly.
 * We must NOT call next(error) after it has already written headers,
 * otherwise Express throws "Cannot set headers after they are sent".
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