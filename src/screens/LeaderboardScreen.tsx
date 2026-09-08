import { useMemo, useState, type CSSProperties } from 'react'
import { formatScore } from '../game/engine'
import { friendBoard, weekResetLabel, worldBoard } from '../game/progress'
import type { Progress } from '../game/types'

type Props = { progress: Progress }

export default function LeaderboardScreen({ progress }: Props) {
  const [tab, setTab] = useState<'friends' | 'world'>('world')
  const reset = weekResetLabel()
  const rows = useMemo(
    () => (tab === 'friends' ? friendBoard(progress) : worldBoard(progress)),
    [tab, progress],
  )
  const youIndex = rows.findIndex((r) => r.you)
  const rank = youIndex + 1
  const above = youIndex > 0 ? rows[youIndex - 1] : null
  const need = above ? Math.max(0, above.score - progress.best + 10) : 0
  const ring = Math.min(100, Math.round((progress.best / Math.max(above?.score ?? progress.best, 1)) * 100))

  return (
    <section className="screen">
      <div className="league">
        <h1>REAKTÖR LİGİ HAFTALIK YARIŞ</h1>
        <div className="sub">Sıfırlanmaya {reset.label}</div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'friends' ? 'on' : ''}`} onClick={() => setTab('friends')}>
          Arkadaşlar
        </button>
        <button className={`tab ${tab === 'world' ? 'on' : ''}`} onClick={() => setTab('world')}>
          Dünya
        </button>
      </div>

      <div className="you-card">
        <div className="ring" style={{ '--p': `${ring}%` } as CSSProperties}>
          <span>#{rank || '—'}</span>
        </div>
        <div>
          <h3>
            #{rank} {progress.playerName.toUpperCase()}
          </h3>
          <div className="badge">NEON RÜTBE</div>
          <p className="climb">
            {above
              ? `${formatScore(need)} puan daha · #${rank - 1} ${above.name}`
              : 'Lig zirvesindesin'}
          </p>
        </div>
      </div>

      <div className="list-head">
        <span>Yarışçılar</span>
        <span className="live">CANLI</span>
      </div>
      <div className="ranks">
        {rows.map((row, i) => (
          <div className={`rank ${row.you ? 'you' : ''}`} key={row.name}>
            <div className="pos">#{i + 1}</div>
            <div>
              <div className="name">{row.you ? `${row.name} (sen)` : row.name}</div>
              <div className="meta">KOMBO x{Math.max(row.combo, 0)}</div>
            </div>
            <div className="pts">{formatScore(row.score)}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
