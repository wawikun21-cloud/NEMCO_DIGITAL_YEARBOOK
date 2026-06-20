import { QRCodeCanvas } from "qrcode.react"
import { Landmark, Home, Phone, Mail, Globe, QrCode } from "lucide-react"

function ContactRow({ icon: Icon, label, value, placeholder }) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[clamp(0.75rem,2.8vw,0.85rem)] font-bold text-neutral-900">
        <Icon size={14} />
        {label} :
      </div>
      <p className="pl-0.5 text-[clamp(0.7rem,2.6vw,0.8rem)] text-neutral-600">{value || placeholder}</p>
    </div>
  )
}

// Renders a single "SCAN ME" label centered on one edge of the QR frame.
function ScanMeEdge({ side }) {
  const positionClasses = {
    top: "-top-[7px] left-1/2 -translate-x-1/2 -translate-y-1/2",
    bottom: "-bottom-[7px] left-1/2 -translate-x-1/2 translate-y-1/2",
    left: "-left-[7px] top-1/2 -translate-x-1/2 -translate-y-1/2 [writing-mode:vertical-rl] rotate-180",
    right: "-right-[7px] top-1/2 translate-x-1/2 -translate-y-1/2 [writing-mode:vertical-rl]",
  }

  return (
    <span
      className={`absolute select-none whitespace-nowrap bg-white px-1 text-[8px] font-extrabold tracking-[0.15em] text-neutral-900 ${positionClasses[side]}`}
    >
      SCAN ME
    </span>
  )
}

// Open corner-bracket frame (no solid border box), matching the reference design.
function CornerBracket({ corner }) {
  const base = "absolute h-5 w-5 border-neutral-900"
  const variants = {
    "top-left": "top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-md",
    "top-right": "top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-md",
    "bottom-left": "bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-md",
    "bottom-right": "bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-md",
  }
  return <span className={`${base} ${variants[corner]}`} />
}

export function ProfileCardBack({ profile, qrData, hasQrCode, canvasWrapperRef }) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-3xl bg-white">
      {/* decorative bottom-right blob background */}
      <img
        src="/assets/blob-bottom-bg.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full select-none"
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 px-[8%] pt-[10%]">
        <div
          ref={canvasWrapperRef}
          className="relative flex items-center justify-center p-5"
        >
          <CornerBracket corner="top-left" />
          <CornerBracket corner="top-right" />
          <CornerBracket corner="bottom-left" />
          <CornerBracket corner="bottom-right" />

          <ScanMeEdge side="top" />
          <ScanMeEdge side="bottom" />
          <ScanMeEdge side="left" />
          <ScanMeEdge side="right" />

          {hasQrCode ? (
            <QRCodeCanvas value={qrData} size={160} includeMargin={false} />
          ) : (
            <div className="flex h-[160px] w-[160px] flex-col items-center justify-center gap-3 text-neutral-400">
              <QrCode size={42} strokeWidth={1.5} />
              <span className="text-center text-xs px-4">
                No QR code yet — generate one to share your profile
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex flex-col gap-3.5 px-[8%] pb-[8%] pt-4">
        <ContactRow icon={Landmark} label="School" value={profile?.school} placeholder="Your School" />
        <ContactRow icon={Home} label="Home Address" value={profile?.home_address} placeholder="Your home address" />
        <ContactRow icon={Phone} label="Contact" value={profile?.contact_number} placeholder="+63 000 000 0000" />
        <ContactRow icon={Mail} label="Email Address" value={profile?.email} placeholder="youremail@example.email" />
        <ContactRow icon={Globe} label="Website" value={profile?.website} placeholder="www.yourwebsite.com" />
      </div>
    </div>
  )
}