import { supabase } from "@/lib/supabaseClient"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"

async function getAuthHeaders() {
  const { data: supabaseData } = await supabase.auth.getSession()
  const accessToken = supabaseData?.session?.access_token || sessionStorage.getItem("digitalYearbookAccessToken")

  if (!accessToken) {
    throw new Error("You must be logged in to perform this action.")
  }

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  }
}

export async function getDashboard() {
  const authHeaders = await getAuthHeaders()

  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    method: "GET",
    headers: authHeaders,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch dashboard data")
  }

  return data
}