/**
 * FieldInputs.jsx
 *
 * All form field input components for the resume editor.
 * Each component is independently importable and testable.
 */

import { useEffect, useRef, useState } from "react"
import { Camera, Plus, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ── Validation helpers ───────────────────────────────────────────────────────
function validateEducationEntry(entry) {
  const errors = {}
  if (!entry.school || !entry.school.trim()) errors.school = "School is required"
  if (!entry.degree || !entry.degree.trim()) errors.degree = "Degree is required"
  return errors
}

function validateExperienceEntry(entry) {
  const errors = {}
  if (!entry.company || !entry.company.trim()) errors.company = "Company is required"
  if (!entry.role || !entry.role.trim()) errors.role = "Role is required"
  return errors
}

function validateAchievementEntry(entry) {
  const errors = {}
  if (!entry.title || !entry.title.trim()) errors.title = "Title is required"
  return errors
}

function validateReferenceEntry(entry) {
  const errors = {}
  if (!entry.name || !entry.name.trim()) errors.name = "Name is required"
  return errors
}

// ── Base textarea style ───────────────────────────────────────────────────────
const textareaClass =
  "w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] resize-y"

// ── Text ──────────────────────────────────────────────────────────────────────
export function TextInput({ value, onChange, placeholder, config }) {
  return (
    <Input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || config?.placeholder || "Enter text..."}
      className="h-9"
    />
  )
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export function TextareaInput({ value, onChange, placeholder, config }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || config?.placeholder || "Enter text..."}
      className={`${textareaClass} min-h-[80px]`}
      rows={config?.rows || 3}
    />
  )
}

// ── Plain list ────────────────────────────────────────────────────────────────
export function ListInput({ value, onChange, config }) {
  const items = Array.isArray(value) ? value : []
  const maxItems = config?.maxItems || 20

  const updateItem = (index, val) => {
    const updated = [...items]
    updated[index] = val
    onChange(updated)
  }

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index))
  const addItem = () => { if (items.length < maxItems) onChange([...items, ""]) }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-5 text-center shrink-0">{i + 1}.</span>
          <Input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            placeholder={`Item ${i + 1}`}
            className="h-8 text-sm flex-1"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 shrink-0 text-red-400 hover:text-red-500"
            onClick={() => removeItem(i)}
          >
            <Trash2 size={12} />
          </Button>
        </div>
      ))}
      {items.length < maxItems && (
        <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Item
        </Button>
      )}
    </div>
  )
}

// ── Date range ────────────────────────────────────────────────────────────────
export function DateRangeInput({ value, onChange, config }) {
  const range = value || { from: "", to: "" }
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        type="date"
        value={range.from || ""}
        onChange={(e) => onChange({ ...range, from: e.target.value })}
        className="h-9 flex-1 min-w-[120px]"
      />
      <span className="text-xs text-[var(--text-muted)] shrink-0">to</span>
      <Input
        type="date"
        value={range.to || ""}
        onChange={(e) => onChange({ ...range, to: e.target.value })}
        className="h-9 flex-1 min-w-[120px]"
      />
      {config?.allowPresent && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] shrink-0"
          onClick={() => onChange({ ...range, to: "Present" })}
        >
          Present
        </Button>
      )}
    </div>
  )
}

// ── Skills chip input ─────────────────────────────────────────────────────────
export function SkillsInput({ value, onChange, config }) {
  const skills = Array.isArray(value) ? value : []
  const maxSkills = config?.maxItems || 30

  const addSkill = (skill) => {
    const trimmed = skill.trim()
    if (trimmed && !skills.includes(trimmed) && skills.length < maxSkills) {
      onChange([...skills, trimmed])
    }
  }

  const removeSkill = (index) => onChange(skills.filter((_, i) => i !== index))

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addSkill(e.target.value)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {skills.map((skill, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--bg-primary)]"
          >
            {skill}
            <button type="button" onClick={() => removeSkill(i)} className="ml-0.5 hover:text-red-500 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      {skills.length < maxSkills && (
        <Input
          type="text"
          placeholder="Type a skill and press Enter or comma..."
          className="h-8 text-sm"
          onKeyDown={handleKeyDown}
        />
      )}
      <p className="text-[10px] text-[var(--text-muted)]">{skills.length}/{maxSkills} skills added</p>
    </div>
  )
}

