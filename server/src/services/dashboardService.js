import { supabaseAdmin } from "../config/supabase.js"

export async function getDashboardStats() {
  const now = new Date()
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [{ count: totalUsers }, { count: activeUsers }, { count: completedProfiles }, { count: pendingApprovals }, { count: resumesCreated }, { count: newUsersThisMonth }, { count: recentImports }, { count: failedImports }] = await Promise.all([
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("profile_status", "approved"),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("profile_status", "submitted"),
    supabaseAdmin.from("resumes").select("id", { count: "exact", head: true }),
    supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", firstDayOfMonth),
    supabaseAdmin.from("import_batches").select("id", { count: "exact", head: true }).gte("created_at", firstDayOfMonth),
    supabaseAdmin.from("import_batches").select("id", { count: "exact", head: true }).in("status", ["failed", "completed_with_errors"]).gte("created_at", firstDayOfMonth),
  ])

  return {
    totalUsers: totalUsers || 0,
    activeUsers: activeUsers || 0,
    completedProfiles: completedProfiles || 0,
    pendingApprovals: pendingApprovals || 0,
    resumesCreated: resumesCreated || 0,
    newUsersThisMonth: newUsersThisMonth || 0,
    recentImports: recentImports || 0,
    failedImports: failedImports || 0,
  }
}

export async function getRecentLogs(limit = 5) {
  let query = supabaseAdmin
    .from("audit_logs")
    .select("id, user_id, action, entity_type, entity_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) {
    console.error("[DASHBOARD LOGS ERROR]", error.message)
    return []
  }

  const logs = data || []
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))]

  let userMap = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, display_name")
      .in("id", userIds)

    for (const p of profiles || []) {
      userMap[p.id] = p
    }
  }

  return logs.map((log) => ({
    id: log.id,
    user: userMap[log.user_id]?.full_name || userMap[log.user_id]?.display_name || "System",
    action: formatAction(log.action),
    entity: log.entity_type || log.entity_id || "—",
    time: formatTimeAgo(log.created_at),
  }))
}

function formatAction(action) {
  const actionMap = {
    login: "Login",
    logout: "Logout",
    create_user: "User Created",
    update_user: "Profile Updated",
    delete_user: "User Deleted",
    submit_profile: "Profile Submitted",
    approve_profile: "Profile Approved",
    reject_profile: "Profile Rejected",
    create_resume: "Resume Created",
    update_resume: "Resume Updated",
    export_resume: "Resume Exported",
    upload_import: "Import Started",
    complete_import: "Import Completed",
    fail_import: "Import Failed",
    file_upload: "File Uploaded",
  }
  return actionMap[action] || action
}

function formatTimeAgo(isoString) {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
}

export async function getFailedImports(limit = 5) {
  let query = supabaseAdmin
    .from("import_batches")
    .select("id, filename, status, created_at")
    .in("status", ["failed", "completed_with_errors"])
    .order("created_at", { ascending: false })
    .limit(limit)

  const { data, error } = await query

  if (error) {
    console.error("[DASHBOARD FAILED IMPORTS ERROR]", error.message)
    return []
  }

  const failedBatches = data || []
  const errorDetails = await Promise.all(
    failedBatches.map(async (batch) => {
      const { data: errors } = await supabaseAdmin
        .from("import_errors")
        .select("message")
        .eq("batch_id", batch.id)
        .limit(3)

      const reasons = (errors || []).map((e) => e.message).join(", ")
      return {
        id: batch.id,
        fileName: batch.filename,
        reason: reasons || "Unknown error",
        timestamp: formatTimeAgo(batch.created_at),
      }
    })
  )

  return errorDetails
}

export async function getDashboard() {
  const stats = await getDashboardStats()
  const recentLogs = await getRecentLogs()
  const failedImports = await getFailedImports()

  return {
    stats,
    recentLogs,
    failedImports,
  }
}