import { useRef, useEffect, useCallback, useState } from "react"
import type { FlipbookState, FlipbookActions, ViewMode } from "./types"
import {
  createScene,
  createCamera,
  createRenderer,
  createLights,
  createDropShadowPlane,
  createSpineMesh,
  createPageGeometry,
  createPageMaterial,
  applyCurlDeformation,
  loadTexture,
  isWebGLAvailable,
  type PageCurlState,
} from "./WebGLPageRenderer"
import * as THREE from "three"

interface FlipbookWebGLModeProps {
  state: FlipbookState
  actions: FlipbookActions
  viewMode: ViewMode
  flipSpeed?: number
}

export default function FlipbookWebGLMode({
  state,
  actions,
  viewMode,
  flipSpeed = 0.6,
}: FlipbookWebGLModeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const pageMeshRef = useRef<THREE.Mesh | null>(null)
  const pageGeoRef = useRef<THREE.PlaneGeometry | null>(null)
  const materialRef = useRef<THREE.ShaderMaterial | null>(null)
  const animFrameRef = useRef<number>(0)
  const curlStateRef = useRef<PageCurlState>({ progress: 0 })
  const isAnimatingRef = useRef(false)
  const texturesRef = useRef<{ front: THREE.Texture | null; back: THREE.Texture | null }>({ front: null, back: null })
  const touchStartRef = useRef<{ x: number; time: number } | null>(null)
  const [webglSupported, setWebglSupported] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Check WebGL support
  useEffect(() => {
    if (!isWebGLAvailable()) {
      setWebglSupported(false)
    }
  }, [])

  // Initialize Three.js scene
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !webglSupported) return

    const container = containerRef.current
    const canvas = canvasRef.current
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = rect.height

    setCanvasSize({ width, height })

    const scene = createScene()
    const camera = createCamera(width, height)
    const renderer = createRenderer(canvas)

    renderer.setSize(width, height)
    createLights(scene)
    createDropShadowPlane(scene, 2, 1.5)
    createSpineMesh(scene, 1.5, 0.02)

    sceneRef.current = scene
    cameraRef.current = camera
    rendererRef.current = renderer

    // Create page geometry and material
    const pageWidth = viewMode === "double" ? 2 : 1
    const constHeight = pageWidth * 0.75
    const geo = createPageGeometry(pageWidth, constHeight)
    const mat = createPageMaterial(null, null)
    mat.uniforms.pageWidth.value = pageWidth

    const mesh = new THREE.Mesh(geo, mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)

    pageGeoRef.current = geo
    materialRef.current = mat
    pageMeshRef.current = mesh

    // Animation loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate)
      renderer.render(scene, camera)
    }
    animate()

    // Resize handler
    const handleResize = () => {
      const r = container.getBoundingClientRect()
      const w = r.width
      const h = r.height
      setCanvasSize({ width: w, height: h })
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
      cancelAnimationFrame(animFrameRef.current)
      renderer.dispose()
      geo.dispose()
      mat.dispose()
      if (texturesRef.current.front) texturesRef.current.front.dispose()
      if (texturesRef.current.back) texturesRef.current.back.dispose()
    }
  }, [webglSupported, viewMode])

  // Load textures when page changes
  useEffect(() => {
    if (!materialRef.current || !webglSupported) return

    let cancelled = false

    const loadPageTextures = async () => {
      const frontPage = state.currentPage
      const backPage = state.currentPage + 1

      // Dispose old textures
      if (texturesRef.current.front) texturesRef.current.front.dispose()
      if (texturesRef.current.back) texturesRef.current.back.dispose()

      const frontUrl = state.pageImages.get(frontPage)
      const backUrl = state.pageImages.get(backPage)

      let frontTex: THREE.Texture | null = null
      let backTex: THREE.Texture | null = null

      if (frontUrl) {
        try { frontTex = await loadTexture(frontUrl) } catch { /* skip */ }
      }
      if (backUrl) {
        try { backTex = await loadTexture(backUrl) } catch { /* skip */ }
      }

      if (cancelled) {
        if (frontTex) frontTex.dispose()
        if (backTex) backTex.dispose()
        return
      }

      texturesRef.current = { front: frontTex, back: backTex }

      if (materialRef.current) {
        materialRef.current.uniforms.pageTexture.value = frontTex
        materialRef.current.uniforms.backTexture.value = backTex
        materialRef.current.uniforms.hasTexture.value = frontTex ? 1 : 0
      }
    }

    loadPageTextures()
    return () => { cancelled = true }
  }, [state.currentPage, state.pageImages, webglSupported])

  // Animate page flip
  useEffect(() => {
    if (!pageGeoRef.current || !materialRef.current || !webglSupported) return

    if (state.isFlipping && !isAnimatingRef.current) {
      isAnimatingRef.current = true
      const startTime = performance.now()
      const duration = flipSpeed * 1000
      const direction = state.flipDirection

      const animateFlip = () => {
        const elapsed = performance.now() - startTime
        const t = Math.min(elapsed / duration, 1)

        // Ease in-out cubic
        const eased = t < 0.5
          ? 4 * t * t * t
          : 1 - Math.pow(-2 * t + 2, 3) / 2

        const progress = direction === "next" ? eased : 1 - eased
        curlStateRef.current.progress = progress

        applyCurlDeformation(pageGeoRef.current!, progress)
        materialRef.current!.uniforms.flip.value = progress > 0.5 ? 1 : 0

        if (t < 1) {
          requestAnimationFrame(animateFlip)
        } else {
          isAnimatingRef.current = false
          curlStateRef.current.progress = direction === "next" ? 1 : 0
        }
      }

      requestAnimationFrame(animateFlip)
    }
  }, [state.isFlipping, state.flipDirection, flipSpeed, webglSupported])

  // Drag interaction
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (state.isFlipping || !pageGeoRef.current || !materialRef.current) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const relX = x / rect.width

    // Only drag from edges
    if (relX > 0.15 && relX < 0.85) return

    touchStartRef.current = { x: e.clientX, time: performance.now() }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    actions.setDragging(true)
  }, [state.isFlipping, actions])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!touchStartRef.current || !pageGeoRef.current || !materialRef.current) return

    const delta = e.clientX - touchStartRef.current.x
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const progress = Math.max(0, Math.min(1, Math.abs(delta) / (rect.width * 0.4)))
    const direction = delta < 0 ? "next" : "prev"

    curlStateRef.current.progress = progress
    applyCurlDeformation(pageGeoRef.current, progress)
    materialRef.current.uniforms.flip.value = progress > 0.5 ? 1 : 0
  }, [])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!touchStartRef.current) return
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)

    const delta = e.clientX - touchStartRef.current.x
    const elapsed = performance.now() - touchStartRef.current.time
    touchStartRef.current = null
    actions.setDragging(false)

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const progress = Math.abs(delta) / (rect.width * 0.4)
    const velocity = Math.abs(delta) / elapsed

    // Complete or snap back
    if (progress > 0.3 || velocity > 0.5) {
      if (delta < 0) actions.goNext()
      else actions.goPrev()
    } else {
      // Snap back animation
      const startProgress = curlStateRef.current.progress
      const startTime = performance.now()
      const duration = flipSpeed * 300

      const snapBack = () => {
        const t = Math.min((performance.now() - startTime) / duration, 1)
        const eased = 1 - (1 - t) * (1 - t)
        const p = startProgress * (1 - eased)

        if (pageGeoRef.current && materialRef.current) {
          applyCurlDeformation(pageGeoRef.current, p)
          materialRef.current.uniforms.flip.value = p > 0.5 ? 1 : 0
        }

        if (t < 1) requestAnimationFrame(snapBack)
        else {
          curlStateRef.current.progress = 0
          if (pageGeoRef.current) applyCurlDeformation(pageGeoRef.current, 0)
        }
      }
      requestAnimationFrame(snapBack)
    }
  }, [actions, flipSpeed])

  // Click to flip
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (state.isFlipping) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const relX = x / rect.width

    if (relX < 0.2) actions.goPrev()
    else if (relX > 0.8) actions.goNext()
  }, [state.isFlipping, actions])

  // Touch swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, time: performance.now() }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const delta = e.changedTouches[0].clientX - touchStartRef.current.x
    if (Math.abs(delta) > 50) {
      if (delta < 0) actions.goNext()
      else actions.goPrev()
    }
    touchStartRef.current = null
  }, [actions])

  if (!webglSupported) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/20">
        <p className="text-sm text-white/40">WebGL not available — use mode=&quot;css&quot; fallback</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full"
      style={{
        transform: `scale(${state.zoom})`,
        transformOrigin: "center center",
        transition: "transform 0.2s ease-out",
        height: canvasSize.width * 0.6,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full rounded-lg"
        style={{ display: "block" }}
      />
    </div>
  )
}
