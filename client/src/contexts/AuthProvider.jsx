import { useState, useEffect } from "react"
import { getStoredUser, getStoredProfile, clearStoredAuth, startAuthStateListener, stopAuthStateListener, FORCE_LOGOUT_EVENT, supabase } from "@/services/authService"
import { AuthContext } from "./AuthContext"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser())
  const [profile, setProfile] = useState(() => getStoredProfile())

  useEffect(() => {
    startAuthStateListener()
    const handleForceLogout = () => {
      clearStoredAuth()
      setUser(null)
      setProfile(null)
    }
    window.addEventListener(FORCE_LOGOUT_EVENT, handleForceLogout)
    return () => {
      stopAuthStateListener()
      window.removeEventListener(FORCE_LOGOUT_EVENT, handleForceLogout)
    }
  }, [])

  const login = (userData, userProfile) => {
    setUser(userData)
    setProfile(userProfile)
    if (userProfile) {
      sessionStorage.setItem("digitalYearbookProfile", JSON.stringify(userProfile))
    }
  }

  const logout = async () => {
    clearStoredAuth()
    setUser(null)
    setProfile(null)
    try {
      await supabase.auth.signOut()
    } catch {
      // ignore — local clear already done
    }
  }

  const role = profile?.role || user?.role || "student"

  return (
    <AuthContext.Provider value={{ user, profile, role, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}