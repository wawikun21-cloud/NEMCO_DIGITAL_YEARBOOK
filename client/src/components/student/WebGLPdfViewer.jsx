import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import * as THREE from "three"
import * as pdfjsLib from "pdfjs-dist"

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString()

export default function WebGLPdfViewer({ pdfUrl, theme }) {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const sceneRef = useRef(null)
  const rendererRef = useRef(null)
  const cameraRef = useRef(null)
  const pageMeshRef = useRef(null)
  const animFrameRef = useRef(0)
  const texturesRef = useRef({ front: null, back: null })
  const curlRef = useRef({ progress: 0, animating: false, direction: null })

  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageImages, setPageImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [webglOk, setWebglOk] = useState(true)

  // Load PDF and render pages to canvas textures
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      try {
        const loadingTask = pdfjsLib.getDocument(pdfUrl)
        const doc = await loadingTask.promise
        if (cancelled) return
        const pages = []
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement("canvas")
          canvas.width = viewport.width
          canvas.height = viewport.height
          const ctx = canvas.getContext("2d")
          await page.render({ canvasContext: ctx, viewport }).promise
          pages.push(canvas.toDataURL("image/jpeg", 0.92))
        }
        if (!cancelled) {
          setPageImages(pages)
          setTotalPages(pages.length)
          setLoading(false)
        }
      } catch (err) {
        if (!cancelled) { setError(err.message); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [pdfUrl])

  // Init Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return
    try {
      const canvas = canvasRef.current
      const container = containerRef.current
      const rect = container.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (w === 0 || h === 0) return

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x1a1a2e)

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100)
      camera.position.set(0, 0, 3)
      camera.lookAt(0, 0, 0)

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(w, h)

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.6))
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
      dirLight.position.set(3, 5, 3)
      scene.add(dirLight)

      // Page plane
      const aspect = 0.71 // A4 ratio
      const pageW = 2
      const pageH = pageW / aspect
      const geo = new THREE.PlaneGeometry(pageW, pageH, 32, 1)
      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.05,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(0, 0, 0)
      scene.add(mesh)

      // Ground shadow
      const shadowGeo = new THREE.PlaneGeometry(4, 4)
      const shadowMat = new THREE.ShadowMaterial({ opacity: 0.15 })
      const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat)
      shadowPlane.rotation.x = -Math.PI / 2
      shadowPlane.position.y = -pageH / 2 - 0.01
      shadowPlane.receiveShadow = true
      scene.add(shadowPlane)

      sceneRef.current = scene
      rendererRef.current = renderer
      cameraRef.current = camera
      pageMeshRef.current = { mesh, geo, mat, pageW, pageH }

      const animate = () => {
        animFrameRef.current = requestAnimationFrame(animate)
        renderer.render(scene, camera)
      }
      animate()

      const handleResize = () => {
        const r = container.getBoundingClientRect()
        camera.aspect = r.width / r.height
        camera.updateProjectionMatrix()
        renderer.setSize(r.width, r.height)
      }
      window.addEventListener("resize", handleResize)

      return () => {
        window.removeEventListener("resize", handleResize)
        cancelAnimationFrame(animFrameRef.current)
        renderer.dispose()
        geo.dispose()
        mat.dispose()
      }
    } catch {
      setWebglOk(false)
    }
  }, [])

  // Load textures when page changes
  useEffect(() => {
    if (!pageMeshRef.current || pageImages.length === 0) return
    const { mat } = pageMeshRef.current

    const loader = new THREE.TextureLoader()
    const frontUrl = pageImages[currentPage]
    const backUrl = pageImages[currentPage + 1] || frontUrl

    // Dispose old
    if (texturesRef.current.front) texturesRef.current.front.dispose()
    if (texturesRef.current.back) texturesRef.current.back.dispose()

    loader.load(frontUrl, (tex) => {
      texturesRef.current.front = tex
      mat.map = tex
      mat.needsUpdate = true
    })
    loader.load(backUrl, (tex) => {
      texturesRef.current.back = tex
    })
  }, [currentPage, pageImages])

  // Page curl deformation
  const applyCurl = useCallback((progress) => {
    const { geo, pageW } = pageMeshRef.current
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const normX = (x + pageW / 2) / pageW
      let newX, newZ
      if (progress < 0.5) {
        const t = progress * 2
        const angle = t * Math.PI * 0.5
        const curlR = pageW * 0.3
        if (normX > 1 - t) {
          const localX = (normX - (1 - t)) / t
          const curlAngle = localX * angle
          newX = x - Math.sin(curlAngle) * curlR * (1 - progress)
          newZ = (1 - Math.cos(curlAngle)) * curlR * (1 - progress)
        } else {
          newX = x * (1 - progress * 0.1)
          newZ = 0
        }
      } else {
        const t = (progress - 0.5) * 2
        const angle = Math.PI * 0.5 - t * Math.PI * 0.5
        const curlR = pageW * 0.3
        if (normX < t) {
          newX = x
          newZ = 0
        } else {
          const localX = (normX - t) / (1 - t)
          const curlAngle = localX * angle
          newX = x - Math.sin(curlAngle) * curlR * progress
          newZ = (1 - Math.cos(curlAngle)) * curlR * progress
        }
      }
      pos.setX(i, newX)
      pos.setZ(i, newZ)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  }, [])

  // Flip animation
  const flipPage = useCallback((direction) => {
    if (curlRef.current.animating) return
    curlRef.current.animating = true
    curlRef.current.direction = direction
    const duration = 600
    const start = performance.now()
    const animate = () => {
      const t = Math.min((performance.now() - start) / duration, 1)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
      const progress = direction === "next" ? eased : 1 - eased
      curlRef.current.progress = progress
      applyCurl(progress)
      if (t < 1) {
        requestAnimationFrame(animate)
      } else {
        curlRef.current.animating = false
        curlRef.current.progress = 0
        applyCurl(0)
        if (direction === "next") {
          setCurrentPage((p) => Math.min(p + 1, totalPages - 1))
        } else {
          setCurrentPage((p) => Math.max(p - 1, 0))
        }
      }
    }
    requestAnimationFrame(animate)
  }, [applyCurl, totalPages])

  const goNext = useCallback(() => {
    if (currentPage < totalPages - 1) flipPage("next")
  }, [currentPage, totalPages, flipPage])

  const goPrev = useCallback(() => {
    if (currentPage > 0) flipPage("prev")
  }, [currentPage, flipPage])

  // Click to flip
  const handleClick = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const relX = x / rect.width
    if (relX < 0.2) goPrev()
    else if (relX > 0.8) goNext()
  }, [goNext, goPrev])

  // Keyboard
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext()
      else if (e.key === "ArrowLeft") goPrev()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goPrev])

  if (!webglOk) {
    return <div className="flex h-64 items-center justify-center text-white/40">WebGL not available</div>
  }

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
        <p className="text-sm text-white/40">Loading PDF…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-red-400">Failed to load PDF</p>
        <p className="text-xs text-white/30">{error}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div
        ref={containerRef}
        className="flex-1 w-full cursor-pointer relative"
        onClick={handleClick}
        style={{ minHeight: "500px", height: "100%" }}
      >
        <canvas ref={canvasRef} className="w-full h-full block rounded-lg" />
        {/* Click zones */}
        <div className="absolute inset-y-0 left-0 w-[20%] z-10" onClick={goPrev} />
        <div className="absolute inset-y-0 right-0 w-[20%] z-10" onClick={goNext} />
      </div>
      {/* Controls */}
      <div className="flex items-center justify-center gap-4 py-3">
        <button
          onClick={goPrev}
          disabled={currentPage <= 0}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="text-xs text-white/50 min-w-[60px] text-center">
          {totalPages > 0 ? `${currentPage + 1} / ${totalPages}` : "—"}
        </span>
        <button
          onClick={goNext}
          disabled={currentPage >= totalPages - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 disabled:opacity-30 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  )
}
