import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search,
  Plus,
  Trash2,
  Edit3,
  Image,
  Film,
  Calendar,
  MapPin,
  Eye,
  EyeOff,
  Share2,
  GripVertical,
  X,
  Check,
  AlertTriangle,
  RefreshCw,
  Upload,
  ChevronDown,
  ChevronUp,
  Users,
  Star,
  AlertCircle,
  Link2,
  Loader2,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  getAdminAlbums,
  createAlbum,
  updateAlbum,
  deleteAlbum,
  createMemoryItemsBulk,
  deleteMemoryItem,
  reorderItems,
} from "@/services/memoriesService"
import { getDisplayThumbnailUrl, resolveCoverUrl, checkImageUrl, normalizeCoverImageUrl } from "@/utils/coverImageHelpers"
import { toast } from "sonner"

const CATEGORIES = [
  { key: "photo", label: "Photo", icon: Image },
  { key: "video", label: "Video", icon: Film },
  { key: "event", label: "Event", icon: Calendar },
  { key: "organization", label: "Organization", icon: Users },
]

const VISIBILITY_OPTIONS = [
  { key: "all", label: "All Students" },
  { key: "section", label: "Specific Section" },
  { key: "batch", label: "Specific Batch/Year" },
  { key: "specific", label: "Specific Students" },
]