// ── Education entries ─────────────────────────────────────────────────────────
export function EducationInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 10
  const emptyEntry = { school: "", degree: "", year: "", gpa: "", description: "" }

  const addEntry = () => { if (entries.length < maxEntries) onChange([...entries, { ...emptyEntry }]) }
  const removeEntry = (index) => onChange(entries.filter((_, i) => i !== index))
  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const errors = validateEducationEntry(entry)
        const hasErrors = Object.keys(errors).length > 0
        return (
          <div key={i} className={cn("rounded-lg border bg-[var(--bg-subtle)]/50 p-3 space-y-2", hasErrors ? "border-red-300" : "border-[var(--border-light)]")}>
            <div className="flex items-center justify-between">
              <span className={"text-xs font-semibold " + (hasErrors ? "text-red-600" : "text-[var(--text-primary)]")}>Education #{i + 1}</span>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {hasErrors && <p className="text-[10px] text-red-500">{Object.values(errors).join(" • ")}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="text" value={entry.school || ""} onChange={(e) => updateEntry(i, "school", e.target.value)} placeholder="School / University *" className="h-8 text-sm" />
              <Input type="text" value={entry.degree || ""} onChange={(e) => updateEntry(i, "degree", e.target.value)} placeholder="Degree / Course *" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="text" value={entry.year || ""} onChange={(e) => updateEntry(i, "year", e.target.value)} placeholder="Year (e.g., 2020–2024)" className="h-8 text-sm" />
              <Input type="text" value={entry.gpa || ""} onChange={(e) => updateEntry(i, "gpa", e.target.value)} placeholder="GPA (optional)" className="h-8 text-sm" />
            </div>
            <textarea
              value={entry.description || ""}
              onChange={(e) => updateEntry(i, "description", e.target.value)}
              placeholder="Additional details (honors, activities...)"
              className={`${textareaClass} min-h-[60px]`}
              rows={2}
            />
          </div>
        )
      })}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Education
        </Button>
      )}
    </div>
  )
}

// ── Experience entries ────────────────────────────────────────────────────────
export function ExperienceInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 10
  const emptyEntry = { company: "", role: "", from: "", to: "", description: "" }

  const addEntry = () => { if (entries.length < maxEntries) onChange([...entries, { ...emptyEntry }]) }
  const removeEntry = (index) => onChange(entries.filter((_, i) => i !== index))
  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const errors = validateExperienceEntry(entry)
        const hasErrors = Object.keys(errors).length > 0
        return (
          <div key={i} className={cn("rounded-lg border bg-[var(--bg-subtle)]/50 p-3 space-y-2", hasErrors ? "border-red-300" : "border-[var(--border-light)]")}>
            <div className="flex items-center justify-between">
              <span className={"text-xs font-semibold " + (hasErrors ? "text-red-600" : "text-[var(--text-primary)]")}>Experience #{i + 1}</span>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {hasErrors && <p className="text-[10px] text-red-500">{Object.values(errors).join(" • ")}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="text" value={entry.company || ""} onChange={(e) => updateEntry(i, "company", e.target.value)} placeholder="Company / Organization *" className="h-8 text-sm" />
              <Input type="text" value={entry.role || ""} onChange={(e) => updateEntry(i, "role", e.target.value)} placeholder="Job Title / Role *" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={entry.from || ""} onChange={(e) => updateEntry(i, "from", e.target.value)} className="h-8 text-sm" />
              <div className="flex gap-1">
                <Input
                  type={entry.to === "Present" ? "text" : "date"}
                  value={entry.to || ""}
                  onChange={(e) => updateEntry(i, "to", e.target.value)}
                  placeholder="End date"
                  className="h-8 text-sm flex-1"
                  readOnly={entry.to === "Present"}
                />
                <Button
                  variant={entry.to === "Present" ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-[10px] shrink-0 px-2"
                  onClick={() => updateEntry(i, "to", entry.to === "Present" ? "" : "Present")}
                >
                  {entry.to === "Present" ? "✓" : "Now"}
                </Button>
              </div>
            </div>
            <textarea
              value={entry.description || ""}
              onChange={(e) => updateEntry(i, "description", e.target.value)}
              placeholder="Describe your responsibilities, achievements, and impact..."
              className={`${textareaClass} min-h-[80px]`}
              rows={3}
            />
          </div>
        )
      })}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Experience
        </Button>
      )}
    </div>
  )
}

