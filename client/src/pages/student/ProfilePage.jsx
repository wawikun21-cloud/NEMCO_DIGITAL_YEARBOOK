import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { updateMyProfile, getMyProfile, uploadAvatar } from "@/services/profileService"
import { toast } from "sonner"
import {
  User,
  Hash,
  Mail,
  BookOpen,
  GraduationCap,
  Users,
  Quote,
  FileText,
  Upload,
  Globe,
  Lock,
  CheckCircle,
  Save,
} from "lucide-react"

const PROFILE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export default function ProfilePage() {
  const { user, login } = useAuth()

  const [profile, setProfileState] = useState(null)
  const [editable, setEditable] = useState({
    full_name: "",
    display_name: "",
    year_level: "",
    course_or_strand: "",
    section: "",
    bio: "",
    quote: "",
    is_public: false,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const fetchedProfile = await getMyProfile()
        setProfileState(fetchedProfile)
        setEditable({
          full_name: fetchedProfile.full_name || "",
          display_name: fetchedProfile.display_name || "",
          year_level: fetchedProfile.year_level || "",
          course_or_strand: fetchedProfile.course_or_strand || "",
          section: fetchedProfile.section || "",
          bio: fetchedProfile.bio || "",
          quote: fetchedProfile.quote || "",
          is_public: fetchedProfile.is_public ?? false,
        })
      } catch (error) {
        toast.error(error.message || "Failed to load profile")
      }
    }

    if (user && !isEditing) {
      fetchProfile()
    }
  }, [user, isEditing])

  const handleInputChange = (field, value) => {
    setEditable((prev) => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveAvatar = async () => {
    const fileInput = document.getElementById("avatar-upload")
    const file = fileInput?.files?.[0]

    if (!file) {
      toast.error("Please select an image file")
      return
    }

    setIsSaving(true)
    try {
      const result = await uploadAvatar(file)
      const newAvatarUrl = result.avatarUrl || result.profile?.avatar_url

      if (newAvatarUrl) {
        setProfileState((prev) => ({ ...prev, avatar_url: newAvatarUrl }))
        login(user, { ...profile, avatar_url: newAvatarUrl })
        toast.success("Profile photo updated successfully")
      } else {
        toast.error("Upload completed but no avatar URL returned")
      }

      setAvatarPreview(null)

      const fileInputEl = document.getElementById("avatar-upload")
      if (fileInputEl) fileInputEl.value = ""
    } catch (error) {
      toast.error(error.message || "Failed to upload photo")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const updated = await updateMyProfile(editable)
      setProfileState(updated)
      login(user, updated)
      toast.success("Profile saved successfully")
      setIsEditing(false)
    } catch (error) {
      toast.error(error.message || "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "approved":
        return "admin"
      case "submitted":
      case "completed":
        return "default"
      case "rejected":
        return "rejected"
      default:
        return "default"
    }
  }

  const { full_name, display_name, year_level, course_or_strand, section, bio, quote, is_public } = editable
  const student_number = profile?.student_number || ""
  const email = user?.email || ""
  const profile_status = profile?.profile_status || "draft"
  const avatar_url = profile?.avatar_url

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          Profile Info
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          View and edit your personal information and yearbook details.
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-[var(--border-light)]"
                />
              ) : avatar_url ? (
                <img
                  src={avatar_url}
                  alt="Avatar"
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-[var(--border-light)]"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-4xl font-bold text-[var(--text-primary)]">
                  {full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              {isEditing && (
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[var(--bg-sidebar)] text-white transition-colors hover:bg-[var(--bg-sidebar)]/90"
                >
                  <Upload size={18} />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <Badge variant={getStatusBadgeVariant(profile_status)} className="text-[10px]">
              {PROFILE_STATUS_OPTIONS.find((s) => s.value === profile_status)?.label}
            </Badge>
          </div>

          <div className="flex-1 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Hash size={14} className="text-[var(--text-muted)]" />
                  Student ID No.
                </label>
                <Input
                  type="text"
                  value={student_number}
                  disabled
                  placeholder="e.g. 0026284"
                />
              </div>

              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Mail size={14} className="text-[var(--text-muted)]" />
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  placeholder="student@example.com"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <User size={14} className="text-[var(--text-muted)]" />
                  Full Name
                </label>
                <Input
                  type="text"
                  value={full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <User size={14} className="text-[var(--text-muted)]" />
                  Display Name
                </label>
                <Input
                  type="text"
                  value={display_name}
                  onChange={(e) => handleInputChange("display_name", e.target.value)}
                  disabled={!isEditing}
                  placeholder="Juan (optional)"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <GraduationCap size={14} className="text-[var(--text-muted)]" />
                  Year Level
                </label>
                <Input
                  type="text"
                  value={year_level}
                  onChange={(e) => handleInputChange("year_level", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. 11 or 12"
                />
              </div>

              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <BookOpen size={14} className="text-[var(--text-muted)]" />
                  Course/Strand
                </label>
                <Input
                  type="text"
                  value={course_or_strand}
                  onChange={(e) => handleInputChange("course_or_strand", e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. STEM, ABM"
                />
              </div>

              <div className="grid gap-2">
                <label className="flex items-center gap-1.5 text-sm font-medium">
                  <Users size={14} className="text-[var(--text-muted)]" />
                  Section
                </label>
                <Input
                  type="text"
                  value={section}
                  onChange={(e) => handleInputChange("section", e.target.value)}
                  disabled={!isEditing}
                  placeholder="A, B, C..."
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <FileText size={14} className="text-[var(--text-muted)]" />
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                className="min-h-[80px] w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
              />
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-1.5 text-sm font-medium">
                <Quote size={14} className="text-[var(--text-muted)]" />
                Favorite Quote
              </label>
              <textarea
                value={quote}
                onChange={(e) => handleInputChange("quote", e.target.value)}
                disabled={!isEditing}
                placeholder="Share your favorite quote..."
                className="min-h-[60px] w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-ring resize-none disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <span className="text-sm font-medium text-[var(--text-secondary)]">
                Profile Visibility:
              </span>
              <button
                type="button"
                onClick={() => isEditing && handleInputChange("is_public", !is_public)}
                disabled={!isEditing}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  is_public
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                } ${isEditing ? "cursor-pointer hover:opacity-80" : "opacity-50"}`}
              >
                {is_public ? <Globe size={14} /> : <Lock size={14} />}
                {is_public ? "Public" : "Private"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border-light)] pt-4">
{isEditing ? (
             <>
               <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                 Cancel
               </Button>
               {avatarPreview && (
                 <Button onClick={handleSaveAvatar} disabled={isSaving} variant="secondary">
                   <Save size={16} className="mr-1" />
                   {isSaving ? "Uploading..." : "Save Photo"}
                 </Button>
               )}
               <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                 <CheckCircle size={16} />
                 {isSaving ? "Saving..." : "Save Profile"}
               </Button>
             </>
           ) : (
             <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
           )}
        </div>
      </div>

      <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-xs text-[var(--text-muted)] sm:flex-row">
          <span>© {new Date().getFullYear()} Student Portal. All rights reserved.</span>
          <nav className="flex gap-4">
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Privacy Policy</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Terms of Use</a>
            <a href="#" className="transition-colors hover:text-[var(--text-primary)]">Contact Us</a>
          </nav>
        </div>
      </footer>
    </main>
  )
}