import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { getPublicProfile } from "@/services/profileService"
import { ProfileCardFront } from "@/components/profile/ProfileCardFront"
import { ProfileCardBack } from "@/components/profile/ProfileCardBack"
import { useFlipCard } from "@/hooks/useFlipCard"
import { cn } from "@/lib/utils"

function getIdentifierFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean)
  const index = parts.findIndex((part) => part === "u" || part === "profile")

  if (index === -1) return null
  return decodeURIComponent(parts[index + 1] || "")
}

export default function PublicProfilePage() {
  const { isFlipped, flip } = useFlipCard()
  const qrCanvasRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [isOpen, setIsOpen] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const identifier = getIdentifierFromPath()
    let cancelled = false

    if (!identifier) {
      queueMicrotask(() => setError("Profile link is missing an identifier."))
      queueMicrotask(() => setIsLoading(false))
      return
    }

    queueMicrotask(() => setError(null))

    getPublicProfile(identifier)
      .then((fetchedProfile) => {
        if (!cancelled) setProfile(fetchedProfile)
      })
      .catch((fetchError) => {
        if (!cancelled) setError(fetchError.message || "Profile not found")
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="border-0 bg-transparent p-0 shadow-none sm:max-w-none">
        <div className="relative min-h-screen w-full overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: "url('/Loginbackground.png')" }}
          />
          <div className="absolute inset-0 bg-navy/3" />
          <img
            src="/NEMCO-Logo.png"
            alt="NEMCO Logo"
            className="absolute left-4 top-4 z-20 mt-6 h-10 w-auto drop-shadow-md sm:left-6 sm:top-6 sm:mt-6 sm:h-12"
          />

          <div className="relative z-10 flex min-h-screen w-full items-center justify-center">
            {isLoading ? (
              <div className="flex min-h-[620px] items-center justify-center p-4">
                <Skeleton className="h-[520px] w-[300px] rounded-3xl sm:h-[560px] sm:w-[320px]" />
              </div>
            ) : error ? (
              <div className="flex min-h-[620px] items-center justify-center p-4">
                <div className="mx-auto max-w-md rounded-3xl bg-popover p-8 text-center text-popover-foreground shadow-xl ring-1 ring-foreground/10">
                  <h1 className="text-xl font-bold">Profile not found</h1>
                  <p className="mt-2 text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : profile ? (
              <main className="flex min-h-[620px] flex-col items-center justify-center gap-4 p-4">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Click to flip the profile card"
                  onClick={flip}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") flip()
                  }}
                  className="group h-[520px] w-[300px] cursor-pointer sm:h-[560px] sm:w-[320px]"
                  style={{ perspective: "1600px", WebkitPerspective: "1600px" }}
                >
                  <div
                    className="relative h-full w-full transition-transform duration-500"
                    style={{
                      transformStyle: "preserve-3d",
                      WebkitTransformStyle: "preserve-3d",
                      transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                      WebkitTransform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    }}
                  >
                    <div
                      className={cn("absolute inset-0 shadow-xl", isFlipped && "pointer-events-none")}
                      style={{ WebkitBackfaceVisibility: "hidden", backfaceVisibility: "hidden" }}
                    >
                      <ProfileCardFront profile={profile} />
                    </div>
                    <div
                      className={cn("absolute inset-0 shadow-xl", !isFlipped && "pointer-events-none")}
                      style={{
                        WebkitBackfaceVisibility: "hidden",
                        backfaceVisibility: "hidden",
                        WebkitTransform: "rotateY(180deg)",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <ProfileCardBack
                        profile={profile}
                        qrData={profile.qr_data}
                        hasQrCode={Boolean(profile.qr_data)}
                        isGenerating={false}
                        canvasWrapperRef={qrCanvasRef}
                        onGenerate={() => {}}
                        onDownload={() => {}}
                        showQrControls={false}
                      />
                    </div>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Click the card to flip it
                </p>
              </main>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}