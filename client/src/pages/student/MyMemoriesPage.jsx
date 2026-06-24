import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Star,
  Calendar,
  MoreHorizontal,
  Image,
  Film,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  Download,
  MapPin,
  Clock,
  Users,
  BookOpen,
  ArrowLeft,
  Share2,
  Flag,
  Play,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAlbumGrid, useAlbumDetail } from "@/hooks/useMemories"
import { toast } from "sonner"

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "photo", label: "Photos" },
  { key: "video", label: "Videos" },
  { key: "event", label: "Events" },
  { key: "organization", label: "Organizations" },
  { key: "favorites", label: "Favorites", icon: Star },
  { key: "shared", label: "Shared" },
]

const SORT_OPTIONS = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "az", label: "A–Z" },
  { key: "most_items", label: "Most items" },
]

function formatDate(dateStr) {
  if (!dateStr) return ""
  const date = new Date(dateStr + "T00:00:00")
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
}

function formatTime(timeStr) {
  if (!timeStr) return ""
  const [h, m] = timeStr.split(":")
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 || 12
  return `${hour12}:${m || "00"} ${ampm}`
}

function AlbumCard({ album, onOpen, onToggleFavorite }) {
  const [imgError, setImgError] = useState(false)

  return (
    <div className="group relative flex flex-col rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-subtle)]">
        {!imgError && album.cover_image_url ? (
          <img
            src={album.cover_image_url}
            alt={album.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--bg-subtle)]">
            <Image size={40} className="text-[var(--text-muted)]/40" />
          </div>
        )}

        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
          {album.category === "video" ? <Film size={12} /> : <Image size={12} />}
          <span>{album.item_count || 0}</span>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(album.id) }}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
        >
          <Star size={14} className={album.is_favorite ? "fill-yellow-400 text-yellow-400" : ""} />
        </button>

        <button
          onClick={() => onOpen(album.id)}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[var(--text-primary)] shadow-sm transition-all hover:bg-white opacity-0 group-hover:opacity-100"
        >
          <LayoutGrid size={16} />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{album.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Calendar size={12} />
            <span>{formatDate(album.event_date)}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]">
                <MoreHorizontal size={14} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => onToggleFavorite(album.id)} className="gap-2">
                <Star size={14} />
                {album.is_favorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Share2 size={14} />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2">
                <Download size={14} />
                Download album
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 text-[var(--accent-danger)]">
                <Flag size={14} />
                Report issue
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

function AlbumDetailView({ albumId, onBack }) {
  const { album, isLoading, error, toggleItemFavorite } = useAlbumDetail()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [filmstripScrollRef, setFilmstripScrollRef] = useState(null)

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <div className="flex gap-4">
          <Skeleton className="aspect-[4/3] flex-1 rounded-xl" />
          <Skeleton className="hidden h-96 w-80 rounded-xl lg:block" />
        </div>
      </div>
    )
  }

  if (error || !album) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-sm text-[var(--text-muted)]">{error || "Album not found"}</p>
        <Button variant="outline" onClick={onBack}>Back to Albums</Button>
      </div>
    )
  }

  const items = album.items || []
  const currentItem = items[currentIndex]

  const goToPrev = () => setCurrentIndex((i) => Math.max(0, i - 1))
  const goToNext = () => setCurrentIndex((i) => Math.min(items.length - 1, i + 1))

  const scrollFilmstrip = (direction) => {
    if (filmstripScrollRef) {
      filmstripScrollRef.scrollBy({ left: direction * 200, behavior: "smooth" })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ArrowLeft size={16} />
          Back to Albums
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
            <button onClick={goToPrev} disabled={currentIndex === 0} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] disabled:opacity-30">
              <ChevronLeft size={16} />
            </button>
            <span>{currentIndex + 1} / {items.length}</span>
            <button onClick={goToNext} disabled={currentIndex === items.length - 1} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] disabled:opacity-30">
              <ChevronRight size={16} />
            </button>
          </div>
          <button onClick={onBack} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-muted)]">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-4 lg:flex-row">
        <div className="relative flex-1">
          {currentItem && (
            <div className="relative overflow-hidden rounded-xl bg-[var(--bg-subtle)]">
              {currentItem.media_type === "video" ? (
                <video
                  src={currentItem.cloud_url}
                  controls
                  className="mx-auto max-h-[70vh] w-full object-contain"
                />
              ) : (
                <img
                  src={currentItem.thumbnail_url || currentItem.cloud_url}
                  alt={currentItem.caption || `Item ${currentIndex + 1}`}
                  className="mx-auto max-h-[70vh] w-full object-contain"
                />
              )}

              {items.length > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={goToNext}
                    disabled={currentIndex === items.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 disabled:opacity-30"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              <div className="absolute top-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                {currentIndex + 1} / {items.length}
              </div>
            </div>
          )}
        </div>

        <div className="flex w-full flex-col gap-4 lg:w-80">
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] p-4">
            <Badge variant="default" className="w-fit gap-1 text-xs">
              {album.category === "video" ? <Film size={12} /> : <Image size={12} />}
              {album.title}
            </Badge>

            <h2 className="text-lg font-bold text-[var(--text-primary)]">{album.title}</h2>

            <div className="flex flex-col gap-2 text-sm text-[var(--text-secondary)]">
              {album.event_date && (
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="shrink-0 text-[var(--text-muted)]" />
                  <span>{formatDate(album.event_date)}{album.event_time ? ` at ${formatTime(album.event_time)}` : ""}</span>
                </div>
              )}
              {album.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="shrink-0 text-[var(--text-muted)]" />
                  <span>{album.location}</span>
                </div>
              )}
            </div>

            {album.description && (
              <div className="border-t border-[var(--border-light)] pt-3">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">Description</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{album.description}</p>
              </div>
            )}

            {currentItem?.tagged_student_ids?.length > 0 && (
              <div className="border-t border-[var(--border-light)] pt-3">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Tagged People ({currentItem.tagged_student_ids.length})</p>
                <div className="flex items-center -space-x-2">
                  {currentItem.tagged_student_ids.slice(0, 5).map((id) => (
                    <div key={id} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)]">
                      {id.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {currentItem.tagged_student_ids.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--bg-surface)] bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)]">
                      +{currentItem.tagged_student_ids.length - 5}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-[var(--border-light)] pt-3">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <BookOpen size={14} className="shrink-0 text-[var(--text-muted)]" />
                <span>{album.title}</span>
              </div>
            </div>

            {album.creator && (
              <div className="border-t border-[var(--border-light)] pt-3">
                <p className="text-xs font-semibold text-[var(--text-primary)] mb-1">Uploaded by</p>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)]">
                    {album.creator.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-[var(--text-secondary)]">{album.creator.name}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2 border-t border-[var(--border-light)] pt-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => currentItem && toggleItemFavorite(currentItem.id)}
              >
                <Heart size={14} className={currentItem?.is_favorite ? "fill-red-500 text-red-500" : ""} />
                {currentItem?.is_favorite ? "Favorited" : "Favorite"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
                onClick={() => currentItem && window.open(currentItem.cloud_url, "_blank")}
              >
                <Download size={14} />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="relative border-t border-[var(--border-light)] bg-[var(--bg-surface)] px-4 py-3">
          <button
            onClick={() => scrollFilmstrip(-1)}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface)] shadow-md border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={setFilmstripScrollRef}
            className="flex gap-2 overflow-x-auto px-8 styled-scroll"
          >
            {items.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === currentIndex
                    ? "border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/20"
                    : "border-transparent hover:border-[var(--border-light)]"
                }`}
              >
                {idx === currentIndex && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-[var(--accent-gold)]" />
                )}
                <div className="h-16 w-20 overflow-hidden bg-[var(--bg-subtle)]">
                  <img
                    src={item.thumbnail_url || item.cloud_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
                {item.media_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
                      <Play size={10} className="text-white fill-white ml-0.5" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollFilmstrip(1)}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--bg-surface)] shadow-md border border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function MyMemoriesPage() {
  const { albums, total, isLoading, error, filters, updateFilters, goToPage } = useAlbumGrid()
  const [selectedAlbumId, setSelectedAlbumId] = useState(null)
  const [viewMode, setViewMode] = useState("grid")
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  const totalPages = Math.ceil(total / filters.perPage)

  const handleToggleFavorite = async (albumId) => {
    toast.success("Favorite updated")
  }

  if (selectedAlbumId) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col">
        <AlbumDetailView albumId={selectedAlbumId} onBack={() => setSelectedAlbumId(null)} />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            My Memories
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Browse your photos, videos, achievements, and yearbook memories.
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button className="gap-2">
            <Plus size={16} />
            Add Memory
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-1">
          {FILTER_TABS.map((tab) => {
            const isActive = filters.category === tab.key
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => {
                  if (tab.key === "shared") {
                    updateFilters({ category: "all", shared: !filters.shared })
                  } else {
                    updateFilters({ category: tab.key, shared: false })
                  }
                }}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                }`}
              >
                {Icon && <Icon size={14} />}
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              placeholder="Search albums..."
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu open={showSortDropdown} onOpenChange={setShowSortDropdown}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="text-[var(--text-muted)]">Sort by:</span>
                  <span>{SORT_OPTIONS.find((o) => o.key === filters.sortBy)?.label || "Newest"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                {SORT_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.key}
                    onClick={() => { updateFilters({ sortBy: opt.key }); setShowSortDropdown(false) }}
                    className={filters.sortBy === opt.key ? "bg-[var(--bg-subtle)]" : ""}
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex rounded-lg border border-[var(--border-light)]">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex h-8 w-8 items-center justify-center rounded-l-lg transition-colors ${
                  viewMode === "grid" ? "bg-[var(--bg-subtle)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex h-8 w-8 items-center justify-center rounded-r-lg transition-colors ${
                  viewMode === "list" ? "bg-[var(--bg-subtle)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Failed to load memories</p>
          <p className="text-xs text-[var(--text-muted)]">{error}</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] py-16">
          <Image size={48} className="text-[var(--text-muted)]/30" />
          <p className="text-sm font-medium text-[var(--text-muted)]">No memories found</p>
          <p className="text-xs text-[var(--text-muted)]/70">Albums will appear here when they are shared with you.</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === "grid"
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        }`}>
          {albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              onOpen={setSelectedAlbumId}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page <= 1}
            onClick={() => goToPage(filters.page - 1)}
            className="gap-1"
          >
            <ChevronLeft size={14} />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (filters.page <= 3) {
                pageNum = i + 1
              } else if (filters.page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = filters.page - 2 + i
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                    filters.page === pageNum
                      ? "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {pageNum}
                </button>
              )
            })}
            {totalPages > 5 && filters.page < totalPages - 2 && (
              <span className="px-1 text-[var(--text-muted)]">…</span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page >= totalPages}
            onClick={() => goToPage(filters.page + 1)}
            className="gap-1"
          >
            Next
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </main>
  )
}