// ── Achievements entries ──────────────────────────────────────────────────────
export function AchievementsInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 15
  const emptyEntry = { title: "", date: "", description: "" }

  const addEntry = () => { if (entries.length < maxEntries) onChange([...entries, { ...emptyEntry }]) }
  const removeEntry = (index) => onChange(entries.filter((_, i) => i !== index))
  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const errors = validateAchievementEntry(entry)
        const hasErrors = Object.keys(errors).length > 0
        return (
          <div key={i} className={cn("rounded-lg border bg-[var(--bg-subtle)]/50 p-3 space-y-2", hasErrors ? "border-red-300" : "border-[var(--border-light)]")}>
            <div className="flex items-center justify-between">
              <span className={"text-xs font-semibold " + (hasErrors ? "text-red-600" : "text-[var(--text-primary)]")}>Achievement #{i + 1}</span>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {hasErrors && <p className="text-[10px] text-red-500">{Object.values(errors).join(" • ")}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="text" value={entry.title || ""} onChange={(e) => updateEntry(i, "title", e.target.value)} placeholder="Achievement title *" className="h-8 text-sm" />
              <Input type="text" value={entry.date || ""} onChange={(e) => updateEntry(i, "date", e.target.value)} placeholder="Date (e.g., June 2024)" className="h-8 text-sm" />
            </div>
            <textarea
              value={entry.description || ""}
              onChange={(e) => updateEntry(i, "description", e.target.value)}
              placeholder="Description (optional)"
              className={`${textareaClass} min-h-[50px]`}
              rows={2}
            />
          </div>
        )
      })}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Achievement
        </Button>
      )}
    </div>
  )
}

// ── References entries ────────────────────────────────────────────────────────
export function ReferencesInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 5
  const emptyEntry = { name: "", relationship: "", contact: "", email: "" }

  const addEntry = () => { if (entries.length < maxEntries) onChange([...entries, { ...emptyEntry }]) }
  const removeEntry = (index) => onChange(entries.filter((_, i) => i !== index))
  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => {
        const errors = validateReferenceEntry(entry)
        const hasErrors = Object.keys(errors).length > 0
        return (
          <div key={i} className={cn("rounded-lg border bg-[var(--bg-subtle)]/50 p-3 space-y-2", hasErrors ? "border-red-300" : "border-[var(--border-light)]")}>
            <div className="flex items-center justify-between">
              <span className={"text-xs font-semibold " + (hasErrors ? "text-red-600" : "text-[var(--text-primary)]")}>Reference #{i + 1}</span>
              <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {hasErrors && <p className="text-[10px] text-red-500">{Object.values(errors).join(" • ")}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="text" value={entry.name || ""} onChange={(e) => updateEntry(i, "name", e.target.value)} placeholder="Full name *" className="h-8 text-sm" />
              <Input type="text" value={entry.relationship || ""} onChange={(e) => updateEntry(i, "relationship", e.target.value)} placeholder="Relationship (e.g., Manager)" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input type="tel" value={entry.contact || ""} onChange={(e) => updateEntry(i, "contact", e.target.value)} placeholder="Phone number" className="h-8 text-sm" />
              <Input type="email" value={entry.email || ""} onChange={(e) => updateEntry(i, "email", e.target.value)} placeholder="Email address" className="h-8 text-sm" />
            </div>
          </div>
        )
      })}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Reference
        </Button>
      )}
    </div>
  )
}

