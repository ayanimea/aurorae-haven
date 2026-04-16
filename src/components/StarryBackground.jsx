import { useEffect, useRef } from 'react'

function buildStars(width, height) {
  const stars = []
  const starCount = Math.max(140, Math.min(320, Math.floor((width * height) / 6000)))

  for (let starIndex = 0; starIndex < starCount; starIndex += 1) {
    const isBright = Math.random() < 0.08
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: isBright ? Math.random() * 1.8 + 0.8 : Math.random() * 0.9 + 0.2,
      opacity: Math.random() * 0.6 + 0.1,
      twinkleSpeed: Math.random() * 0.008 + 0.002,
      twinklePhase: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.3 ? 220 : Math.random() < 0.5 ? 260 : 0
    })
  }

  return stars
}

export default function StarryBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return undefined

    const canvas = canvasRef.current
    if (!canvas) return undefined

    const context = canvas.getContext('2d')
    if (!context) return undefined

    /* Respect prefers-reduced-motion: render a single static frame and skip the
       animation loop so the canvas shows stars without twinkling/movement. */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let width = 0
    let height = 0
    let stars = []
    let animationFrameId
    let time = 0
    let lastTimestamp = 0

    const setSize = () => {
      const dpr = window.devicePixelRatio || 1
      width = window.innerWidth
      height = window.innerHeight
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      stars = buildStars(width, height)
    }

    const drawFrame = (staticAlpha = false) => {
      context.clearRect(0, 0, width, height)

      for (const star of stars) {
        const flicker = staticAlpha ? 0.8 : Math.sin(time * star.twinkleSpeed + star.twinklePhase)
        const alpha = star.opacity * (0.5 + 0.5 * flicker)

        if (star.hue === 0) {
          context.fillStyle = `rgba(220, 225, 240, ${alpha})`
        } else {
          context.fillStyle = `hsla(${star.hue}, 60%, 80%, ${alpha})`
        }

        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fill()

        if (star.radius > 1.2) {
          const gradient = context.createRadialGradient(
            star.x,
            star.y,
            0,
            star.x,
            star.y,
            star.radius * 4
          )
          if (star.hue === 0) {
            gradient.addColorStop(0, `rgba(200, 210, 240, ${alpha * 0.15})`)
          } else {
            gradient.addColorStop(0, `hsla(${star.hue}, 50%, 75%, ${alpha * 0.15})`)
          }
          gradient.addColorStop(1, 'transparent')
          context.fillStyle = gradient
          context.beginPath()
          context.arc(star.x, star.y, star.radius * 4, 0, Math.PI * 2)
          context.fill()
        }
      }
    }

    const draw = (timestamp = 0) => {
      /* Pause animation when the tab/window is hidden to save CPU/battery.
         Reset lastTimestamp to 0 so the next visible frame doesn't accumulate
         a large delta that would cause an abrupt jump in twinkle state. */
      if (document.visibilityState !== 'visible') {
        lastTimestamp = 0
        animationFrameId = window.requestAnimationFrame(draw)
        return
      }
      if (!lastTimestamp) lastTimestamp = timestamp
      const deltaSeconds = (timestamp - lastTimestamp) / 1000
      lastTimestamp = timestamp
      time += deltaSeconds

      drawFrame(false)
      animationFrameId = window.requestAnimationFrame(draw)
    }

    setSize()

    if (prefersReducedMotion) {
      /* Static starfield — no animation loop */
      drawFrame(true)
    } else {
      animationFrameId = window.requestAnimationFrame(draw)
    }

    window.addEventListener('resize', setSize)

    return () => {
      window.removeEventListener('resize', setSize)
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    // biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative canvas has no tabIndex and is not keyboard-accessible
    <canvas
      ref={canvasRef}
      data-testid='starry-background-canvas'
      className='starry-background-canvas'
      aria-hidden='true'
    />
  )
}
