/**
 * DashboardHero
 * Full-width banner — no card border or shadow.
 *
 * Image path: place Image-hero.png in /public/images/Image-hero.png
 * OR keep it in /src/assets/ — both import strategies are shown,
 * uncomment whichever matches your setup.
 *
 * Props:
 *  - greeting:  string  e.g. "Good morning"
 *  - firstName: string
 */
import heroImage from "@/assets/Image-hero.png"

export default function DashboardHero({ greeting, firstName }) {
  return (
    <section
      aria-label="Welcome banner"
      className="
        relative w-full overflow-hidden rounded-xl
        px-8 py-3 sm:px-5 sm:py-4 sm:py-5
      "
    >

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up animate-delay-100">

        {/* ── Text ── */}
        <div className="flex flex-col gap-2">
          <h1 className="
            text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl
            text-[var(--text-primary)] dark:text-white
          ">
            {greeting}, {firstName}!&nbsp;
            <span role="img" aria-label="waving hand">👋</span>
          </h1>
          <p className="text-sm text-[var(--text-muted)] dark:text-[var(--navy-foreground)]/70">
            Choose what you want to access below.
          </p>
        </div>

        {/* ── Hero image ── */}
        <div className="flex shrink-0 items-end justify-center sm:justify-end">
          <img
            src={heroImage}
            alt="Graduation cap and books"
            className="
              h-48 w-auto object-contain drop-shadow-lg
              sm:h-60 lg:h-72
              [mix-blend-mode:multiply] dark:[mix-blend-mode:normal]
            "
            onError={(e) => {
              console.warn("Hero image failed to load:", e.currentTarget.src)
              e.currentTarget.style.display = "none"
            }}
          />
        </div>

      </div>
    </section>
  )
}