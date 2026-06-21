import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatar,
} from "@/services/profileService"
import { useAuth } from "@/contexts/AuthContext"

const emptyEditable = {
  full_name: "",
  school: "",
  course_or_strand: "",
  year_graduated: "",
  home_address: "",
  contact_number: "",
  website: "",
  about_me: "",
  quote: "",
  skills: [],
}

/**
 * Single source of truth for profile data + edit state.
 * UI components stay presentational; all data logic lives here.
 */
export function useProfile() {
  const { user, login } = useAuth()

  const [profile, setProfile] = useState(null)
  const [editable, setEditable] = useState(emptyEditable)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const hydrateEditable = useCallback((p) => {
    setEditable({
      full_name: p.full_name || "",
      school: p.school || "",
      course_or_strand: p.course_or_strand || "",
      year_graduated: p.year_graduated || "",
      home_address: p.home_address || "",
      contact_number: p.contact_number || "",
      website: p.website || "",
      about_me: p.about_me || "",
      quote: p.quote || "",
      skills: Array.isArray(p.skills) ? p.skills : [],
    })
  }, [])

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const fetched = await getMyProfile()
      setProfile(fetched)
      hydrateEditable(fetched)
    } catch (error) {
      toast.error(error.message || "Failed to load profile")
    } finally {
      setIsLoading(false)
    }
  }, [hydrateEditable])

  useEffect(() => {
    if (!user) return
    queueMicrotask(() => fetchProfile())
  }, [user, fetchProfile])

  const handleFieldChange = useCallback((field, value) => {
    setEditable((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleAvatarSelect = useCallback((file) => {
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (event) => setAvatarPreview(event.target.result)
    reader.readAsDataURL(file)
  }, [])

  const openEdit = useCallback(() => setIsEditing(true), [])

  const cancelEdit = useCallback(() => {
    if (profile) hydrateEditable(profile)
    setAvatarFile(null)
    setAvatarPreview(null)
    setIsEditing(false)
  }, [profile, hydrateEditable])

  // Saves text fields + (optionally) a new avatar in one flow, then
  // refreshes the profile so the QR payload reflects the latest data.
  // NOTE: student_number and email are intentionally excluded — they're
  // disabled in the edit UI and the backend validator no longer accepts
  // them via this endpoint either.
  const saveProfile = useCallback(async () => {
    setIsSaving(true)
    try {
      let updated = await updateMyProfile(editable)

      if (avatarFile) {
        const avatarResult = await uploadAvatar(avatarFile)
        const avatarUrl = avatarResult.avatarUrl || avatarResult.profile?.avatar_url
        updated = avatarResult.profile
          ? { ...updated, ...avatarResult.profile, avatar_url: avatarUrl }
          : { ...updated, avatar_url: avatarUrl }
      }

      setProfile(updated)
      hydrateEditable(updated)
      login(user, updated)
      setAvatarFile(null)
      setAvatarPreview(null)
      setIsEditing(false)
      toast.success("Profile saved — your QR code has been updated")
      return updated
    } catch (error) {
      toast.error(error.message || "Failed to save profile")
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [editable, avatarFile, hydrateEditable, login, user])

  return {
    profile,
    setProfile,
    editable,
    isLoading,
    isEditing,
    isSaving,
    avatarPreview,
    handleFieldChange,
    handleAvatarSelect,
    openEdit,
    cancelEdit,
    saveProfile,
  }
}