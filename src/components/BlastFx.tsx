import { useEffect, useRef } from 'react'
import { getBlastSet } from '../game/pieces'
import type { BlastSetId } from '../game/types'
import type { HeatTier } from '../game/juice'

export type Burst = {
  id: number
  rows: number[]
  cols: number[]
  combo: number
}

type Kind = 'spark' | 'ember' | 'smoke' | 'debris' | 'flash' | 'shock'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
  kind: Kind
  rot: number
  spin: number
}

type Props = {
  burst: Burst | null
  equipped: BlastSetId
  cell: number
  gap: number
  heat?: HeatTier
}

const FIRE = ['#FFB347', '#FF6A00', '#FFE14A', '#FF3B1F', '#FFF4C8', '#FF2EC8']
const SMOKE = ['#2a2e38', '#4a4e58', '#6a6e78', '#3d342c']

function hexAlpha(color: string, a: number) {
  const n = Math.round(Math.max(0, Math.min(1, a)) * 255)
    .toString(16)
    .padStart(2, '0')
  if (color.startsWith('#') && (color.length === 7 || color.length === 4)) return `${color}${n}`
  return color
}

export default function BlastFx({ burst, equipped, cell, gap, heat = 'none' }: Props) {
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
    const fire = heat === 'inferno' || burst.combo >= 10
    const ember = heat === 'flame' || heat === 'ember' || burst.combo >= 5
    const boost = 1 + Math.min(burst.combo, 12) * 0.08

    const cells: Array<[number, number]> = []
    for (const r of burst.rows) {
      for (let c = 0; c < 8; c++) cells.push([r, c])
    }
    for (const c of burst.cols) {
      for (let r = 0; r < 8; r++) cells.push([r, c])
    }

    const push = (p: Omit<Particle, 'life' | 'rot' | 'spin'> & Partial<Pick<Particle, 'rot' | 'spin'>>) => {
      spawn.push({
        life: 1,
        rot: p.rot ?? 0,
        spin: p.spin ?? 0,
        ...p,
      })
    }

    for (const [r, c] of cells) {
      const cx = c * stride + cell / 2
      const cy = r * stride + cell / 2
      const sparks = Math.round((ember ? 10 : 7) * boost) + (fire ? 6 : 0)
      const embers = Math.round((ember ? 5 : 2) * boost) + (fire ? 6 : 0)
      const smokes = (fire ? 6 : ember ? 3 : 2)
      const debris = 3 + (fire ? 2 : 0)

      for (let i = 0; i < sparks; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = (2.4 + Math.random() * 5.2) * boost + (fire ? 2 : 0)
        const color = fire ? FIRE[i % FIRE.length]! : set.colors[i % set.colors.length]!
        push({
          x: cx + (Math.random() - 0.5) * 6,
          y: cy + (Math.random() - 0.5) * 6,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          max: 22 + Math.random() * 18,
          size: 1.2 + Math.random() * 2.2,
          color,
          kind: 'spark',
        })
      }

      for (let i = 0; i < embers; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4
        const speed = 0.6 + Math.random() * 2.1
        push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          max: 36 + Math.random() * 28,
          size: 3 + Math.random() * 5,
          color: fire ? FIRE[i % FIRE.length]! : set.colors[i % set.colors.length]!,
          kind: 'ember',
        })
      }

      for (let i = 0; i < smokes; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.8
        push({
          x: cx + (Math.random() - 0.5) * 8,
          y: cy,
          vx: Math.cos(angle) * (0.2 + Math.random() * 0.6),
          vy: -0.4 - Math.random() * 0.9,
          max: 48 + Math.random() * 32,
          size: 8 + Math.random() * 14,
          color: SMOKE[i % SMOKE.length]!,
          kind: 'smoke',
        })
      }

      for (let i = 0; i < debris; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.4 + Math.random() * 3.6
        push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.6,
          max: 34 + Math.random() * 22,
          size: 3 + Math.random() * 5,
          color: set.colors[i % set.colors.length]!,
          kind: 'debris',
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.35,
        })
      }

      push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        max: 14,
        size: cell * 0.55,
        color: fire ? '#FFE14A' : set.colors[0]!,
        kind: 'flash',
      })
      push({
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        max: 22,
        size: cell * 0.2,
        color: fire ? '#FF6A00' : set.colors[1] ?? set.colors[0]!,
        kind: 'shock',
      })
    }

    if (fire) {
      for (let i = 0; i < 28; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 2.8 + Math.random() * 7
        push({
          x: 360 + (Math.random() - 0.5) * 40,
          y: 360 + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.4,
          max: 40 + Math.random() * 28,
          size: 5 + Math.random() * 9,
          color: FIRE[i % FIRE.length]!,
          kind: i % 3 === 0 ? 'smoke' : 'ember',
        })
      }
    }

    particles.current.push(...spawn)
  }, [burst, equipped, cell, gap, heat])

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
        p.rot += p.spin
        p.life -= 1 / p.max
        const t = Math.max(0, p.life)

        if (p.kind === 'spark') {
          p.vy += 0.16
          p.vx *= 0.985
          ctx.globalCompositeOperation = 'lighter'
          ctx.strokeStyle = hexAlpha(p.color, t)
          ctx.lineWidth = p.size
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 2.4, p.y - p.vy * 2.4)
          ctx.stroke()
        } else if (p.kind === 'ember') {
          p.vy += 0.05
          p.vx *= 0.99
          ctx.globalCompositeOperation = 'lighter'
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1.4 + (1 - t)))
          g.addColorStop(0, hexAlpha('#FFF6D8', t))
          g.addColorStop(0.35, hexAlpha(p.color, t * 0.95))
          g.addColorStop(1, hexAlpha(p.color, 0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (1.2 + (1 - t) * 0.4), 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === 'smoke') {
          p.vy -= 0.012
          p.vx *= 0.97
          p.size += 0.18
          ctx.globalCompositeOperation = 'source-over'
          ctx.fillStyle = hexAlpha(p.color, t * 0.28)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.kind === 'debris') {
          p.vy += 0.22
          ctx.globalCompositeOperation = 'source-over'
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.globalAlpha = t
          ctx.fillStyle = p.color
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
          ctx.fillStyle = 'rgba(255,255,255,0.35)'
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size * 0.4, p.size * 0.35)
          ctx.restore()
        } else if (p.kind === 'flash') {
          ctx.globalCompositeOperation = 'lighter'
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * (1.6 - t))
          g.addColorStop(0, hexAlpha('#FFFFFF', t * 0.9))
          g.addColorStop(0.4, hexAlpha(p.color, t * 0.55))
          g.addColorStop(1, hexAlpha(p.color, 0))
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (1.8 - t), 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.globalCompositeOperation = 'lighter'
          ctx.strokeStyle = hexAlpha(p.color, t * 0.7)
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size + (1 - t) * 28, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  return <canvas className="fx-canvas" ref={canvasRef} width={720} height={720} />
}
