import { useState } from "react"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function TextInput({ value, onChange, placeholder, config }) {
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

function TextareaInput({ value, onChange, placeholder, config }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder || config?.placeholder || "Enter text..."}
      className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] min-h-[80px] resize-y"
      rows={config?.rows || 3}
    />
  )
}

function ListInput({ value, onChange, config }) {
  const items = Array.isArray(value) ? value : []
  const maxItems = config?.maxItems || 20

  const addItem = () => {
    if (items.length < maxItems) {
      onChange([...items, ""])
    }
  }

  const updateItem = (index, val) => {
    const updated = [...items]
    updated[index] = val
    onChange(updated)
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index))
  }

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
          <Button variant="ghost" size="icon-sm" className="h-7 w-7 shrink-0 text-red-400 hover:text-red-500" onClick={() => removeItem(i)}>
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

function DateRangeInput({ value, onChange, config }) {
  const range = value || { from: "", to: "" }
  return (
    <div className="flex items-center gap-2">
      <Input
        type="date"
        value={range.from || ""}
        onChange={(e) => onChange({ ...range, from: e.target.value })}
        className="h-9 flex-1"
      />
      <span className="text-xs text-[var(--text-muted)] shrink-0">to</span>
      <Input
        type="date"
        value={range.to || ""}
        onChange={(e) => onChange({ ...range, to: e.target.value })}
        className="h-9 flex-1"
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

function EducationInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 10

  const emptyEntry = { school: "", degree: "", year: "", description: "" }

  const addEntry = () => {
    if (entries.length < maxEntries) {
      onChange([...entries, { ...emptyEntry }])
    }
  }

  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeEntry = (index) => {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Education #{i + 1}</span>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
              <Trash2 size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="text" value={entry.school || ""} onChange={(e) => updateEntry(i, "school", e.target.value)} placeholder="School / University *" className="h-8 text-sm" />
            <Input type="text" value={entry.degree || ""} onChange={(e) => updateEntry(i, "degree", e.target.value)} placeholder="Degree / Course *" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="text" value={entry.year || ""} onChange={(e) => updateEntry(i, "year", e.target.value)} placeholder="Year (e.g., 2020-2024)" className="h-8 text-sm" />
            <Input type="text" value={entry.gpa || ""} onChange={(e) => updateEntry(i, "gpa", e.target.value)} placeholder="GPA (optional)" className="h-8 text-sm" />
          </div>
          <textarea
            value={entry.description || ""}
            onChange={(e) => updateEntry(i, "description", e.target.value)}
            placeholder="Additional details (honors, activities...)"
            className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] min-h-[60px] resize-y"
            rows={2}
          />
        </div>
      ))}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Education
        </Button>
      )}
    </div>
  )
}

function ExperienceInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 10

  const emptyEntry = { company: "", role: "", from: "", to: "", description: "" }

  const addEntry = () => {
    if (entries.length < maxEntries) {
      onChange([...entries, { ...emptyEntry }])
    }
  }

  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeEntry = (index) => {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Experience #{i + 1}</span>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
              <Trash2 size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="text" value={entry.company || ""} onChange={(e) => updateEntry(i, "company", e.target.value)} placeholder="Company / Organization *" className="h-8 text-sm" />
            <Input type="text" value={entry.role || ""} onChange={(e) => updateEntry(i, "role", e.target.value)} placeholder="Role / Position *" className="h-8 text-sm" />
          </div>
          <div className="flex items-center gap-2">
            <Input type="date" value={entry.from || ""} onChange={(e) => updateEntry(i, "from", e.target.value)} className="h-8 text-sm flex-1" />
            <span className="text-xs text-[var(--text-muted)] shrink-0">to</span>
            <Input type="date" value={entry.to || ""} onChange={(e) => updateEntry(i, "to", e.target.value)} className="h-8 text-sm flex-1" />
          </div>
          <textarea
            value={entry.description || ""}
            onChange={(e) => updateEntry(i, "description", e.target.value)}
            placeholder="Describe your responsibilities and achievements..."
            className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] min-h-[60px] resize-y"
            rows={2}
          />
        </div>
      ))}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Experience
        </Button>
      )}
    </div>
  )
}

