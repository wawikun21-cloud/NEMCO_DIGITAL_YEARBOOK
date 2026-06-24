const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
const normalizedApiBaseUrl = API_BASE_URL.replace(/\/+$/, "")

function memoriesUrl(path) {
  return `${normalizedApiBaseUrl}/memories${path.startsWith("/") ? path : `/${path}`}`
}

function getAuthHeaders(extra = {}) {
  const token = sessionStorage.getItem("digitalYearbookAccessToken")
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

async function parseResponse(response) {
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server error (${response.status}). Please try again later.`)
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed")
  }

  return data
}

export async function getStudentAlbums(params = {}) {
  const query = new URLSearchParams()
  if (params.category && params.category !== "all") query.set("category", params.category)
  if (params.search) query.set("search", params.search)
  if (params.shared) query.set("shared", "true")
  if (params.sortBy) query.set("sortBy", params.sortBy)
  if (params.page) query.set("page", params.page)
  if (params.perPage) query.set("perPage", params.perPage)

  const response = await fetch(memoriesUrl(`/student/albums?${query}`), {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function getStudentAlbumDetail(albumId) {
  const response = await fetch(memoriesUrl(`/student/albums/${albumId}`), {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function getStudentFavorites(params = {}) {
  const query = new URLSearchParams()
  if (params.sortBy) query.set("sortBy", params.sortBy)
  if (params.page) query.set("page", params.page)
  if (params.perPage) query.set("perPage", params.perPage)

  const response = await fetch(memoriesUrl(`/student/favorites?${query}`), {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function toggleFavorite(itemId) {
  const response = await fetch(memoriesUrl(`/student/favorites/${itemId}`), {
    method: "POST",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function getAdminAlbums(params = {}) {
  const query = new URLSearchParams()
  if (params.page) query.set("page", params.page)
  if (params.perPage) query.set("perPage", params.perPage)
  if (params.search) query.set("search", params.search)
  if (params.category && params.category !== "all") query.set("category", params.category)

  const response = await fetch(memoriesUrl(`/admin/memories/albums?${query}`), {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function createAlbum(data) {
  const response = await fetch(memoriesUrl("/admin/memories/albums"), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  })
  return parseResponse(response)
}

export async function updateAlbum(albumId, data) {
  const response = await fetch(memoriesUrl(`/admin/memories/albums/${albumId}`), {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  })
  return parseResponse(response)
}

export async function deleteAlbum(albumId) {
  const response = await fetch(memoriesUrl(`/admin/memories/albums/${albumId}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function createMemoryItem(data) {
  const response = await fetch(memoriesUrl("/admin/memories/items"), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  })
  return parseResponse(response)
}

export async function createMemoryItemsBulk(albumId, items) {
  const response = await fetch(memoriesUrl("/admin/memories/items/bulk"), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ album_id: albumId, items }),
  })
  return parseResponse(response)
}

export async function updateMemoryItem(itemId, data) {
  const response = await fetch(memoriesUrl(`/admin/memories/items/${itemId}`), {
    method: "PATCH",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  })
  return parseResponse(response)
}

export async function deleteMemoryItem(itemId) {
  const response = await fetch(memoriesUrl(`/admin/memories/items/${itemId}`), {
    method: "DELETE",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}

export async function reorderItems(albumId, itemIds) {
  const response = await fetch(memoriesUrl(`/admin/memories/albums/${albumId}/reorder`), {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ itemIds }),
  })
  return parseResponse(response)
}

export async function getTaggedStudents(ids) {
  const response = await fetch(memoriesUrl(`/memories/tagged-students?ids=${ids.join(",")}`), {
    method: "GET",
    headers: getAuthHeaders(),
  })
  return parseResponse(response)
}