function AlbumFormDialog({ open, onOpenChange, album, onSave }) {
  const [form, setForm] = useState({
    title: "",
    event_date: "",
    event_time: "",
    location: "",
    description: "",
    category: "photo",
    cover_image_url: "",
    cover_image_status: "unchecked",
    album_link: "",
    image_url_2: "",
    image_url_3: "",
    image_url_4: "",
    is_shared: false,
    visible_to: "all",
    visible_to_section: "",
    visible_to_batch: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [coverPreviewError, setCoverPreviewError] = useState(false)

  useEffect(() => {
    if (album) {
      setForm({
        title: album.title || "",
        event_date: album.event_date || "",
        event_time: album.event_time || "",
        location: album.location || "",
        description: album.description || "",
        category: album.category || "photo",
        cover_image_url: album.cover_image_url || "",
        cover_image_status: album.cover_image_status || "unchecked",
        album_link: album.album_link || "",
        image_url_2: album.image_url_2 || "",
        image_url_3: album.image_url_3 || "",
        image_url_4: album.image_url_4 || "",
        is_shared: album.is_shared || false,
        visible_to: album.visible_to || "all",
        visible_to_section: album.visible_to_section || "",
        visible_to_batch: album.visible_to_batch || "",
      })
    } else {
      setForm({
        title: "",
        event_date: "",
        event_time: "",
        location: "",
        description: "",
        category: "photo",
        cover_image_url: "",
        cover_image_status: "unchecked",
        album_link: "",
        image_url_2: "",
        image_url_3: "",
        image_url_4: "",
        is_shared: false,
        visible_to: "all",
        visible_to_section: "",
        visible_to_batch: "",
      })
    }
    setCoverPreviewError(false)
  }, [album, open])

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required")
      return
    }
    setIsSaving(true)
    try {
      const { cover_image_status: _status, ...saveData } = form
      await onSave(saveData)
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Failed to save album")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{album ? "Edit Album" : "Create New Album"}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Graduation Day 2026"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Event Date</label>
              <Input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Event Time</label>
              <Input
                type="time"
                value={form.event_time}
                onChange={(e) => setForm({ ...form, event_time: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Location</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. NEMCO College Quadrangle"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description of this album..."
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.key}
                    onClick={() => setForm({ ...form, category: cat.key })}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                      form.category === cat.key
                        ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                        : "border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <Icon size={14} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Cover Image URL</label>
            <Input
              value={form.cover_image_url}
              onChange={(e) => { setForm({ ...form, cover_image_url: e.target.value, cover_image_status: "unchecked" }); setCoverPreviewError(false) }}
              onBlur={(e) => {
                const normalized = normalizeCoverImageUrl(e.target.value)
                if (normalized !== e.target.value) {
                  setForm((prev) => ({ ...prev, cover_image_url: normalized }))
                }
              }}
              placeholder="Paste a cloud storage link (Google Drive, Dropbox, etc.)..."
            />
            {form.cover_image_url && !coverPreviewError && (
              <div className="mt-1 overflow-hidden rounded-lg border border-[var(--border-light)]">
                <img
                  src={getDisplayThumbnailUrl(form.cover_image_url, 400)}
                  alt="Cover preview"
                  className="h-32 w-full object-cover"
                  onError={() => setCoverPreviewError(true)}
                />
              </div>
            )}
            {coverPreviewError && (
              <div className="flex items-center gap-1.5">
                <AlertCircle size={12} className="text-[var(--accent-danger)]" />
                <p className="text-xs text-[var(--accent-danger)]">Failed to load image preview. Check the URL.</p>
              </div>
            )}
            {form.cover_image_url && form.cover_image_status === "broken" && !coverPreviewError && (
              <div className="flex items-center gap-1.5">
                <AlertCircle size={12} className="text-[var(--accent-warning)]" />
                <p className="text-xs text-[var(--accent-warning)]">Cover link may be broken (last check failed).</p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Album Link</label>
            <Input
              value={form.album_link}
              onChange={(e) => setForm({ ...form, album_link: e.target.value })}
              placeholder="https://drive.google.com/drive/folders/..."
            />
            <p className="text-xs text-[var(--text-muted)]">Link users will be redirected to when clicking the album (e.g. Google Drive folder).</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Additional Image URLs</label>
            <p className="text-xs text-[var(--text-muted)]">Add up to 3 more image URLs to display in the album alongside the cover.</p>
            <div className="flex flex-col gap-2">
              <Input
                value={form.image_url_2}
                onChange={(e) => setForm({ ...form, image_url_2: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
              <Input
                value={form.image_url_3}
                onChange={(e) => setForm({ ...form, image_url_3: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
              <Input
                value={form.image_url_4}
                onChange={(e) => setForm({ ...form, image_url_4: e.target.value })}
                placeholder="https://drive.google.com/..."
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Visibility</label>
            <div className="flex flex-wrap gap-2">
              {VISIBILITY_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setForm({ ...form, visible_to: opt.key })}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                    form.visible_to === opt.key
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                      : "border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {form.visible_to === "section" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Section</label>
              <Input
                value={form.visible_to_section}
                onChange={(e) => setForm({ ...form, visible_to_section: e.target.value })}
                placeholder="e.g. BSIT-4A"
              />
            </div>
          )}

          {form.visible_to === "batch" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">Batch/Year Level</label>
              <Input
                value={form.visible_to_batch}
                onChange={(e) => setForm({ ...form, visible_to_batch: e.target.value })}
                placeholder="e.g. 4th Year"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => setForm({ ...form, is_shared: !form.is_shared })}
              className={`relative h-5 w-9 rounded-full transition-colors ${
                form.is_shared ? "bg-[var(--accent-gold)]" : "bg-[var(--border-light)]"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  form.is_shared ? "left-[18px]" : "left-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-[var(--text-secondary)]">Shared (visible in Shared tab)</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : album ? "Update Album" : "Create Album"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BulkAddItemsDialog({ open, onOpenChange, albumId, onSave }) {
  const [bulkText, setBulkText] = useState("")
  const [mediaType, setMediaType] = useState("photo")
  const [isSaving, setIsSaving] = useState(false)
  const [parsedItems, setParsedItems] = useState([])

  useEffect(() => {
    if (open) {
      setBulkText("")
      setParsedItems([])
      setMediaType("photo")
    }
  }, [open])

  const parseLinks = useCallback(() => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean)
    const items = lines.map((url, idx) => ({
      cloud_url: url,
      media_type: mediaType,
      order_index: idx,
      thumbnail_url: null,
      caption: null,
      tagged_student_ids: [],
    }))
    setParsedItems(items)
  }, [bulkText, mediaType])

  const handleSave = async () => {
    if (parsedItems.length === 0) {
      toast.error("No valid links found")
      return
    }
    setIsSaving(true)
    try {
      await onSave(parsedItems)
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Failed to add items")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Memory Items</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Media Type</label>
            <div className="flex gap-2">
              {["photo", "video"].map((type) => (
                <button
                  key={type}
                  onClick={() => setMediaType(type)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    mediaType === type
                      ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]"
                      : "border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {type === "photo" ? <Image size={14} /> : <Film size={14} />}
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Cloud Storage Links (one per line)</label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"https://drive.google.com/file/d/...\nhttps://drive.google.com/file/d/...\nhttps://dropbox.com/s/..."}
              rows={8}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 font-mono"
            />
          </div>

          <Button variant="outline" onClick={parseLinks} disabled={!bulkText.trim()} className="gap-2">
            <Search size={14} />
            Preview ({bulkText.split("\n").filter((l) => l.trim()).length} links)
          </Button>

          {parsedItems.length > 0 && (
            <div className="rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-3">
              <p className="text-xs font-medium text-[var(--text-primary)] mb-2">{parsedItems.length} items ready to add</p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsedItems.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    {item.media_type === "video" ? <Film size={12} /> : <Image size={12} />}
                    <span className="truncate">{item.cloud_url}</span>
                  </div>
                ))}
                {parsedItems.length > 10 && (
                  <p className="text-xs text-[var(--text-muted)]">...and {parsedItems.length - 10} more</p>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || parsedItems.length === 0} className="gap-2">
            <Upload size={14} />
            {isSaving ? "Adding..." : `Add ${parsedItems.length} Items`}
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const SOCIAL_PROVIDERS = [
  { key: "facebook", label: "Facebook", pattern: /facebook\.com|fb\.com|fb\.watch/i },
  { key: "instagram", label: "Instagram", pattern: /instagram\.com/i },
  { key: "twitter", label: "X / Twitter", pattern: /twitter\.com|x\.com/i },
  { key: "tiktok", label: "TikTok", pattern: /tiktok\.com/i },
  { key: "youtube", label: "YouTube", pattern: /youtube\.com|youtu\.be/i },
  { key: "pinterest", label: "Pinterest", pattern: /pinterest\.com/i },
  { key: "reddit", label: "Reddit", pattern: /reddit\.com|redd\.it/i },
]

const OEMBED_ENDPOINTS = {
  facebook: "https://www.facebook.com/plugins/oembed.json/?url=",
  instagram: "https://api.instagram.com/oembed/?url=",
  twitter: "https://publish.twitter.com/oembed?url=",
  tiktok: "https://www.tiktok.com/oembed?url=",
  youtube: "https://www.youtube.com/oembed?url=",
  pinterest: "https://www.pinterest.com/oembed.json?url=",
  reddit: "https://www.reddit.com/oembed?url=",
}

function extractSocialPostInfo(url) {
  if (!url) return null
  const provider = SOCIAL_PROVIDERS.find((p) => p.pattern.test(url))?.key || "unknown"
  return { url, provider }
}

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const resp = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return resp
  } catch (err) {
    clearTimeout(id)
    throw err
  }
}

async function tryOembed(url, provider) {
  const endpoint = OEMBED_ENDPOINTS[provider]
  if (!endpoint) return null
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`${endpoint}${encodeURIComponent(url)}`)}`
    const resp = await fetchWithTimeout(proxyUrl)
    if (!resp.ok) return null
    const data = await resp.json()
    return {
      title: data.title || "",
      author: data.author_name || data.author_url || "",
      thumbnail: data.thumbnail_url || null,
      html: data.html || null,
      provider,
    }
  } catch {
    return null
  }
}

async function tryOpenGraph(url) {
  try {
    const resp = await fetchWithTimeout(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    if (!resp.ok) return null
    const html = await resp.text()
    const extractMeta = (prop) => {
      const match = html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${prop}["']`, "i"))
      return match ? match[1] : null
    }
    const extractMetaName = (name) => {
      const match = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, "i"))
        || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, "i"))
      return match ? match[1] : null
    }
    return {
      title: extractMeta("og:title") || extractMetaName("title") || "",
      description: extractMeta("og:description") || extractMetaName("description") || "",
      image: extractMeta("og:image") || extractMetaName("image") || null,
      video: extractMeta("og:video") || null,
      author: extractMeta("og:site_name") || "",
      provider: "open",
    }
  } catch {
    return null
  }
}

function extractImagesFromHtml(html) {
  if (!html) return []
  const images = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1]
    if (src && !src.includes("avatar") && !src.includes("emoji") && !src.includes("icon") && src.length > 20) {
      images.push(src)
    }
  }
  return [...new Set(images)]
}

function extractVideoFromHtml(html) {
  if (!html) return null
  const videoRegex = /<video[^>]+src=["']([^"']+)["'][^>]*>/i
  const match = html.match(videoRegex)
  return match ? match[1] : null
}

async function fetchSocialPostMedia(url) {
  const info = extractSocialPostInfo(url)
  if (!info) throw new Error("Unsupported or invalid URL")

  const result = {
    provider: info.provider,
    url: info.url,
    title: "",
    description: "",
    author: "",
    images: [],
    videos: [],
    thumbnail: null,
  }

  const oembed = await tryOembed(url, info.provider)
  if (oembed) {
    result.title = oembed.title
    result.author = oembed.author
    result.thumbnail = oembed.thumbnail
    if (oembed.html) {
      const extractedImages = extractImagesFromHtml(oembed.html)
      result.images = extractedImages
      const video = extractVideoFromHtml(oembed.html)
      if (video) result.videos.push(video)
    }
  }

  if (!result.thumbnail || result.images.length === 0) {
    const og = await tryOpenGraph(url)
    if (og) {
      if (!result.title && og.title) result.title = og.title
      if (!result.author && og.author) result.author = og.author
      if (!result.description && og.description) result.description = og.description
      if (!result.thumbnail && og.image) result.thumbnail = og.image
      if (og.image && !result.images.includes(og.image)) {
        result.images.unshift(og.image)
      }
      if (og.video && !result.videos.includes(og.video)) {
        result.videos.push(og.video)
      }
    }
  }

  if (result.images.length === 0 && result.thumbnail) {
    result.images.push(result.thumbnail)
  }

  if (result.images.length === 0 && result.videos.length === 0) {
    throw new Error("No media found. The post may be private, unsupported, or requires a direct image URL.")
  }

  return result
}

function SocialLinkAlbumDialog({ open, onOpenChange, onSave }) {
  const [socialUrl, setSocialUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [postData, setPostData] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    if (open) {
      setSocialUrl("")
      setPostData(null)
      setSelectedImages([])
      setTitle("")
      setDescription("")
      setFetchError(null)
    }
  }, [open])

  const handleFetch = async () => {
    if (!socialUrl.trim()) return
    setIsLoading(true)
    setFetchError(null)
    setPostData(null)
    setSelectedImages([])
    try {
      const data = await fetchSocialPostMedia(socialUrl.trim())
      setPostData(data)
      setTitle(data.title || "")
      setDescription(data.description || "")
      setSelectedImages(data.images.slice(0, 1))
    } catch (err) {
      setFetchError(err.message || "Failed to fetch post")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleImage = (imgUrl) => {
    setSelectedImages((prev) =>
      prev.includes(imgUrl) ? prev.filter((u) => u !== imgUrl) : [...prev, imgUrl]
    )
  }

  const handleSave = async () => {
    if (selectedImages.length === 0) {
      toast.error("Select at least one image")
      return
    }
    setIsLoading(true)
    try {
      const albumData = {
        title: title || postData?.title || "Social Media Post",
        description: description || postData?.description || "",
        cover_image_url: selectedImages[0],
        album_link: postData?.url || socialUrl.trim(),
        category: postData?.videos?.length > 0 ? "video" : "photo",
        is_shared: false,
        visible_to: "all",
      }
      await onSave(albumData)
      onOpenChange(false)
    } catch (err) {
      toast.error(err.message || "Failed to create album")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Album from Social Media</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">Social Media Post URL</label>
            <div className="flex gap-2">
              <Input
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && socialUrl.trim()) handleFetch() }}
                placeholder="https://facebook.com/... or https://instagram.com/p/..."
                className="flex-1"
              />
              <Button onClick={handleFetch} disabled={isLoading || !socialUrl.trim()} className="shrink-0 gap-2">
                {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                Extract
              </Button>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Paste a link to a Facebook, Instagram, X, TikTok, Pinterest, Reddit, or YouTube post. We'll extract all images and metadata.
            </p>
          </div>

          {fetchError && (
            <div className="rounded-lg border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/10 p-3">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-[var(--accent-danger)] shrink-0" />
                <p className="text-xs text-[var(--accent-danger)]">{fetchError}</p>
              </div>
            </div>
          )}

          {postData && (
            <div className="flex flex-col gap-4 rounded-lg border border-[var(--border-light)] bg-[var(--bg-subtle)] p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" className="text-[10px] capitalize">{postData.provider}</Badge>
                {postData.author && (
                  <span className="text-xs text-[var(--text-secondary)]">by {postData.author}</span>
                )}
              </div>

              {postData.images.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-[var(--text-primary)]">
                      Extracted Images ({selectedImages.length}/{postData.images.length} selected)
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedImages(postData.images)}
                        className="text-xs text-[var(--accent-gold)] hover:underline"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setSelectedImages([])}
                        className="text-xs text-[var(--text-muted)] hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {postData.images.map((img, idx) => {
                      const isSelected = selectedImages.includes(img)
                      return (
                        <button
                          key={idx}
                          onClick={() => toggleImage(img)}
                          className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                            isSelected
                              ? "border-[var(--accent-gold)] ring-2 ring-[var(--accent-gold)]/20"
                              : "border-transparent hover:border-[var(--border-light)]"
                          }`}
                        >
                          <img src={img} alt={`Media ${idx + 1}`} className="h-full w-full object-cover" />
                          {isSelected && (
                            <div className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-gold)] text-white">
                              <Check size={12} />
                            </div>
                          )}
                          {idx === 0 && (
                            <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1 py-0.5 text-[9px] text-white">
                              Cover
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {postData.videos.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[var(--text-primary)]">Extracted Videos</label>
                  {postData.videos.map((vid, idx) => (
                    <div key={idx} className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-2">
                      <Film size={14} className="text-[var(--text-muted)] shrink-0" />
                      <span className="truncate text-xs text-[var(--text-secondary)]">{vid}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-primary)]">Album Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Graduation Day Highlights"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-[var(--text-primary)]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Post description or album notes..."
                  rows={2}
                  className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-[var(--border-light)] bg-[var(--bg-surface)] p-2">
                <Link2 size={12} className="text-[var(--text-muted)] shrink-0" />
                <span className="truncate text-xs text-[var(--text-muted)]">
                  Album link: {postData.url}
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !postData || selectedImages.length === 0}
            className="gap-2"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Album {selectedImages.length > 0 && `(${selectedImages.length} images)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AlbumDetailPanel({ album, onClose, onUpdate }) {
  const [items, setItems] = useState(album.items || [])
  const [isAddingItems, setIsAddingItems] = useState(false)
  const [expanded, setExpanded] = useState(true)

  const handleBulkAdd = async (newItems) => {
    const result = await createMemoryItemsBulk(album.id, newItems)
    toast.success(`Added ${result.count} items`)
    const updated = await getAdminAlbums({ page: 1, perPage: 100 })
    const updatedAlbum = updated.albums.find((a) => a.id === album.id)
    if (updatedAlbum) {
      onUpdate(updatedAlbum)
      setItems(updatedAlbum.items || [])
    }
    setIsAddingItems(false)
  }

  const handleDeleteItem = async (itemId) => {
    if (!confirm("Delete this item?")) return
    await deleteMemoryItem(itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    toast.success("Item deleted")
  }

  const handleSetCover = async (item) => {
    const coverUrl = item.thumbnail_url || item.cloud_url
    if (!coverUrl) return
    await updateAlbum(album.id, { cover_image_url: coverUrl })
    const updated = await getAdminAlbums({ page: 1, perPage: 100 })
    const updatedAlbum = updated.albums.find((a) => a.id === album.id)
    if (updatedAlbum) {
      onUpdate(updatedAlbum)
      setItems(updatedAlbum.items || [])
    }
    toast.success("Cover updated")
  }

  const handleReorder = async (dragIndex, dropIndex) => {
    const newItems = [...items]
    const [dragged] = newItems.splice(dragIndex, 1)
    newItems.splice(dropIndex, 0, dragged)
    setItems(newItems)
    await reorderItems(album.id, newItems.map((i) => i.id))
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--border-light)] p-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setExpanded(!expanded)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{album.title}</h3>
            <p className="text-xs text-[var(--text-muted)]">{items.length} items</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsAddingItems(true)} className="gap-1">
            <Plus size={12} />
            Add Items
          </Button>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-muted)]">
            <X size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Image size={32} className="text-[var(--text-muted)]/30" />
              <p className="text-sm text-[var(--text-muted)]">No items yet</p>
              <Button variant="outline" size="sm" onClick={() => setIsAddingItems(true)} className="gap-1">
                <Plus size={12} />
                Add Items
              </Button>
            </div>
          ) : (
             <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
               {items.map((item, idx) => (
                 <div key={item.id} className="group relative flex flex-col rounded-lg border border-[var(--border-light)] overflow-hidden">
                   <div className="relative aspect-square overflow-hidden bg-[var(--bg-subtle)]">
                     <img
                       src={getDisplayThumbnailUrl(item.thumbnail_url || item.cloud_url, 300)}
                       alt={item.caption || `Item ${idx + 1}`}
                       className="h-full w-full object-cover"
                     />
                     {item.media_type === "video" && (
                       <div className="absolute inset-0 flex items-center justify-center">
                         <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
                           <Film size={14} className="text-white" />
                         </div>
                       </div>
                     )}
                     <div className="absolute top-1 left-1 flex items-center gap-1">
                       <GripVertical size={12} className="text-white drop-shadow" />
                       <span className="rounded bg-black/60 px-1 py-0.5 text-[10px] text-white">{idx + 1}</span>
                     </div>
                     <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button
                         onClick={() => handleSetCover(item)}
                         className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500/90 text-white hover:bg-yellow-500"
                         title="Set as cover"
                       >
                         <Star size={10} className="fill-white" />
                       </button>
                       <button
                         onClick={() => handleDeleteItem(item.id)}
                         className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/80 text-white"
                         title="Delete"
                       >
                         <Trash2 size={10} />
                       </button>
                     </div>
                   </div>
                   {item.caption && (
                     <p className="truncate px-1.5 py-1 text-[10px] text-[var(--text-muted)]">{item.caption}</p>
                   )}
                 </div>
               ))}
             </div>
          )}
        </div>
      )}

      <BulkAddItemsDialog
        open={isAddingItems}
        onOpenChange={setIsAddingItems}
        albumId={album.id}
        onSave={handleBulkAdd}
      />
    </div>
  )
}

export default function AdminMemoriesPage() {
  const [albums, setAlbums] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [page, setPage] = useState(1)
  const perPage = 20

  const [showAlbumDialog, setShowAlbumDialog] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState(null)
  const [expandedAlbum, setExpandedAlbum] = useState(null)

  const [coverStatuses, setCoverStatuses] = useState({})
  const [isCheckingCovers, setIsCheckingCovers] = useState(false)
  const [showSocialDialog, setShowSocialDialog] = useState(false)

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getAdminAlbums({ page, perPage, search, category })
      setAlbums(result.albums || [])
      setTotal(result.total || 0)
    } catch (err) {
      setError(err.message || "Failed to load albums")
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, search, category])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  const handleCreateAlbum = () => {
    setEditingAlbum(null)
    setShowAlbumDialog(true)
  }

  const handleEditAlbum = (album) => {
    setEditingAlbum(album)
    setShowAlbumDialog(true)
  }

  const handleSaveAlbum = async (formData) => {
    if (editingAlbum) {
      const updated = await updateAlbum(editingAlbum.id, formData)
      toast.success("Album updated")
      setAlbums((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)))
    } else {
      const created = await createAlbum(formData)
      toast.success("Album created")
      fetchAlbums()
    }
  }

  const handleCreateFromSocial = async (formData) => {
    const created = await createAlbum(formData)
    toast.success("Album created from social media post")
    fetchAlbums()
  }

  const handleDeleteAlbum = async (albumId) => {
    if (!confirm("Delete this album and all its items?")) return
    await deleteAlbum(albumId)
    toast.success("Album deleted")
    setAlbums((prev) => prev.filter((a) => a.id !== albumId))
    if (expandedAlbum?.id === albumId) setExpandedAlbum(null)
  }

  const handleToggleShared = async (album) => {
    await updateAlbum(album.id, { is_shared: !album.is_shared })
    setAlbums((prev) => prev.map((a) => (a.id === album.id ? { ...a, is_shared: !a.is_shared } : a)))
    toast.success(album.is_shared ? "Album unshared" : "Album shared")
  }

  const handleRecheckCovers = async () => {
    if (isCheckingCovers) return
    setIsCheckingCovers(true)
    const newStatuses = {}
    const checks = albums.map(async (album) => {
      const url = resolveCoverUrl(album)
      if (!url) {
        newStatuses[album.id] = "broken"
        return
      }
      const status = await checkImageUrl(url)
      newStatuses[album.id] = status
    })
    await Promise.all(checks)
    setCoverStatuses((prev) => ({ ...prev, ...newStatuses }))
    setIsCheckingCovers(false)
    const broken = Object.values(newStatuses).filter((s) => s === "broken").length
    if (broken > 0) {
      toast.warning(`${broken} album(s) have broken covers`)
    } else {
      toast.success("All covers are valid")
    }
  }

  const totalPages = Math.ceil(total / perPage)

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Memory Albums
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Manage photo and video albums for the yearbook.
          </p>
        </div>

         <div className="flex items-center gap-2">
           <Button onClick={handleRecheckCovers} variant="outline" size="sm" disabled={isCheckingCovers || isLoading} className="gap-2">
             <RefreshCw size={14} className={isCheckingCovers ? "animate-spin" : ""} />
             {isCheckingCovers ? "Checking..." : "Re-check covers"}
           </Button>
           <Button onClick={() => setShowSocialDialog(true)} variant="outline" size="sm" className="gap-2">
             <Link2 size={14} />
             From Social Link
           </Button>
           <Button onClick={handleCreateAlbum} className="gap-2">
             <Plus size={16} />
             New Album
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            placeholder="Search albums..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {[{ key: "all", label: "All" }, ...CATEGORIES].map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setPage(1) }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                category === cat.key
                  ? "bg-[var(--accent-gold)]/15 text-[var(--accent-gold)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-6 text-center">
          <AlertTriangle size={32} className="mx-auto mb-3 text-red-500" />
          <p className="text-sm font-medium text-[var(--text-primary)] mb-2">Failed to load albums</p>
          <p className="text-xs text-[var(--text-muted)] mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchAlbums} className="gap-2">
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      ) : albums.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border-light)] bg-[var(--bg-surface)] py-16">
          <Image size={48} className="text-[var(--text-muted)]/30" />
          <p className="text-sm font-medium text-[var(--text-muted)]">No albums found</p>
          <Button onClick={handleCreateAlbum} className="gap-2">
            <Plus size={14} />
            Create your first album
          </Button>
        </div>
      ) : (
          <div className="flex flex-col gap-3">
            {albums.map((album) => {
              const coverUrl = resolveCoverUrl(album)
              const coverThumb = coverUrl ? getDisplayThumbnailUrl(coverUrl, 200) : null
              const coverStatus = coverStatuses[album.id] || album.cover_image_status || "unchecked"
              const hasAlbumLink = !!album.album_link
              const albumWrapperClass = hasAlbumLink
                ? "cursor-pointer hover:border-[var(--accent-gold)]/50 hover:shadow-sm transition-all"
                : ""
              const AlbumWrapper = hasAlbumLink ? "a" : "div"
              const wrapperProps = hasAlbumLink
                ? { href: album.album_link, target: "_blank", rel: "noopener noreferrer" }
                : {}
              return (
              <AlbumWrapper key={album.id} className={`rounded-xl border border-[var(--border-light)] bg-[var(--bg-surface)] overflow-hidden block ${albumWrapperClass}`} {...wrapperProps}>
                <div className="flex items-center gap-4 p-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--bg-subtle)]">
                    {coverThumb ? (
                      <img src={coverThumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Image size={20} className="text-[var(--text-muted)]/30" />
                      </div>
                    )}
                    {coverStatus === "broken" && (
                      <div className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent-danger)] text-white" title="Cover link is broken">
                        <AlertTriangle size={10} />
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{album.title}</h3>
                      <Badge variant="default" className="shrink-0 text-[10px] capitalize">
                        {album.category}
                      </Badge>
                      {album.is_shared && (
                        <Badge variant="admin" className="shrink-0 text-[10px]">Shared</Badge>
                      )}
                      {hasAlbumLink && (
                        <span className="flex items-center gap-1 rounded bg-[var(--accent-gold)]/10 px-1.5 py-0.5 text-[10px] text-[var(--accent-gold)]">
                          <ExternalLink size={10} />
                          Link
                        </span>
                      )}
                    </div>
                   <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                     <span className="flex items-center gap-1">
                       <Image size={10} />
                       {album.item_count || 0} items
                     </span>
                     {album.event_date && (
                       <span className="flex items-center gap-1">
                         <Calendar size={10} />
                         {new Date(album.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                       </span>
                     )}
                     <span className="flex items-center gap-1">
                       <Eye size={10} />
                       {album.visible_to}
                     </span>
                   </div>
                 </div>

                 <div className="flex shrink-0 items-center gap-1">
                   <button
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleShared(album) }}
                     className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                       album.is_shared
                         ? "text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10"
                         : "text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                     }`}
                     title={album.is_shared ? "Unshare" : "Share"}
                   >
                     <Share2 size={14} />
                   </button>
                   <button
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditAlbum(album) }}
                     className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                     title="Edit"
                   >
                     <Edit3 size={14} />
                   </button>
                   <button
                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteAlbum(album.id) }}
                     className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500"
                     title="Delete"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
               </div>

                {expandedAlbum?.id === album.id && (
                  <AlbumDetailPanel
                    album={expandedAlbum}
                    onClose={() => setExpandedAlbum(null)}
                    onUpdate={(updated) => setExpandedAlbum(updated)}
                  />
                )}
              </AlbumWrapper>
            )
            })}
          </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      <AlbumFormDialog
        open={showAlbumDialog}
        onOpenChange={setShowAlbumDialog}
        album={editingAlbum}
         onSave={handleSaveAlbum}
       />

       <SocialLinkAlbumDialog
         open={showSocialDialog}
         onOpenChange={setShowSocialDialog}
         onSave={handleCreateFromSocial}
       />
     </main>
   )
}
