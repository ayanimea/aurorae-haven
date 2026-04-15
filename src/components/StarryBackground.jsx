import { useEffect, useRef } from 'react'

function buildStars(width, height) {
  const stars = []

  for (let i = 0; i < 300; i += 1) {
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

    let width = 0
    let height = 0
    let stars = []
    let animationFrameId
    let time = 0

    const setSize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      stars = buildStars(width, height)
    }

    const draw = () => {
      context.clearRect(0, 0, width, height)
      time += 0.016

      for (const star of stars) {
        const flicker = Math.sin(time * star.twinkleSpeed * 60 + star.twinklePhase)
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

      animationFrameId = window.requestAnimationFrame(draw)
    }

    setSize()
    draw()
    window.addEventListener('resize', setSize)

    return () => {
      window.removeEventListener('resize', setSize)
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      data-testid='starry-background-canvas'
      className='starry-background-canvas'
    />
  )
}
