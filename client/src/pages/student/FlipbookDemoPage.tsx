import { useState } from "react"
import { Flipbook } from "@/components/flipbook"

const SAMPLE_PDF_URL = "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/examples/learning/helloworld.pdf"

const SAMPLE_PAGES = [
  {
    src: "https://picsum.photos/seed/fb1/800/1100",
    thumb: "https://picsum.photos/seed/fb1/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb2/800/1100",
    thumb: "https://picsum.photos/seed/fb2/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb3/800/1100",
    thumb: "https://picsum.photos/seed/fb3/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb4/800/1100",
    thumb: "https://picsum.photos/seed/fb4/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb5/800/1100",
    thumb: "https://picsum.photos/seed/fb5/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb6/800/1100",
    thumb: "https://picsum.photos/seed/fb6/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb7/800/1100",
    thumb: "https://picsum.photos/seed/fb7/200/275",
  },
  {
    src: "https://picsum.photos/seed/fb8/800/1100",
    thumb: "https://picsum.photos/seed/fb8/200/275",
  },
]

const SAMPLE_TOC = [
  { title: "Cover", page: 0 },
  { title: "Introduction", page: 1 },
  { title: "Chapter 1: Getting Started", page: 2 },
  { title: "Chapter 2: Core Concepts", page: 3 },
  { title: "Chapter 3: Advanced Topics", page: 4 },
  { title: "Chapter 4: Case Studies", page: 5 },
  { title: "Appendix", page: 6 },
  { title: "Back Cover", page: 7 },
]

export default function FlipbookDemoPage() {
  const [demoMode, setDemoMode] = useState<"pdf" | "images">("images")
  const [renderMode, setRenderMode] = useState<"webgl" | "css">("webgl")
  const [currentPage, setCurrentPage] = useState(0)

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <div className="border-b border-[var(--border-light)] bg-[var(--bg-surface)] px-6 py-4">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            Flipbook 3D Viewer
          </h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            WebGL-powered page flip component with full UI controls
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-[var(--border-light)] bg-[var(--bg-subtle)] px-6 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Source:</span>
            <button
              onClick={() => setDemoMode("images")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                demoMode === "images"
                  ? "bg-[var(--bg-primary)] text-white"
                  : "bg-white text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
              }`}
            >
              Image Array
            </button>
            <button
              onClick={() => setDemoMode("pdf")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                demoMode === "pdf"
                  ? "bg-[var(--bg-primary)] text-white"
                  : "bg-white text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
              }`}
            >
              PDF URL
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">Renderer:</span>
            <button
              onClick={() => setRenderMode("webgl")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                renderMode === "webgl"
                  ? "bg-[var(--bg-primary)] text-white"
                  : "bg-white text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
              }`}
            >
              WebGL
            </button>
            <button
              onClick={() => setRenderMode("css")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                renderMode === "css"
                  ? "bg-[var(--bg-primary)] text-white"
                  : "bg-white text-[var(--text-secondary)] hover:bg-[var(--border-light)]"
              }`}
            >
              CSS
            </button>
          </div>

          {currentPage > 0 && (
            <span className="text-xs text-[var(--text-muted)]">
              Current page: {currentPage + 1}
            </span>
          )}
        </div>
      </div>

      {/* Flipbook */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="overflow-hidden rounded-2xl bg-[#1a1a2e] shadow-2xl">
          {demoMode === "pdf" ? (
            <Flipbook
              pdfUrl={SAMPLE_PDF_URL}
              mode={renderMode}
              viewMode="double"
              sound={true}
              tableOfContent={SAMPLE_TOC}
              flipSpeed={0.6}
              onPageChange={(page) => setCurrentPage(page)}
              onReady={() => console.log("Flipbook ready")}
              theme={{
                toolbarBg: "rgba(26, 26, 46, 0.9)",
                btnColor: "#ffffff",
                btnHoverBg: "rgba(255,255,255,0.12)",
              }}
              className="min-h-[600px]"
            />
          ) : (
            <Flipbook
              pages={SAMPLE_PAGES}
              mode={renderMode}
              viewMode="double"
              sound={true}
              tableOfContent={SAMPLE_TOC}
              flipSpeed={0.6}
              onPageChange={(page) => setCurrentPage(page)}
              onReady={() => console.log("Flipbook ready")}
              theme={{
                toolbarBg: "rgba(26, 26, 46, 0.9)",
                btnColor: "#ffffff",
                btnHoverBg: "rgba(255,255,255,0.12)",
              }}
              className="min-h-[600px]"
            />
          )}
        </div>

        {/* Feature list */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "WebGL Page Curl", desc: "Realistic 3D page bend with Three.js vertex deformation" },
            { title: "Dynamic Lighting", desc: "Moving highlight and specular on the curling page surface" },
            { title: "Drag to Flip", desc: "Click near edge and drag — page follows cursor in real time" },
            { title: "Click to Flip", desc: "Click page edges for auto-animated full page turns" },
            { title: "Touch Support", desc: "Swipe to flip, pinch to zoom, pan while zoomed" },
            { title: "Sound Effects", desc: "Synthesized paper rustle on each page turn" },
            { title: "Keyboard Nav", desc: "Arrow keys, Escape to close panels" },
            { title: "PDF Support", desc: "Lazy-loaded PDF rendering with pdfjs-dist" },
            { title: "CSS Fallback", desc: "Graceful degradation for low-power devices" },
            { title: "Thumbnail Grid", desc: "Quick navigation via scrollable page thumbnails" },
            { title: "Table of Contents", desc: "Optional TOC panel for structured navigation" },
            { title: "PDF Search", desc: "Full-text search with results highlighting" },
          ].map((feature, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4"
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {feature.title}
              </h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
