import { useMemo } from "react"

/**
 * useDashboard
 * Centralizes user data and derived UI state for the Dashboard page.
 * Swap the hardcoded `user` object with your auth context / API call.
 */
export function useDashboard() {
  // TODO: replace with useAuth() or your auth context
  const user = {
    name: "John Doe",
    firstName: "John",
    role: "Student",
    avatarInitials: "JD",
  }

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }, [])

  return { user, greeting }
}
