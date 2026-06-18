import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLoginForm } from "@/hooks/useLoginForm"
import { loginWithBackend } from "@/services/authService"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const { formData, errors, isSubmitting, handleChange, handleSubmit } = useLoginForm()
  const [loginError, setLoginError] = useState("")
  const { login: setAuthLogin } = useAuth()

  const onSubmit = async (data) => {
    setLoginError("")

    try {
      const result = await loginWithBackend(data)
      // Update AuthProvider context with user and profile
      setAuthLogin(result.user, result.profile)
      // Redirect to library page after successful login
      window.location.href = "/library"
    } catch (error) {
      setLoginError(error.message || "Login failed. Please check your credentials.")
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted p-4">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/Loginbackground.png')" }}
      />
      <div className="absolute inset-0 bg-navy/3" />
      <div className="relative z-10 w-full max-w-sm rounded-md border border-muted bg-background shadow-md overflow-hidden animate-login animate-delay-200">
        <div className="flex flex-col items-center gap-4 bg-navy px-6 py-8 animate-fade-in-down animate-delay-300">
          <img
            src="/NEMCO-Logo.png"
            alt="NEMCO Logo"
            className="h-12 w-auto opacity-90 animate-fade-in-down animate-delay-400"
          />
          <div className="space-y-1 text-center animate-fade-in-down animate-delay-500">
            <h1 className="text-2xl font-semibold tracking-tight text-navy-foreground">
              NEMCO Yearbook Portal
            </h1>
            <p className="text-sm text-navy-foreground/80">
              Your Digital Collection of School Memories
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6 animate-fade-in-up animate-delay-600">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {loginError && (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {loginError}
              </p>
            )}

            <div className="space-y-2">
              <label htmlFor="studentId" className="text-sm font-medium">
                Student ID No.
              </label>
              <Input
                id="studentId"
                name="studentId"
                type="text"
                placeholder="e.g. 002XXXX"
                value={formData.studentId}
                onChange={handleChange}
                required
                autoComplete="off"
                className={
                  errors.studentId
                    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                    : ""
                }
              />
              {errors.studentId && (
                <p className="text-xs text-destructive">{errors.studentId}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                className={
                  errors.password
                    ? "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
                    : ""
                }
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-navy text-navy-foreground hover:bg-navy/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} NEMCO Digital Yearbook. All rights reserved.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}