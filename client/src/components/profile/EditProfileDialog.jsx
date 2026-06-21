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
import { Upload, X } from "lucide-react"
import { useState } from "react"

const FIELDS = [
  { name: "full_name", label: "Full Name", placeholder: "Juan Dela Cruz" },
  { name: "course_or_strand", label: "Course / Strand", placeholder: "e.g. BS Information Technology" },
  { name: "year_graduated", label: "Year Graduated", placeholder: "e.g. 2025-2026" },
  { name: "school", label: "School", placeholder: "Your school name" },
  { name: "home_address", label: "Home Address", placeholder: "Your complete address" },
  { name: "contact_number", label: "Contact", placeholder: "+63 000 000 0000" },
  { name: "website", label: "Website", placeholder: "www.yourwebsite.com" },
]

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
                  onChange={(e) => onAvatarSelect?.(e.target.files?.[0])}
                />
              </label>
            </div>
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
              />
            </div>
          ))}

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
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}