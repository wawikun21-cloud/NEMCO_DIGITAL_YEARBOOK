import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useState, useCallback, useMemo } from "react"

const REQUIRED_FIELDS = ["full_name", "school", "course_or_strand", "year_graduated"]

function validateField(field, value) {
  if (REQUIRED_FIELDS.includes(field) && (!value || !value.trim())) {
    return `${field.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())} is required`
  }
  if (field === "full_name" && value && value.length > 100) {
    return "Full Name must be 100 characters or less"
  }
  if (field === "school" && value && value.length > 100) {
    return "School must be 100 characters or less"
  }
  if (field === "course_or_strand" && value && value.length > 100) {
    return "Course / Strand must be 100 characters or less"
  }
  if (field === "year_graduated" && value && value.length > 9) {
    return "Year Graduated must be in format YYYY-YYYY or YYYY"
  }
  if (field === "home_address" && value && value.length > 200) {
    return "Home Address must be 200 characters or less"
  }
  if (field === "contact_number" && value && value.length > 20) {
    return "Contact must be 20 characters or less"
  }
  if (field === "website" && value && value.length > 200) {
    return "Website must be 200 characters or less"
  }
  return ""
}

function validateAvatarFile(file) {
  const MAX_SIZE = 2 * 1024 * 1024
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  
  if (!file) return ""
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
  }
  
  if (file.size > MAX_SIZE) {
    return "Image size must be 2MB or less"
  }
  
  return ""
}

const FIELDS = [
  { name: "full_name", label: "Full Name", placeholder: "Juan Dela Cruz" },
  { name: "course_or_strand", label: "Course / Strand", placeholder: "e.g. BS Information Technology" },
  { name: "year_graduated", label: "Year Graduated", placeholder: "e.g. 2025-2026" },
  { name: "school", label: "School", placeholder: "Your school name" },
  { name: "home_address", label: "Home Address", placeholder: "Your complete address" },
  { name: "contact_number", label: "Contact", placeholder: "+63 000 000 0000" },
  { name: "website", label: "Website", placeholder: "www.yourwebsite.com" },
]

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  )
}

function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.89-6.39L6.48 22H3.36l7.25-8.29L3 2h6.41l4.41 5.83L18.9 2Zm-1.1 17.85h1.73L8.33 4.1H6.48l11.32 15.75Z" />
    </svg>
  )
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37a4 4 0 1 1-3.37-5.34A4 4 0 0 1 16 11.37Z" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}

function LinkedInIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M6.94 8.98H3.6V21h3.34V8.98ZM5.27 4A1.93 1.93 0 1 1 5.26 7.9 1.93 1.93 0 0 1 5.27 4ZM20.4 14.1c0-3.17-1.69-5.13-4.42-5.13a3.82 3.82 0 0 0-3.42 1.88V8.98H9.22V21h3.34v-6.3c0-.57.04-1.15.21-1.56.24-.61.79-1.25 1.72-1.25 1.21 0 1.7.92 1.7 2.28V21h3.34l.87-6.9Z" />
    </svg>
  )
}

function GlobeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.6 9h16.8M3.6 15h16.8M12 3c2.2 2.45 3.35 5.44 3.35 9S14.2 18.55 12 21M12 3C9.8 5.45 8.65 8.44 8.65 12S9.8 18.55 12 21" />
    </svg>
  )
}

function normalizeSocialLink(value) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  try {
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`)
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href.slice(0, 200) : ""
  } catch {
    return ""
  }
}

function getSocialPlatform(url) {
  try {
    const host = new URL(url).hostname.toLowerCase()
    if (host.includes("facebook.com")) return { name: "Facebook", icon: FacebookIcon, className: "text-[#1877f2] bg-[#1877f2]/10" }
    if (host.includes("twitter.com") || host.includes("x.com")) return { name: "X", icon: XIcon, className: "text-neutral-950 bg-neutral-950/10" }
    if (host.includes("instagram.com")) return { name: "Instagram", icon: InstagramIcon, className: "text-[#e4405f] bg-[#e4405f]/10" }
    if (host.includes("linkedin.com")) return { name: "LinkedIn", icon: LinkedInIcon, className: "text-[#0a66c2] bg-[#0a66c2]/10" }
    return { name: "Website", icon: GlobeIcon, className: "text-[#1d4ed8] bg-[#1d4ed8]/10" }
  } catch {
    return { name: "Website", icon: GlobeIcon, className: "text-[#1d4ed8] bg-[#1d4ed8]/10" }
  }
}

function SocialMediaInput({ links, onChange }) {
  const [draft, setDraft] = useState("")
  const currentLinks = links.filter(Boolean)

  const addLink = () => {
    const normalized = normalizeSocialLink(draft)
    if (!draft.trim()) {
      setDraft("")
      return
    }
    if (!normalized) {
      toast.error("Please enter a valid URL (e.g., https://facebook.com/yourname)")
      setDraft("")
      return
    }
    if (currentLinks.includes(normalized) || currentLinks.length >= 3) {
      setDraft("")
      return
    }
    onChange([...currentLinks, normalized])
    setDraft("")
  }

  const removeLink = (link) => {
    onChange(currentLinks.filter((item) => item !== link))
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="social-links">Social Links</Label>
      <div className="flex gap-2">
        <Input
          id="social-links"
          value={draft}
          placeholder="https://facebook.com/yourname"
          maxLength={200}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addLink()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addLink} disabled={currentLinks.length >= 3}>
          Add
        </Button>
      </div>
      {currentLinks.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {currentLinks.map((link) => {
            const platform = getSocialPlatform(link)
            const Icon = platform.icon
            return (
              <span
                key={link}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${platform.className}`}
              >
                <Icon size={12} />
                {platform.name}
                <a
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-70 hover:opacity-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={12} />
                </a>
                <button
                  type="button"
                  onClick={() => removeLink(link)}
                  className="opacity-70 hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </span>
            )
          })}
        </div>
      )}
      <span className="text-xs text-muted-foreground">Add up to 3 full profile links (Enter or comma to add)</span>
    </div>
  )
}

