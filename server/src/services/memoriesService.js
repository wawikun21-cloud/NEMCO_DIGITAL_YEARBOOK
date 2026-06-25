import { supabaseAdmin } from "../config/supabase.js"

const ALBUM_COLUMNS = "id,title,event_date,event_time,location,description,category,cover_image_url,album_link,image_url_2,image_url_3,image_url_4,item_count,created_by,created_at,updated_at,is_shared,visible_to,visible_to_section,visible_to_batch,visible_to_student_ids"
const ITEM_COLUMNS = "id,album_id,cloud_url,thumbnail_url,media_type,caption,tagged_student_ids,order_index,created_at,updated_at"

export async function getAlbumsForStudent(studentId, { category, search, sharedOnly, favorites, sortBy = "newest", page = 1, perPage = 12 } = {}) {
  const { data: studentProfile } = await supabaseAdmin
    .from("profiles")
    .select("section, year_level")
    .eq("id", studentId)
    .maybeSingle()

  let query = supabaseAdmin
    .from("memory_albums")
    .select(ALBUM_COLUMNS)
    .or(`is_shared.eq.true,visible_to.eq.all,visible_to.eq.section,visible_to.eq.batch,visible_to.eq.specific`)
    .range((page - 1) * perPage, page * perPage - 1)

  if (category && category !== "all" && category !== "favorites") {
    query = query.eq("category", category)
  }

  if (search) {
    query = query.ilike("title", `%${search}%`)
  }

  if (sharedOnly) {
    query = query.eq("is_shared", true)
  }

  if (sortBy === "newest") query = query.order("event_date", { ascending: false }).order("created_at", { ascending: false })
  else if (sortBy === "oldest") query = query.order("event_date", { ascending: true }).order("created_at", { ascending: true })
  else if (sortBy === "az") query = query.order("title", { ascending: true })
  else if (sortBy === "most_items") query = query.order("item_count", { ascending: false })

  const { data: albums, error } = await query

  if (error) throw new Error("Failed to fetch albums")

  const filtered = (albums || []).filter((album) => {
    if (album.visible_to === "all" || album.is_shared) return true
    if (album.visible_to === "section" && studentProfile?.section && album.visible_to_section === studentProfile.section) return true
    if (album.visible_to === "batch" && studentProfile?.year_level && album.visible_to_batch === studentProfile.year_level) return true
    if (album.visible_to === "specific" && album.visible_to_student_ids?.includes(studentId)) return true
    return false
  })

  const albumIds = filtered.map((a) => a.id)
  const favoriteAlbumIds = new Set()
  if (albumIds.length > 0) {
    const { data: favAlbums } = await supabaseAdmin
      .from("student_favorites")
      .select("memory_album_id")
      .eq("student_id", studentId)
      .in("memory_album_id", albumIds)
    for (const fav of favAlbums || []) {
      favoriteAlbumIds.add(fav.memory_album_id)
    }
  }

  const finalAlbums = favorites
    ? filtered.filter((album) => favoriteAlbumIds.has(album.id))
    : filtered

  const enriched = finalAlbums.map((album) => ({
    ...album,
    is_favorite: favoriteAlbumIds.has(album.id),
  }))

  const { count } = await supabaseAdmin
    .from("memory_albums")
    .select("id", { count: "exact", head: true })

  return { albums: enriched, total: count || 0 }
}

