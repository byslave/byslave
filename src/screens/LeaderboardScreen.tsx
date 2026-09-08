import { useMemo, useState, type CSSProperties } from 'react'
import { formatScore } from '../game/engine'
import { friendBoard, weekResetLabel, worldBoard } from '../game/progress'
import { sfxTap } from '../game/audio'
import type { Progress } from '../game/types'
import LoginScreen from './LoginScreen'
import type { Account } from '../game/auth'

type Props = {
  progress: Progress
  ranked: boolean
  onBound: (account: Account) => void
  onUnbind: () => void
}

export default function LeaderboardScreen({ progress, ranked, onBound, onUnbind }: Props) {
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

  if (!ranked) {
    return <LoginScreen progress={progress} onBound={onBound} />
  }

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
      <button
        className="btn ghost unbind"
        onClick={() => {
          sfxTap()
          onUnbind()
        }}
      >
        Lig hesabını ayır
      </button>
    </section>
  )
}
