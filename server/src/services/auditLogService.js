import { supabaseAdmin } from "../config/supabase.js"

export async function logAudit({
  userId,
  action,
  entityType = null,
  entityId = null,
  oldData = null,
  newData = null,
  ipAddress = null,
  userAgent = null,
}) {
  const { error } = await supabaseAdmin.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    old_data: oldData,
    new_data: newData,
    ip_address: ipAddress,
    user_agent: userAgent,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[AUDIT LOG ERROR]", error.message)
  }
}

export async function getAuditLogs({ page = 1, perPage = 25, action = null, entityType = null, userId = null, search = null, dateFrom = null, dateTo = null } = {}) {
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let query = supabaseAdmin
    .from("audit_logs")
    .select("id, user_id, action, entity_type, entity_id, old_data, new_data, ip_address, user_agent, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (action) {
    query = query.eq("action", action)
  }
  if (entityType) {
    query = query.eq("entity_type", entityType)
  }
  if (userId) {
    query = query.eq("user_id", userId)
  }
  if (dateFrom) {
    query = query.gte("created_at", dateFrom)
  }
  if (dateTo) {
    query = query.lte("created_at", dateTo)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to fetch audit logs: ${error.message}`)
  }

  const userIds = [...new Set((data || []).map((l) => l.user_id).filter(Boolean))]
  let userMap = {}
  if (userIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url")
      .in("id", userIds)

    for (const p of profiles || []) {
      userMap[p.id] = p
    }
  }

  return {
    logs: (data || []).map((log) => ({
      ...log,
      user: log.user_id ? userMap[log.user_id] || null : null,
    })),
    total: count || 0,
    page,
    perPage,
  }
}

export async function getAuditLogById(id) {
  const { data, error } = await supabaseAdmin
    .from("audit_logs")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch audit log: ${error.message}`)
  }
  if (!data) {
    return null
  }

  let user = null
  if (data.user_id) {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, full_name, student_number, avatar_url")
      .eq("id", data.user_id)
      .maybeSingle()
    user = profile || null
  }

  return { ...data, user }
}

export async function getAuditLogFilters() {
  const { data: actions } = await supabaseAdmin
    .from("audit_logs")
    .select("action")
    .order("action", { ascending: true })

  const { data: entityTypes } = await supabaseAdmin
    .from("audit_logs")
    .select("entity_type")
    .not("entity_type", "is", null)
    .order("entity_type", { ascending: true })

  const uniqueActions = [...new Set((actions || []).map((a) => a.action))]
  const uniqueEntityTypes = [...new Set((entityTypes || []).map((e) => e.entity_type))]

  return { actions: uniqueActions, entityTypes: uniqueEntityTypes }
}
