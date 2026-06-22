/**
 * useResumePdfDownload.js
 *
 * Calls POST /api/generate-resume-pdf with the current session token
 * and triggers a browser download of the returned PDF.
 *
 * Token resolution (mirrors authService.js → changePassword):
 *   1. supabase.auth.getSession()  — works if setSession() succeeded at login
 *   2. sessionStorage "digitalYearbookAccessToken"  — fallback for the common
 *      case where supabase.auth.setSession() silently failed because the
 *      backend issued a service_role token incompatible with the anon client
 *
 * Usage:
 *   const { downloadPdf, isGenerating } = useResumePdfDownload()
 *   <button onClick={() => downloadPdf({ data, sections, template, resume })}>
 */

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabaseClient"

export function useResumePdfDownload() {
  const [isGenerating, setIsGenerating] = useState(false)

  const downloadPdf = useCallback(async ({ data, sections, template, resume }) => {
    if (isGenerating) return
    setIsGenerating(true)

    try {
      // ── 1. Resolve token — same pattern as authService.changePassword ────────
      const { data: sessionData } = await supabase.auth.getSession()
      const token =
        sessionData?.session?.access_token ||
        sessionStorage.getItem("digitalYearbookAccessToken")

      if (!token) {
        throw new Error("You must be logged in to download a PDF. Please refresh and try again.")
      }

      // ── 2. Call the PDF endpoint ──────────────────────────────────────────────
      const response = await fetch("/api/generate-resume-pdf", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ data, sections, template }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || err.detail || err.message || `Server error ${response.status}`)
      }

      // ── 3. Trigger browser download ───────────────────────────────────────────
      const blob     = await response.blob()
      const url      = URL.createObjectURL(blob)
      const anchor   = document.createElement("a")
      const filename = `${resume?.title || "resume"}-${new Date().toISOString().slice(0, 10)}.pdf`

      anchor.href     = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      setTimeout(() => URL.revokeObjectURL(url), 10_000)

      toast.success("Resume downloaded!", { description: filename })

    } catch (err) {
      console.error("[useResumePdfDownload] Error:", err)
      toast.error("Could not generate PDF", { description: err.message })
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  return { downloadPdf, isGenerating }
}