export async function getAlbumById(albumId, studentId) {
  const { data: album, error } = await supabaseAdmin
    .from("memory_albums")
    .select(ALBUM_COLUMNS)
    .eq("id", albumId)
    .maybeSingle()

  if (error) throw new Error("Failed to fetch album")
  if (!album) {
    const err = new Error("Album not found")
    err.status = 404
    throw err
  }

  const { data: items } = await supabaseAdmin
    .from("memory_items")
    .select(ITEM_COLUMNS)
    .eq("album_id", albumId)
    .order("order_index", { ascending: true })

  let favoriteItemIds = []
  let isAlbumFavorite = false
  if (studentId) {
    const { data: favs } = await supabaseAdmin
      .from("student_favorites")
      .select("memory_item_id,memory_album_id")
      .eq("student_id", studentId)
    favoriteItemIds = (favs || []).filter((f) => f.memory_item_id).map((f) => f.memory_item_id)
    isAlbumFavorite = (favs || []).some((f) => f.memory_album_id === albumId)
  }

  const { data: creatorProfile } = album.created_by
    ? await supabaseAdmin.from("profiles").select("full_name,display_name,avatar_url").eq("id", album.created_by).maybeSingle()
    : { data: null }

  return {
     ...album,
     is_favorite: isAlbumFavorite,
     items: (items || []).map((item) => ({
       ...item,
       is_favorite: favoriteItemIds.includes(item.id),
     })),
     creator: creatorProfile ? {
       name: creatorProfile.display_name || creatorProfile.full_name || "Unknown",
       avatar_url: creatorProfile.avatar_url,
     } : null,
   }
}

export async function getFavoriteItemsForStudent(studentId, { sortBy = "newest", page = 1, perPage = 12 } = {}) {
  let query = supabaseAdmin
    .from("student_favorites")
    .select("memory_item_id,created_at,memory_items(id,album_id,cloud_url,thumbnail_url,media_type,caption,tagged_student_ids,order_index,memory_albums(id,title,event_date,cover_image_url))")
    .eq("student_id", studentId)
    .range((page - 1) * perPage, page * perPage - 1)

  if (sortBy === "newest") query = query.order("created_at", { ascending: false })
  else if (sortBy === "oldest") query = query.order("created_at", { ascending: true })

  const { data, error } = await query
  if (error) throw new Error("Failed to fetch favorites")

  const items = (data || []).map((row) => ({
    ...row.memory_items,
    is_favorite: true,
    favorite_created_at: row.created_at,
    album: row.memory_albums,
  }))

  const { count } = await supabaseAdmin
    .from("student_favorites")
    .select("memory_item_id", { count: "exact", head: true })
    .eq("student_id", studentId)

  return { items, total: count || 0 }
}

export async function toggleFavorite(studentId, memoryItemId) {
  const { data: existing } = await supabaseAdmin
    .from("student_favorites")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("memory_item_id", memoryItemId)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from("student_favorites")
      .delete()
      .eq("student_id", studentId)
      .eq("memory_item_id", memoryItemId)
    return false
  } else {
    await supabaseAdmin
      .from("student_favorites")
      .insert({ student_id: studentId, memory_item_id: memoryItemId })
    return true
  }
}

export async function toggleAlbumFavorite(studentId, albumId) {
  const { data: existing } = await supabaseAdmin
    .from("student_favorites")
    .select("student_id")
    .eq("student_id", studentId)
    .eq("memory_album_id", albumId)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from("student_favorites")
      .delete()
      .eq("student_id", studentId)
      .eq("memory_album_id", albumId)
    return false
  } else {
    await supabaseAdmin
      .from("student_favorites")
      .insert({ student_id: studentId, memory_album_id: albumId })
    return true
  }
}

export async function createAlbum(data) {
  const { data: album, error } = await supabaseAdmin
    .from("memory_albums")
    .insert({
      title: data.title,
      event_date: data.event_date || null,
      event_time: data.event_time || null,
      location: data.location || null,
      description: data.description || null,
      category: data.category || "photo",
      cover_image_url: data.cover_image_url || null,
      album_link: data.album_link || null,
      image_url_2: data.image_url_2 || null,
      image_url_3: data.image_url_3 || null,
      image_url_4: data.image_url_4 || null,
      created_by: data.created_by,
      is_shared: data.is_shared || false,
      visible_to: data.visible_to || "all",
      visible_to_section: data.visible_to_section || null,
      visible_to_batch: data.visible_to_batch || null,
      visible_to_student_ids: data.visible_to_student_ids || [],
    })
    .select(ALBUM_COLUMNS)
    .maybeSingle()

  if (error) throw new Error("Failed to create album")
  return album
}

