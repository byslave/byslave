import { useEffect, useRef } from 'react'
import { getBlastSet } from '../game/pieces'
import type { BlastSetId } from '../game/types'

export type Burst = {
  id: number
  rows: number[]
  cols: number[]
  combo: number
}

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  kind: string
}

type Props = {
  burst: Burst | null
  equipped: BlastSetId
  cell: number
  gap: number
}

export default function BlastFx({ burst, equipped, cell, gap }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const raf = useRef<number>(0)

  useEffect(() => {
    if (!burst) return
    const canvas = canvasRef.current
    if (!canvas) return
    const set = getBlastSet(equipped)
    const stride = cell + gap
    const spawn: Particle[] = []

    const cells: Array<[number, number]> = []
    for (const r of burst.rows) {
      for (let c = 0; c < 8; c++) cells.push([r, c])
    }
    for (const c of burst.cols) {
      for (let r = 0; r < 8; r++) cells.push([r, c])
    }

    const count = (set.kind === 'lightning' ? 10 : 14) + Math.min(burst.combo, 6) * 4
    for (const [r, c] of cells) {
      const cx = c * stride + cell / 2
      const cy = r * stride + cell / 2
      for (let i = 0; i < count; i++) {
        const color = set.colors[i % set.colors.length]
        const angle = Math.random() * Math.PI * 2
        const speed = 1.2 + Math.random() * 3.4 + burst.combo * 0.35
        spawn.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (set.kind === 'rain' ? 2 : 0.4),
          life: 1,
          max: 36 + Math.random() * 24,
          size: set.kind === 'cubes' ? 5 + Math.random() * 5 : 2 + Math.random() * 3,
          color,
          kind: set.kind,
        })
      }
    }
    particles.current.push(...spawn)
  }, [burst, equipped, cell, gap])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const tick = () => {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      particles.current = particles.current.filter((p) => p.life > 0)
      for (const p of particles.current) {
        p.x += p.vx
        p.y += p.vy
        if (p.kind === 'rain' || p.kind === 'aurora') p.vy += 0.08
        else p.vy += 0.04
        p.life -= 1 / p.max
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 12
        if (p.kind === 'cubes') {
          ctx.fillRect(p.x, p.y, p.size, p.size)
        } else if (p.kind === 'lightning') {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x + p.vx * 3, p.y + p.vy * 3)
          ctx.strokeStyle = p.color
          ctx.lineWidth = 2
          ctx.stroke()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return <canvas className="fx-canvas" ref={canvasRef} width={720} height={720} />
}
