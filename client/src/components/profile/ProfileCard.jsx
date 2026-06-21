import { RotateCw } from "lucide-react"
import { useFlipCard } from "@/hooks/useFlipCard"
import { useQRCode } from "@/hooks/useQRCode"
import { ProfileCardFront } from "@/components/profile/ProfileCardFront"
import { ProfileCardBack } from "@/components/profile/ProfileCardBack"
import { cn } from "@/lib/utils"

export function ProfileCard({ profile, setProfile, avatarPreview, isEditing, onAvatarSelect }) {
  const { isFlipped, flip } = useFlipCard()
  const { qrData, hasQrCode, canvasWrapperRef, downloadQrCode } = useQRCode(profile, setProfile)

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Click to flip the profile card"
        onClick={() => !isEditing && flip()}
        onKeyDown={(e) => {
          if (!isEditing && (e.key === "Enter" || e.key === " ")) flip()
        }}
        className={cn(
          // Fluid sizing: scales smoothly from phone -> tablet -> desktop
          // instead of jumping between fixed breakpoint pixel values.
          "group [perspective:1600px] w-full",
          "max-w-[clamp(260px,80vw,360px)] aspect-[3/5]",
          isEditing ? "cursor-default" : "cursor-pointer"
        )}
      >
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
        >
          <div className={cn(
            "absolute inset-0 shadow-xl [backface-visibility:hidden]",
            isFlipped && "pointer-events-none"
          )}>
            <ProfileCardFront
              profile={profile}
              avatarPreview={avatarPreview}
              isEditing={isEditing}
              onAvatarSelect={onAvatarSelect}
            />
          </div>

          <div className={cn(
            "absolute inset-0 shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]",
            !isFlipped && "pointer-events-none"
          )}>
            <ProfileCardBack
              profile={profile}
              qrData={qrData}
              hasQrCode={hasQrCode}
              canvasWrapperRef={canvasWrapperRef}
              onDownloadQrCode={downloadQrCode}
            />
          </div>
        </div>
      </div>

      {!isEditing && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RotateCw size={13} />
          Click the card to flip it and view your QR code on the back
        </p>
      )}
    </div>
  )
}