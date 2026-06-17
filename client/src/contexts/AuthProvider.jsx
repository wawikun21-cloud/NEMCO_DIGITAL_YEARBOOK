import { useState } from "react"
import { getStoredUser, getStoredProfile, clearStoredAuth } from "@/services/authService"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [profile, setProfile] = useState(() => getStoredProfile())

  const login = (userData, userProfile) => {
    setUser(userData)
    setProfile(userProfile)
  }

  const logout = () => {
    clearStoredAuth()
    setUser(null)
    setProfile(null)
  }

  const role = profile?.role || user?.role || "student"

  return (
    <AuthContext.Provider value={{ user, profile, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}