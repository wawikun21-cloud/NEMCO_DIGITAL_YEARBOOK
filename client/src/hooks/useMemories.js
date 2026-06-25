import { useState, useEffect, useCallback } from "react"
import {
  getStudentAlbums,
  getStudentAlbumDetail,
  getStudentFavorites,
  toggleFavorite as toggleFavoriteApi,
  toggleAlbumFavorite as toggleAlbumFavoriteApi,
} from "@/services/memoriesService"

export function useAlbumGrid() {
  const [albums, setAlbums] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
    sortBy: "newest",
    page: 1,
    perPage: 12,
  })

  const fetchAlbums = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params = { ...filters }
      if (params.category === "favorites") {
        params.favorites = true
      }
      const result = await getStudentAlbums(params)
      setAlbums(result.albums || [])
      setTotal(result.total || 0)
    } catch (err) {
      setError(err.message || "Failed to load albums")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchAlbums()
  }, [fetchAlbums])

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const goToPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  return {
    albums,
    total,
    isLoading,
    error,
    filters,
    updateFilters,
    goToPage,
    refetch: fetchAlbums,
  }
}

export function useAlbumDetail() {
  const [album, setAlbum] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchAlbum = useCallback(async (albumId) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getStudentAlbumDetail(albumId)
      setAlbum(result.album)
    } catch (err) {
      setError(err.message || "Failed to load album")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const toggleItemFavorite = useCallback(async (itemId) => {
    const result = await toggleFavoriteApi(itemId)
    if (album) {
      setAlbum((prev) => ({
        ...prev,
        items: prev.items.map((item) =>
          item.id === itemId ? { ...item, is_favorite: result.is_favorite } : item
        ),
      }))
    }
    return result.is_favorite
  }, [album])

  const toggleAlbumFavorite = useCallback(async (albumId) => {
    const result = await toggleAlbumFavoriteApi(albumId)
    if (album) {
      setAlbum((prev) => ({ ...prev, is_favorite: result.is_favorite }))
    }
    return result.is_favorite
  }, [album])

  return {
    album,
    isLoading,
    error,
    fetchAlbum,
    toggleItemFavorite,
    toggleAlbumFavorite,
  }
}

export function useFavorites() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    sortBy: "newest",
    page: 1,
    perPage: 12,
  })

  const fetchFavorites = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getStudentFavorites(filters)
      setItems(result.items || [])
      setTotal(result.total || 0)
    } catch (err) {
      setError(err.message || "Failed to load favorites")
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchFavorites()
  }, [fetchFavorites])

  const toggleFavorite = useCallback(async (itemId) => {
    const result = await toggleFavoriteApi(itemId)
    if (result.is_favorite) {
      fetchFavorites()
    } else {
      setItems((prev) => prev.filter((item) => item.id !== itemId))
      setTotal((prev) => Math.max(0, prev - 1))
    }
    return result.is_favorite
  }, [fetchFavorites])

  const updateFilters = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }, [])

  const goToPage = useCallback((page) => {
    setFilters((prev) => ({ ...prev, page }))
  }, [])

  return {
    items,
    total,
    isLoading,
    error,
    filters,
    updateFilters,
    goToPage,
    toggleFavorite,
  }
}
