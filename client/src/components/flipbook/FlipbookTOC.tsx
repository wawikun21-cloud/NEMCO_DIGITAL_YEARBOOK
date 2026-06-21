import type { TOCItem } from "./types"

interface FlipbookTOCProps {
  items: TOCItem[]
  currentPage: number
  onNavigate: (page: number) => void
  onClose: () => void
}

export default function FlipbookTOC({
  items,
  currentPage,
  onNavigate,
  onClose,
}: FlipbookTOCProps) {
  return (
    <div className="absolute left-0 top-0 z-40 h-full w-72 border-r border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-semibold text-white/90">Contents</span>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="overflow-y-auto styled-scroll" style={{ maxHeight: "calc(100% - 52px)" }}>
        {items.map((item, index) => {
          const isActive = currentPage === item.page
          return (
            <button
              key={index}
              onClick={() => {
                onNavigate(item.page)
                onClose()
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                isActive
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/90"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-white/5 text-white/40"
                }`}
              >
                {item.page + 1}
              </span>
              <span className="truncate text-sm">{item.title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
