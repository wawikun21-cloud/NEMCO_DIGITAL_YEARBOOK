const PROVIDER_PATTERNS = {
  googleDrive: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  googleDriveUc: /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/,
  googleDriveOpen: /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  dropbox: /dropbox\.com\/s\/([a-zA-Z0-9]+)/,
}

export function extractGoogleDriveFileId(url) {
  if (!url) return null
  const match = url.match(PROVIDER_PATTERNS.googleDrive) || url.match(PROVIDER_PATTERNS.googleDriveUc) || url.match(PROVIDER_PATTERNS.googleDriveOpen)
  return match ? match[1] : null
}

export function normalizeCoverImageUrl(url) {
  if (!url) return url
  const fileId = extractGoogleDriveFileId(url)
  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}=s800`
  }
  return url
}

export function getDisplayThumbnailUrl(url, size = 400) {
  if (!url) return url

  const gdMatch = url.match(PROVIDER_PATTERNS.googleDrive) || url.match(PROVIDER_PATTERNS.googleDriveUc) || url.match(PROVIDER_PATTERNS.googleDriveOpen)
  if (gdMatch) {
    return `https://lh3.googleusercontent.com/d/${gdMatch[1]}=s${size}`
  }

  if (url.includes("drive.google.com/thumbnail?id=")) {
    return url
  }

  const dbxMatch = url.match(PROVIDER_PATTERNS.dropbox)
  if (dbxMatch) {
    return url.replace("dropbox.com", "dropbox.com/s").replace(/\?.*$/, "?raw=1")
  }

  return url
}

export function resolveCoverUrl(album) {
  if (!album) return null

  if (album.cover_image_url) return album.cover_image_url

  const items = album.items || []
  if (items.length > 0) {
    const first = items[0]
    if (first.thumbnail_url) return first.thumbnail_url
    if (first.cloud_url) return first.cloud_url
  }

  return null
}

export async function checkImageUrl(url) {
  return new Promise((resolve) => {
    if (!url) { resolve("broken"); return }
    const img = new Image()
    img.onload = () => resolve("ok")
    img.onerror = () => resolve("broken")
    img.src = url
  })
}
