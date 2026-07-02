import { spawn } from "child_process"
import path from "path"
import fs from "fs/promises"
import { supabaseAdmin } from "../config/supabase.js"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import r2 from "../config/r2Client.js"
import { config } from "../config/env.js"
import sharp from "sharp"

const IMAGE_BUCKET = config.r2.bucket
const RENDER_DPI = 400
const RENDER_DPI_LOW = 200
const OUTPUT_FORMAT = "webp"

function log(message, ...args) {
  console.log(`[pdfRenderService] ${message}`, ...args)
}

function logError(message, ...args) {
  console.error(`[pdfRenderService] ${message}`, ...args)
}

async function downloadPdfBuffer(fileUrl) {
  const response = await globalThis.fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer)
}

async function downloadPdfFromFile(key) {
  const command = new GetObjectCommand({
    Bucket: IMAGE_BUCKET,
    Key: key,
  })
  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 300 })
  const response = await globalThis.fetch(signedUrl)
  if (!response.ok) {
    throw new Error(`Failed to download PDF from storage: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  return Buffer.from(buffer)
}

async function uploadImageToStorage(imageBuffer, pdfId, pageNum, format = OUTPUT_FORMAT) {
  const ext = format === "webp" ? "webp" : "png"
  const key = `yearbook-images/${pdfId}/page-${pageNum}.${ext}`
  
  const command = new PutObjectCommand({
    Bucket: IMAGE_BUCKET,
    Key: key,
    Body: imageBuffer,
    ContentType: `image/${ext}`,
  })
  
  await r2.send(command)
  
  const publicUrl = config.r2.publicBaseUrl
    ? `${config.r2.publicBaseUrl.replace(/\/$/, "")}/${key}`
    : `/api/admin/upload/file/${encodeURIComponent(key)}`
  
  return { key, url: publicUrl }
}

async function checkRendererAvailable(renderer) {
  return new Promise((resolve) => {
    const child = spawn(renderer, ["-v"], { windowsHide: true, stdio: ["ignore", "ignore", "ignore"] })
    child.on("close", (code) => resolve(code === 0))
    child.on("error", () => resolve(false))
    globalThis.setTimeout(() => resolve(false), 1000)
  })
}

async function renderPdfPages(pdfId, fileUrl, file_path) {
  log(`Starting PDF rendering for pdf_id=${pdfId}`)
  
  const hasPoppler = await checkRendererAvailable("pdftoppm")
  const hasMutool = await checkRendererAvailable("mutool")
  
  if (!hasPoppler && !hasMutool) {
    logError("No PDF renderer available on server. Install pdftoppm (poppler-utils) or mutool.")
    return { success: false, error: "No PDF renderer available. Install pdftoppm or mutool on the server." }
  }
  
  try {
    const pdfBuffer = file_path
      ? await downloadPdfFromFile(file_path)
      : await downloadPdfBuffer(fileUrl)
    
    const pdfFileName = `document-${pdfId}.pdf`
    
    const renderedImages = []
    const onPage = async ({ buffer, pageNum, width, height }) => {
      const { key, url } = await uploadImageToStorage(buffer, pdfId, pageNum)
      
      await supabaseAdmin
        .from("flipbook_pdf_page_images")
        .upsert({
          pdf_page_id: pdfId,
          page_num: pageNum,
          image_url: url,
          image_path: key,
          width,
          height,
          scale: RENDER_DPI,
          format: OUTPUT_FORMAT,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle()
      
      renderedImages.push({ pageNum, url, key })  // small metadata only, no buffers
    }

    const count = hasMutool
      ? await renderWithMutool(pdfBuffer, pdfFileName, pdfId, onPage)
      : await renderWithPdftoppm(pdfBuffer, pdfFileName, pdfId, onPage)

    if (!count) return { success: false, error: "Failed to render PDF - no pages produced" }
    log(`Rendered ${count} pages for pdf_id=${pdfId}`)
    return { success: true, images: renderedImages }
  } catch (error) {
    logError(`PDF rendering failed for pdf_id=${pdfId}:`, error.message)
    return { success: false, error: error.message }
  }
}

async function renderWithMutoolLow(pdfBuffer, pdfFileName, pdfId, onPage) {
  const tempDir = `/tmp/pdf-render-low-${pdfId}-${Date.now()}`
  await fs.mkdir(tempDir, { recursive: true })

  try {
    const tempPdfPath = path.join(tempDir, pdfFileName)
    await fs.writeFile(tempPdfPath, pdfBuffer)
    const outputPattern = path.join(tempDir, "page-%d.png")

    await new Promise((resolve, reject) => {
      const child = spawn(
        "mutool",
        ["draw", "-o", outputPattern, "-r", String(RENDER_DPI_LOW), tempPdfPath],
        { windowsHide: true }
      )
      let stderr = ""
      child.stderr.on("data", (data) => { stderr += data.toString() })
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`mutool failed: ${stderr}`)))
      child.on("error", reject)
    })

    const files = await fs.readdir(tempDir)
    const pngFiles = files
      .filter(f => f.startsWith("page-") && f.endsWith(".png"))
      .map(f => {
        const match = f.match(/page-(\d+)\.png$/)
        return match ? { file: f, pageNum: parseInt(match[1], 10) } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.pageNum - b.pageNum)

    let count = 0
    for (const { file, pageNum } of pngFiles) {
      const imageBuffer = await fs.readFile(path.join(tempDir, file))
      const { data: webpBuffer, info } = await sharp(imageBuffer)
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true })
      await onPage({ buffer: webpBuffer, pageNum, width: info.width, height: info.height })
      count++
    }
    return count
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function renderWithPdftoppmLow(pdfBuffer, pdfFileName, pdfId, onPage) {
  const tempDir = `/tmp/pdf-render-low-${pdfId}-${Date.now()}`
  await fs.mkdir(tempDir, { recursive: true })
  
  try {
    const tempPdfPath = path.join(tempDir, pdfFileName)
    await fs.writeFile(tempPdfPath, pdfBuffer)
    const baseName = path.basename(pdfFileName, ".pdf")
    const outputPrefix = path.join(tempDir, baseName)

    const dpi = RENDER_DPI_LOW
    const width = 850 * RENDER_DPI_LOW / 72

    await new Promise((resolve, reject) => {
      const child = spawn(
        "pdftoppm",
        ["-png", "-f", "1", "-png", "-r", String(dpi), "-width", String(width), tempPdfPath, outputPrefix],
        { windowsHide: true }
      )
      let stderr = ""
      child.stderr.on("data", (data) => { stderr += data.toString() })
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`pdftoppm failed: ${stderr}`)))
      child.on("error", reject)
    })

    const files = await fs.readdir(tempDir)
    const baseNameSafe = path.basename(pdfFileName, ".pdf")
    const pngFiles = files
      .filter(f => f.startsWith(baseNameSafe) && f.endsWith(".png"))
      .map(f => {
        const match = f.match(/-(\d+)\.png$/)
        return match ? { file: f, pageNum: parseInt(match[1], 10) } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.pageNum - b.pageNum)

    let count = 0
    for (const { file, pageNum } of pngFiles) {
      const imageBuffer = await fs.readFile(path.join(tempDir, file))
      const { data: webpBuffer, info } = await sharp(imageBuffer)
        .webp({ quality: 85 })
        .toBuffer({ resolveWithObject: true })
      await onPage({ buffer: webpBuffer, pageNum, width: info.width, height: info.height })
      count++
    }
    return count
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function renderWithMutool(pdfBuffer, pdfFileName, pdfId, onPage) {
  const tempDir = `/tmp/pdf-render-${pdfId}-${Date.now()}`
  await fs.mkdir(tempDir, { recursive: true })

  try {
    const tempPdfPath = path.join(tempDir, pdfFileName)
    await fs.writeFile(tempPdfPath, pdfBuffer)
    const outputPattern = path.join(tempDir, "page-%d.png")

    await new Promise((resolve, reject) => {
      const child = spawn(
        "mutool",
        ["draw", "-o", outputPattern, "-r", String(RENDER_DPI), tempPdfPath],
        { windowsHide: true }
      )
      let stderr = ""
      child.stderr.on("data", (data) => { stderr += data.toString() })
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`mutool failed: ${stderr}`)))
      child.on("error", reject)
    })

    const files = await fs.readdir(tempDir)
    const pngFiles = files
      .filter(f => f.startsWith("page-") && f.endsWith(".png"))
      .map(f => {
        const match = f.match(/page-(\d+)\.png$/)
        return match ? { file: f, pageNum: parseInt(match[1], 10) } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.pageNum - b.pageNum)

    let count = 0
    for (const { file, pageNum } of pngFiles) {
      const imageBuffer = await fs.readFile(path.join(tempDir, file))
      const { data: webpBuffer, info } = await sharp(imageBuffer)
        .webp({ quality: 100 })
        .toBuffer({ resolveWithObject: true })
      await onPage({ buffer: webpBuffer, pageNum, width: info.width, height: info.height })
      count++
    }
    return count
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function renderWithPdftoppm(pdfBuffer, pdfFileName, pdfId, onPage) {
  const tempDir = `/tmp/pdf-render-${pdfId}-${Date.now()}`
  await fs.mkdir(tempDir, { recursive: true })
  
  try {
    const tempPdfPath = path.join(tempDir, pdfFileName)
    await fs.writeFile(tempPdfPath, pdfBuffer)
    const baseName = path.basename(pdfFileName, ".pdf")
    const outputPrefix = path.join(tempDir, baseName)

    const dpi = RENDER_DPI
    const width = 850 * RENDER_DPI / 72

    await new Promise((resolve, reject) => {
      const child = spawn(
        "pdftoppm",
        ["-png", "-f", "1", "-png", "-r", String(dpi), "-width", String(width), tempPdfPath, outputPrefix],
        { windowsHide: true }
      )
      let stderr = ""
      child.stderr.on("data", (data) => { stderr += data.toString() })
      child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`pdftoppm failed: ${stderr}`)))
      child.on("error", reject)
    })

    const files = await fs.readdir(tempDir)
    const baseNameSafe = path.basename(pdfFileName, ".pdf")
    const pngFiles = files
      .filter(f => f.startsWith(baseNameSafe) && f.endsWith(".png"))
      .map(f => {
        const match = f.match(/-(\d+)\.png$/)
        return match ? { file: f, pageNum: parseInt(match[1], 10) } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.pageNum - b.pageNum)

    let count = 0
    for (const { file, pageNum } of pngFiles) {
      const imageBuffer = await fs.readFile(path.join(tempDir, file))
      const { data: webpBuffer, info } = await sharp(imageBuffer)
        .webp({ quality: 100 })
        .toBuffer({ resolveWithObject: true })
      await onPage({ buffer: webpBuffer, pageNum, width: info.width, height: info.height })
      count++
    }
    return count
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  }
}

async function getPdfPageImages(pdfId, scale = RENDER_DPI) {
  const { data, error } = await supabaseAdmin
    .from("flipbook_pdf_page_images")
    .select("*")
    .eq("pdf_page_id", pdfId)
    .eq("scale", scale)
    .order("page_num", { ascending: true })
  
  if (error) {
    throw new Error(`Failed to fetch PDF page images: ${error.message}`)
  }
  
  return data || []
}

export async function getPdfPageImagesWithFallback(pdfId) {
  let images = await getPdfPageImages(pdfId, RENDER_DPI)
  if (images.length === 0) {
    images = await getPdfPageImages(pdfId, RENDER_DPI_LOW)
  }
  return images
}

async function hasRenderedImages(pdfId) {
  const { count, error } = await supabaseAdmin
    .from("flipbook_pdf_page_images")
    .select("id", { count: "exact" })
    .eq("pdf_page_id", pdfId)
  
  if (error) return false
  return (count || 0) > 0
}

async function queueRenderJob(pdfId, fileUrl, file_path) {
  setImmediate(() => {
    renderPdfPages(pdfId, fileUrl, file_path).catch((err) => {
      logError(`Render job failed for pdf_id=${pdfId}:`, err.message)
    })
  })
}

async function renderPdfPagesProgressive(pdfId, fileUrl, file_path) {
  log(`Starting progressive PDF rendering for pdf_id=${pdfId}`)
  
  const hasPoppler = await checkRendererAvailable("pdftoppm")
  const hasMutool = await checkRendererAvailable("mutool")
  
  if (!hasPoppler && !hasMutool) {
    logError("No PDF renderer available on server. Install pdftoppm (poppler-utils) or mutool.")
    return { success: false, error: "No PDF renderer available. Install pdftoppm or mutool on the server." }
  }
  
  try {
    const pdfBuffer = file_path
      ? await downloadPdfFromFile(file_path)
      : await downloadPdfBuffer(fileUrl)
    
    const pdfFileName = `document-${pdfId}.pdf`
    
    const onPageLow = async ({ buffer, pageNum, width, height }) => {
      const { key, url } = await uploadImageToStorage(buffer, pdfId, pageNum, "webp")
      
      await supabaseAdmin
        .from("flipbook_pdf_page_images")
        .upsert({
          pdf_page_id: pdfId,
          page_num: pageNum,
          image_url: url,
          image_path: key,
          width,
          height,
          scale: RENDER_DPI_LOW,
          format: "webp",
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle()
    }
    
    const onPageHigh = async ({ buffer, pageNum, width, height }) => {
      const { key, url } = await uploadImageToStorage(buffer, pdfId, pageNum, "webp")
      
      await supabaseAdmin
        .from("flipbook_pdf_page_images")
        .upsert({
          pdf_page_id: pdfId,
          page_num: pageNum,
          image_url: url,
          image_path: key,
          width,
          height,
          scale: RENDER_DPI,
          format: "webp",
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle()
    }
    
    const lowCount = hasMutool
      ? await renderWithMutoolLow(pdfBuffer, pdfFileName, pdfId, onPageLow)
      : await renderWithPdftoppmLow(pdfBuffer, pdfFileName, pdfId, onPageLow)
    
    if (!lowCount) return { success: false, error: "Failed to render PDF - no pages produced" }
    log(`Rendered ${lowCount} low-quality pages for pdf_id=${pdfId}`)
    
    const highCount = hasMutool
      ? await renderWithMutool(pdfBuffer, pdfFileName, pdfId, onPageHigh)
      : await renderWithPdftoppm(pdfBuffer, pdfFileName, pdfId, onPageHigh)
    
    if (!highCount) return { success: true, images: [] }
    log(`Upgraded to ${highCount} HD pages for pdf_id=${pdfId}`)
    return { success: true, images: [] }
  } catch (error) {
    logError(`Progressive PDF rendering failed for pdf_id=${pdfId}:`, error.message)
    return { success: false, error: error.message }
  }
}

export {
  renderPdfPages,
  renderPdfPagesProgressive,
  getPdfPageImages,
  getPdfPageImagesWithFallback,
  hasRenderedImages,
  queueRenderJob,
  RENDER_DPI,
  RENDER_DPI_LOW,
  OUTPUT_FORMAT,
}