function SkillsInput({ skills, onChange }) {
  const [draft, setDraft] = useState("")

  const addSkill = () => {
    const trimmed = draft.trim()
    if (!trimmed || skills.includes(trimmed) || skills.length >= 12) {
      setDraft("")
      return
    }
    onChange([...skills, trimmed])
    setDraft("")
  }

  const removeSkill = (skill) => {
    onChange(skills.filter((s) => s !== skill))
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="skills">Skills</Label>
      <div className="flex gap-2">
        <Input
          id="skills"
          value={draft}
          placeholder="e.g. Adaptability"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              addSkill()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addSkill}>
          Add
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((skill) => (
            <span
              key={skill}
              className="flex items-center gap-1 rounded-full border border-input px-2.5 py-1 text-xs"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      <span className="text-xs text-muted-foreground">Press Enter or comma to add a skill (max 12)</span>
    </div>
  )
}

export function EditProfileDialog({
  open,
  onOpenChange,
  editable,
  onFieldChange,
  onSave,
  onCancel,
  isSaving,
  avatarPreview,
  currentAvatarUrl,
  onAvatarSelect,
}) {
  const [avatarError, setAvatarError] = useState("")

  const validationErrors = useMemo(() => {
    const errors = {}
    REQUIRED_FIELDS.forEach(field => {
      const error = validateField(field, editable[field])
      if (error) errors[field] = error
    })
    return errors
  }, [editable])

  const hasValidationErrors = Object.keys(validationErrors).length > 0

  const handleAvatarSelect = useCallback((file) => {
    if (!file) return
    const error = validateAvatarFile(file)
    if (error) {
      setAvatarError(error)
      toast.error(error)
      return
    }
    setAvatarError("")
    onAvatarSelect?.(file)
  }, [onAvatarSelect])

  const handleSubmit = useCallback(() => {
    if (hasValidationErrors) return
    onSave()
  }, [hasValidationErrors, onSave])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your details and photo. Saving will refresh the QR code on the back of your card.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-20 w-20">
              {avatarPreview || currentAvatarUrl ? (
                <img
                  src={avatarPreview || currentAvatarUrl}
                  alt="Avatar"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-input"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted text-xl font-bold text-muted-foreground">
                  {editable.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <label
                htmlFor="edit-avatar-upload"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-foreground text-background"
              >
                <Upload size={13} />
                <input
                  id="edit-avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
                />
              </label>
            </div>
            {avatarError && (
              <p className="text-xs text-red-500">{avatarError}</p>
            )}
            <span className="text-xs text-muted-foreground">Tap the icon to change your photo</span>
          </div>

          {FIELDS.map((field) => (
            <div key={field.name} className="grid gap-1.5">
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input
                id={field.name}
                value={editable[field.name] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => onFieldChange(field.name, e.target.value)}
                className={validationErrors[field] ? "border-red-500" : ""}
              />
              {validationErrors[field] && (
                <p className="text-xs text-red-500">{validationErrors[field]}</p>
              )}
            </div>
          ))}

          <SocialMediaInput
            links={[editable.social_link1, editable.social_link2, editable.social_link3].filter(Boolean)}
            onChange={(links) => {
              onFieldChange("social_link1", links[0] || "")
              onFieldChange("social_link2", links[1] || "")
              onFieldChange("social_link3", links[2] || "")
            }}
          />

          <div className="grid gap-1.5">
            <Label htmlFor="about_me">About Me</Label>
            <textarea
              id="about_me"
              value={editable.about_me ?? ""}
              onChange={(e) => onFieldChange("about_me", e.target.value)}
              placeholder="Tell us about yourself..."
              className="min-h-[90px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <SkillsInput
            skills={editable.skills ?? []}
            onChange={(skills) => onFieldChange("skills", skills)}
          />

          <div className="grid gap-1.5">
            <Label htmlFor="quote">Favorite Quote</Label>
            <textarea
              id="quote"
              value={editable.quote ?? ""}
              onChange={(e) => onFieldChange("quote", e.target.value)}
              placeholder="Share your favorite quote..."
              className="min-h-[60px] w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving || hasValidationErrors}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}