export async function updateAlbum(albumId, data) {
  const { data: album, error } = await supabaseAdmin
    .from("memory_albums")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", albumId)
    .select(ALBUM_COLUMNS)
    .maybeSingle()

  if (error) throw new Error("Failed to update album")
  if (!album) {
    const err = new Error("Album not found")
    err.status = 404
    throw err
  }
  return album
}

export async function deleteAlbum(albumId) {
  const { error } = await supabaseAdmin
    .from("memory_albums")
    .delete()
    .eq("id", albumId)

  if (error) throw new Error("Failed to delete album")
}

export async function createMemoryItem(data) {
  const { data: item, error } = await supabaseAdmin
    .from("memory_items")
    .insert({
      album_id: data.album_id,
      cloud_url: data.cloud_url,
      thumbnail_url: data.thumbnail_url || null,
      media_type: data.media_type,
      caption: data.caption || null,
      tagged_student_ids: data.tagged_student_ids || [],
      order_index: data.order_index || 0,
    })
    .select(ITEM_COLUMNS)
    .maybeSingle()

  if (error) throw new Error("Failed to create memory item")

  await updateAlbumItemCount(data.album_id)

  return item
}

export async function createMemoryItemsBulk(items) {
  const { data, error } = await supabaseAdmin
    .from("memory_items")
    .insert(items)
    .select(ITEM_COLUMNS)

  if (error) throw new Error("Failed to create memory items")

  const albumIds = [...new Set(items.map((i) => i.album_id))]
  for (const albumId of albumIds) {
    await updateAlbumItemCount(albumId)
  }

  return data
}

export async function updateMemoryItem(itemId, data) {
  const { data: item, error } = await supabaseAdmin
    .from("memory_items")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .select(ITEM_COLUMNS)
    .maybeSingle()

  if (error) throw new Error("Failed to update memory item")
  if (!item) {
    const err = new Error("Memory item not found")
    err.status = 404
    throw err
  }
  return item
}

export async function deleteMemoryItem(itemId) {
  const { data: item } = await supabaseAdmin
    .from("memory_items")
    .select("album_id")
    .eq("id", itemId)
    .maybeSingle()

  const { error } = await supabaseAdmin
    .from("memory_items")
    .delete()
    .eq("id", itemId)

  if (error) throw new Error("Failed to delete memory item")

  if (item) {
    await updateAlbumItemCount(item.album_id)
  }
}

export async function reorderItems(albumId, itemIds) {
  const updates = itemIds.map((id, index) =>
    supabaseAdmin
      .from("memory_items")
      .update({ order_index: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("album_id", albumId)
  )

  await Promise.all(updates)
}

async function updateAlbumItemCount(albumId) {
  const { count } = await supabaseAdmin
    .from("memory_items")
    .select("id", { count: "exact", head: true })
    .eq("album_id", albumId)

  await supabaseAdmin
    .from("memory_albums")
    .update({ item_count: count || 0, updated_at: new Date().toISOString() })
    .eq("id", albumId)
}

export async function getAdminAlbums({ page = 1, perPage = 20, search, category } = {}) {
  let query = supabaseAdmin
    .from("memory_albums")
    .select(`${ALBUM_COLUMNS},profiles:created_by(full_name,display_name)`)
    .range((page - 1) * perPage, page * perPage - 1)
    .order("created_at", { ascending: false })

  if (search) query = query.ilike("title", `%${search}%`)
  if (category && category !== "all") query = query.eq("category", category)

  const { data, error } = await query
  if (error) throw new Error("Failed to fetch albums")

  const { count } = await supabaseAdmin
    .from("memory_albums")
    .select("id", { count: "exact", head: true })

  return { albums: data || [], total: count || 0 }
}

export async function getTaggedStudents(studentIds) {
  if (!studentIds || studentIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id,full_name,display_name,avatar_url,student_number")
    .in("id", studentIds)

  if (error) throw new Error("Failed to fetch tagged students")
  return data || []
}
