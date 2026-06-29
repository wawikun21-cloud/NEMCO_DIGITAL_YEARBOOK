import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Hash, Mail, User, Shield } from "lucide-react"
import { getCourseOptions, getSubOptions } from "@/utils/courseOptions"

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
]

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
]

const PROFILE_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "completed", label: "Completed" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

export default function UserFormModal({ open, onOpenChange, user, onSubmit }) {
  const isEdit = !!user
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    student_number: "",
    email: "",
    full_name: "",
    display_name: "",
    year_level: "",
    course_or_strand: "",
    sub_course: "",
    section: "",
    bio: "",
    quote: "",
    role: "user",
    status: "active",
    profile_status: "draft",
  })
  const [errors, setErrors] = useState({})

  const initRef = useRef(null)
  const courseOptions = getCourseOptions()
  const subOptions = getSubOptions(formData.course_or_strand)

  useEffect(() => {
    if (open) {
      const userId = user?.id
      if (initRef.current !== userId) {
        setFormData({
          student_number: user?.student_number || "",
          email: user?.email || "",
          full_name: user?.full_name || "",
          display_name: user?.display_name || "",
          year_level: user?.year_level || "",
          course_or_strand: user?.course_or_strand || "",
          sub_course: user?.sub_course || "",
          section: user?.section || "",
          bio: user?.bio || "",
          quote: user?.quote || "",
          role: user?.role || "user",
          status: user?.status || "active",
          profile_status: user?.profile_status || "draft",
        })
        setErrors({})
        initRef.current = userId
      }
      setSubmitting(false)
    }
  }, [open, user])

  const inputClass = (hasError) =>
    `h-9 w-full rounded-md border ${hasError ? "border-[var(--status-red)]" : "border-[var(--border-light)]"} bg-[var(--bg-surface)] px-3 py-1.5 text-sm text-[var(--text-primary)] shadow-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50`

  const selectTriggerClass = () =>
    "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors outline-none focus:ring-2 focus:ring-ring"

  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === "course_or_strand") {
        const newSubs = getSubOptions(value)
        if (!newSubs.includes(prev.sub_course)) {
          next.sub_course = ""
        }
      }
      return next
    })
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!formData.student_number.trim()) {
      newErrors.student_number = "Student number is required"
    } else if (!/^[0-9]{7}$/.test(formData.student_number)) {
      newErrors.student_number = "Must be 7 digits"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = "Invalid email format"
    }

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required"
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Minimum 2 characters"
    }

    if (!formData.year_level) {
      newErrors.year_level = "Year level is required"
    }

    if (!formData.course_or_strand) {
      newErrors.course_or_strand = "Course/Strand is required"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    Promise.resolve(onSubmit({
      ...formData,
      id: user?.id,
    })).finally(() => setSubmitting(false))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className="w-full sm:w-[500px] max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update user details and permissions." : "Add a new user to the system."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            {/* Student Number */}
            <div className="grid gap-2">
              <Label htmlFor="student_number" className="flex items-center gap-1.5">
                <Hash size={14} className="text-[var(--text-muted)]" />
                Student Number
                <span className="text-[var(--status-red)]">*</span>
              </Label>
              <input
                id="student_number"
                type="text"
                value={formData.student_number}
                onChange={(e) => updateField("student_number", e.target.value)}
                disabled={isEdit}
                className={inputClass(!!errors.student_number)}
                placeholder="e.g. 0026284"
              />
              {errors.student_number && (
                <p className="text-xs text-[var(--status-red)]">{errors.student_number}</p>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail size={14} className="text-[var(--text-muted)]" />
                Email
                <span className="text-[var(--status-red)]">*</span>
              </Label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={inputClass(!!errors.email)}
                placeholder="student@example.com"
              />
              {errors.email && (
                <p className="text-xs text-[var(--status-red)]">{errors.email}</p>
              )}
            </div>

            {/* Full Name */}
            <div className="grid gap-2">
              <Label htmlFor="full_name" className="flex items-center gap-1.5">
                <User size={14} className="text-[var(--text-muted)]" />
                Full Name
                <span className="text-[var(--status-red)]">*</span>
              </Label>
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => updateField("full_name", e.target.value)}
                className={inputClass(!!errors.full_name)}
                placeholder="Juan Dela Cruz"
              />
              {errors.full_name && (
                <p className="text-xs text-[var(--status-red)]">{errors.full_name}</p>
              )}
            </div>

            {/* Display Name */}
            <div className="grid gap-2">
              <Label htmlFor="display_name">Display Name</Label>
              <input
                id="display_name"
                type="text"
                value={formData.display_name}
                onChange={(e) => updateField("display_name", e.target.value)}
                className={inputClass(false)}
                placeholder="Juan (optional)"
              />
            </div>

            {/* Role & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="flex items-center gap-1.5">
                  <Shield size={14} className="text-[var(--text-muted)]" />
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(val) => updateField("role", val)}>
                  <SelectTrigger className={selectTriggerClass()}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant={opt.value === "admin" ? "admin" : "user"} className="text-[10px]">
                            {opt.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Account Status</Label>
                <Select value={formData.status} onValueChange={(val) => updateField("status", val)}>
                  <SelectTrigger className={selectTriggerClass()}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant={opt.value} className="text-[10px]">
                            {opt.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profile Status */}
            <div className="grid gap-2">
              <Label>Profile Status</Label>
              <Select value={formData.profile_status} onValueChange={(val) => updateField("profile_status", val)}>
                <SelectTrigger className={selectTriggerClass()}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <Badge variant={opt.value} className="text-[10px]">
                          {opt.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

             {/* Year Level & Course/Strand */}
             <div className="grid grid-cols-2 gap-3">
               <div className="grid gap-2">
                 <Label>Year Level</Label>
                 <input
                   type="text"
                   value={formData.year_level}
                   onChange={(e) => updateField("year_level", e.target.value)}
                   className={inputClass(!!errors.year_level)}
                   placeholder="e.g. 11 or 12"
                 />
                 {errors.year_level && (
                   <p className="text-xs text-[var(--status-red)]">{errors.year_level}</p>
                 )}
               </div>

               <div className="grid gap-2">
                 <Label>Course/Strand</Label>
                 <Select value={formData.course_or_strand} onValueChange={(val) => updateField("course_or_strand", val)}>
                   <SelectTrigger className={selectTriggerClass()}>
                     <SelectValue placeholder="Select course" />
                   </SelectTrigger>
                   <SelectContent>
                     {courseOptions.map((c) => (
                       <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {errors.course_or_strand && (
                   <p className="text-xs text-[var(--status-red)]">{errors.course_or_strand}</p>
                 )}
               </div>
             </div>

             {/* Sub-Course */}
             <div className="grid gap-2">
               <Label>Sub-Course / Major</Label>
               {subOptions.length === 0 ? (
                 <input
                   type="text"
                   value={formData.sub_course}
                   onChange={(e) => updateField("sub_course", e.target.value)}
                   className={inputClass(false)}
                   placeholder="N/A for this course"
                 />
               ) : (
                 <Select value={formData.sub_course} onValueChange={(val) => updateField("sub_course", val)}>
                   <SelectTrigger className={selectTriggerClass()}>
                     <SelectValue placeholder="Select sub-course" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="">None</SelectItem>
                     {subOptions.map((s) => (
                       <SelectItem key={s} value={s}>{s}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               )}
             </div>

            {/* Section */}
            <div className="grid gap-2">
              <Label>Section</Label>
              <input
                type="text"
                value={formData.section}
                onChange={(e) => updateField("section", e.target.value)}
                className={inputClass(false)}
                placeholder="e.g. A, B, C (optional)"
              />
            </div>

            {/* Bio */}
            <div className="grid gap-2">
              <Label>Bio</Label>
              <textarea
                value={formData.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                className="min-h-[80px] w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Short bio (optional)"
              />
            </div>

            {/* Quote */}
            <div className="grid gap-2">
              <Label>Quote</Label>
              <textarea
                value={formData.quote}
                onChange={(e) => updateField("quote", e.target.value)}
                className="min-h-[60px] w-full rounded-md border border-[var(--border-light)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm transition-colors placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Favorite quote (optional)"
              />
            </div>
          </div>

          <DialogFooter>
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
               Cancel
             </Button>
             <Button type="submit" disabled={submitting}>
               {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create User"}
             </Button>
           </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}