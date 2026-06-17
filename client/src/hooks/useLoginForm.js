import { useState } from "react"

export function useLoginForm(initialState = { studentId: "", password: "" }) {
  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.studentId.trim()) {
      newErrors.studentId = "Please fill out this field"
    }
    if (!formData.password) {
      newErrors.password = "Please fill out this field"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (onSubmit) => (e) => {
    e.preventDefault()
    if (validate()) {
      setIsSubmitting(true)
      onSubmit?.(formData)
      setIsSubmitting(false)
    }
  }

  const reset = () => {
    setFormData(initialState)
    setErrors({})
  }

  return {
    formData,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    reset,
  }
}