// ── Personal information (structured: name, title, email, phone, etc.) ───────
export function PersonalInput({ value, onChange, onPhotoUpload }) {
  const personal = (typeof value === "object" && value !== null) ? value : {}
  const MAX_PHOTO_SIZE = 5 * 1024 * 1024
  const [previewUrl, setPreviewUrl] = useState("")
  const [uploadError, setUploadError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const update = (field, val) => onChange({ ...personal, [field]: val })
  const displayPhotoUrl = previewUrl || personal.photo_url || ""
  const photoExists = Boolean(displayPhotoUrl)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFileSelect = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return

    if (!onPhotoUpload) {
      setUploadError("Photo upload is unavailable for this resume.")
      input.value = ""
      return
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.")
      input.value = ""
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid photo type. Only JPEG, PNG, and WebP are allowed.")
      input.value = ""
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setUploadError("Photo too large. Maximum size is 5MB.")
      input.value = ""
      return
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl)
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setUploadError("")
    setIsUploading(true)

    try {
      const { photoUrl } = await onPhotoUpload(file)
      onChange({ ...personal, photo_url: photoUrl })
      setPreviewUrl("")
      setUploadError("")
    } catch (error) {
      setUploadError(error.message || "Failed to upload photo")
    } finally {
      setIsUploading(false)
      input.value = ""
    }
  }

  const handleRemovePhoto = () => {
    onChange({ ...personal, photo_url: "" })
    setPreviewUrl("")
    setUploadError("")
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-3 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 p-3">
        <div className="relative shrink-0">
          <label
            htmlFor="resume-photo-input"
            className={cn(
              "block h-[120px] w-[120px] cursor-pointer overflow-hidden rounded-full border-2 border-[var(--border-light)] bg-[var(--bg-surface)] transition hover:border-[var(--navy)]",
              isUploading && "opacity-70"
            )}
          >
            {displayPhotoUrl ? (
              <img src={displayPhotoUrl} alt="Resume photo preview" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                <Camera size={28} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--navy)]/60 opacity-0 transition hover:opacity-100">
              <Camera size={24} className="text-white" />
            </div>
          </label>
          {photoExists && (
            <button
              type="button"
              onClick={handleRemovePhoto}
              disabled={isUploading}
              className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white shadow hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Remove resume photo"
            >
              <X size={12} />
            </button>
          )}
          <input
            ref={fileInputRef}
            id="resume-photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Upload a professional headshot</p>
          <p className="text-xs text-[var(--text-muted)]">JPEG, PNG, or WebP up to 5MB.</p>
          {isUploading && <p className="text-xs text-[var(--text-muted)] mt-1">Uploading photo...</p>}
          {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="sm:col-span-2">
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Full Name *</label>
          <Input type="text" value={personal.name || ""} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Juan dela Cruz" className="h-9" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Job Title / Headline</label>
          <Input type="text" value={personal.title || ""} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Software Engineer" className="h-9" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Email</label>
          <Input type="email" value={personal.email || ""} onChange={(e) => update("email", e.target.value)} placeholder="you@email.com" className="h-9" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Phone</label>
          <Input type="tel" value={personal.phone || ""} onChange={(e) => update("phone", e.target.value)} placeholder="+63 912 345 6789" className="h-9" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Location</label>
          <Input type="text" value={personal.location || ""} onChange={(e) => update("location", e.target.value)} placeholder="City, Province" className="h-9" />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">LinkedIn</label>
          <Input type="text" value={personal.linkedin || ""} onChange={(e) => update("linkedin", e.target.value)} placeholder="linkedin.com/in/yourname" className="h-9" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Website / Portfolio</label>
          <Input type="text" value={personal.website || ""} onChange={(e) => update("website", e.target.value)} placeholder="yourportfolio.com" className="h-9" />
        </div>
      </div>
    </div>
  )
}

// ── Registry ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line react-refresh/only-export-components
export const FIELD_RENDERERS = {
  personal: PersonalInput,     // ← structured name/email/phone/etc.
  text: TextInput,
  textarea: TextareaInput,
  list: ListInput,
  date_range: DateRangeInput,
  education: EducationInput,
  experience: ExperienceInput,
  skills: SkillsInput,
  achievements: AchievementsInput,
  references: ReferencesInput,
}