function SkillsInput({ value, onChange, config }) {
  const skills = Array.isArray(value) ? value : []
  const maxSkills = config?.maxItems || 30

  const addSkill = (skill) => {
    if (skill.trim() && skills.length < maxSkills && !skills.includes(skill.trim())) {
      onChange([...skills, skill.trim()])
    }
  }

  const removeSkill = (index) => {
    onChange(skills.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addSkill(e.target.value)
      e.target.value = ""
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-primary)]/10 px-2.5 py-1 text-xs font-medium text-[var(--bg-primary)]">
            {skill}
            <button type="button" onClick={() => removeSkill(i)} className="ml-0.5 hover:text-red-500 transition-colors">
              <Trash2 size={10} />
            </button>
          </span>
        ))}
      </div>
      {skills.length < maxSkills && (
        <Input
          type="text"
          placeholder="Type a skill and press Enter..."
          className="h-8 text-sm"
          onKeyDown={handleKeyDown}
        />
      )}
    </div>
  )
}

function AchievementsInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 15

  const emptyEntry = { title: "", date: "", description: "" }

  const addEntry = () => {
    if (entries.length < maxEntries) {
      onChange([...entries, { ...emptyEntry }])
    }
  }

  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeEntry = (index) => {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Achievement #{i + 1}</span>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
              <Trash2 size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="text" value={entry.title || ""} onChange={(e) => updateEntry(i, "title", e.target.value)} placeholder="Achievement title *" className="h-8 text-sm" />
            <Input type="text" value={entry.date || ""} onChange={(e) => updateEntry(i, "date", e.target.value)} placeholder="Date (e.g., June 2024)" className="h-8 text-sm" />
          </div>
          <textarea
            value={entry.description || ""}
            onChange={(e) => updateEntry(i, "description", e.target.value)}
            placeholder="Description (optional)"
            className="w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] min-h-[50px] resize-y"
            rows={2}
          />
        </div>
      ))}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Achievement
        </Button>
      )}
    </div>
  )
}

function ReferencesInput({ value, onChange, config }) {
  const entries = Array.isArray(value) ? value : []
  const maxEntries = config?.maxItems || 5

  const emptyEntry = { name: "", relationship: "", contact: "", email: "" }

  const addEntry = () => {
    if (entries.length < maxEntries) {
      onChange([...entries, { ...emptyEntry }])
    }
  }

  const updateEntry = (index, field, val) => {
    const updated = [...entries]
    updated[index] = { ...updated[index], [field]: val }
    onChange(updated)
  }

  const removeEntry = (index) => {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {entries.map((entry, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)]/50 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-primary)]">Reference #{i + 1}</span>
            <Button variant="ghost" size="icon-sm" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeEntry(i)}>
              <Trash2 size={12} />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="text" value={entry.name || ""} onChange={(e) => updateEntry(i, "name", e.target.value)} placeholder="Full name *" className="h-8 text-sm" />
            <Input type="text" value={entry.relationship || ""} onChange={(e) => updateEntry(i, "relationship", e.target.value)} placeholder="Relationship (e.g., Manager)" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="text" value={entry.contact || ""} onChange={(e) => updateEntry(i, "contact", e.target.value)} placeholder="Phone number" className="h-8 text-sm" />
            <Input type="email" value={entry.email || ""} onChange={(e) => updateEntry(i, "email", e.target.value)} placeholder="Email address" className="h-8 text-sm" />
          </div>
        </div>
      ))}
      {entries.length < maxEntries && (
        <Button variant="outline" size="sm" onClick={addEntry} className="gap-1.5 text-xs h-7">
          <Plus size={12} /> Add Reference
        </Button>
      )}
    </div>
  )
}

const FIELD_RENDERERS = {
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

export function ResumeSectionRenderer({ section, value, onChange }) {
  const [collapsed, setCollapsed] = useState(false)
  const Renderer = FIELD_RENDERERS[section.field_type] || TextInput
  const hasValue = value !== undefined && value !== null && value !== "" &&
    !(Array.isArray(value) && value.length === 0) &&
    !(typeof value === "object" && value !== null && Object.keys(value).length === 0)

  return (
    <div className={cn(
      "rounded-lg border transition-colors",
      section.is_required && !hasValue
        ? "border-amber-200 bg-amber-50/30 dark:border-amber-800 dark:bg-amber-950/10"
        : "border-[var(--border-light)] bg-[var(--bg-surface)]"
    )}>
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical size={14} className="text-[var(--text-muted)] shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--text-primary)]">{section.label}</h4>
            {section.is_required && <span className="text-[10px] font-medium text-red-500">*Required</span>}
          </div>
          {section.description && (
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {hasValue && (
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Filled</span>
          )}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] transition-colors"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div className="border-t border-[var(--border-light)] px-4 py-3">
          <Renderer
            value={value}
            onChange={onChange}
            placeholder={section.description}
            config={section.config}
          />
        </div>
      )}
    </div>
  )
}
