import { useState } from 'react'
import { BLAST_SETS, getBlastSet } from '../game/pieces'
import type { BlastSetId, Progress } from '../game/types'

type Props = {
  progress: Progress
  onEquip: (id: BlastSetId) => void
}

function Art({ kind }: { kind: string }) {
  const dots = [
    { l: '18%', t: '20%', c: '#00C8FF', s: 10 },
    { l: '58%', t: '28%', c: '#FF2EC8', s: 8 },
    { l: '34%', t: '62%', c: '#7CFF4A', s: 12 },
    { l: '72%', t: '58%', c: '#FFE14A', s: 7 },
  ]
  return (
    <div className={`art ${kind}`}>
      {dots.map((d, i) => (
        <span
          key={i}
          className="dot"
          style={{ left: d.l, top: d.t, width: d.s, height: d.s, background: d.c }}
        />
      ))}
    </div>
  )
}

export default function CrateScreen({ progress, onEquip }: Props) {
  const featured = getBlastSet(progress.equipped)
  const [flash, setFlash] = useState(false)
  const opened = progress.unlocked.length

  return (
    <section className="screen">
      <div className="crate-head">
        <h1>PATLAMA KASASI</h1>
        <p>Komboların daha çılgın görünsün.</p>
      </div>

      <div className="featured">
        <div className={`preview-art ${flash ? 'clearing' : ''}`}>
          <Art kind={featured.kind} />
        </div>
        <div>
          <h3>{featured.name.toUpperCase()}</h3>
          <div className="tag">{featured.tagline}</div>
          <div className="row-btns">
            <button
              className="btn ghost mini"
              onClick={() => {
                setFlash(true)
                window.setTimeout(() => setFlash(false), 500)
              }}
            >
              Önizle
            </button>
            <button className="btn mini ok">Kuşanıldı</button>
          </div>
        </div>
      </div>

      <div className="sets-title">
        <span>PATLAMA SETLERİ</span>
        <span>
          {opened}/{BLAST_SETS.length} açıldı
        </span>
      </div>

      <div className="sets">
        {BLAST_SETS.map((set) => {
          const unlocked = progress.unlocked.includes(set.id)
          const on = progress.equipped === set.id
          return (
            <button
              key={set.id}
              className={`set ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => unlocked && onEquip(set.id)}
            >
              {!unlocked ? <span className="lock">🔒</span> : on ? <span className="lock">✓</span> : null}
              <Art kind={set.kind} />
              <h4>{set.name}</h4>
              <span>{unlocked ? set.tagline : set.unlock}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
