import { useState } from 'react'
import { BLAST_SETS, getBlastSet } from '../game/pieces'
import { BLOCK_SKINS, BOX_COST, getSkin, type BoxResult } from '../game/shop'
import type { BlastSetId, BlockSkinId, Progress } from '../game/types'
import { sfxLogin, sfxOver, sfxTap, unlockAudio } from '../game/audio'

type Props = {
  progress: Progress
  onEquip: (id: BlastSetId) => void
  onEquipSkin: (id: BlockSkinId) => void
  onOpenBox: () => BoxResult
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

export default function CrateScreen({ progress, onEquip, onEquipSkin, onOpenBox }: Props) {
  const featured = getBlastSet(progress.equipped)
  const [flash, setFlash] = useState(false)
  const [spinning, setSpinning] = useState(false)
  const [reveal, setReveal] = useState<Extract<BoxResult, { ok: true }> | null>(null)
  const [error, setError] = useState('')
  const opened = progress.unlocked.length
  const ownedSkins = progress.skins.length
  const currentSkin = getSkin(progress.equippedSkin)

  function openBox() {
    unlockAudio()
    if (spinning) return
    const result = onOpenBox()
    if (result.ok === false) {
      setError(result.error)
      sfxOver()
      return
    }
    setError('')
    setSpinning(true)
    sfxTap()
    window.setTimeout(() => {
      setSpinning(false)
      setReveal(result)
      sfxLogin()
    }, 720)
  }

  return (
    <section className="screen crate-screen">
      <div className="crate-head">
        <h1>GİZEMLİ KUTU</h1>
        <p>Skorun Neon jeton olur. Kutu aç, altın / gümüş / meyve / RGB blok düşür.</p>
      </div>

      <div className="wallet">
        <strong>⚡ {progress.coins}</strong>
        <span>Neon jeton</span>
      </div>

      <button
        className={`mystery ${spinning ? 'spin' : ''}`}
        onClick={openBox}
        disabled={spinning || progress.coins < BOX_COST}
      >
        <div className="mystery-box" aria-hidden>
          <b>?</b>
        </div>
        <div>
          <h3>KUTUYU AÇ</h3>
          <p>{BOX_COST}⚡ · altın, gümüş, meyve, RGB</p>
        </div>
      </button>
      {error ? <p className="login-error">{error}</p> : null}

      <div className="sets-title">
        <span>BLOK STİLLERİ</span>
        <span>
          {ownedSkins}/{BLOCK_SKINS.length} · {currentSkin.emoji} {currentSkin.name}
        </span>
      </div>
      <div className="sets skins">
        {BLOCK_SKINS.map((skin) => {
          const unlocked = progress.skins.includes(skin.id)
          const on = progress.equippedSkin === skin.id
          return (
            <button
              key={skin.id}
              className={`set ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}`}
              onClick={() => unlocked && onEquipSkin(skin.id)}
            >
              {!unlocked ? <span className="lock">🔒</span> : on ? <span className="lock">✓</span> : null}
              <div className={`skin-preview skin-${skin.id}`}>{skin.emoji}</div>
              <h4>{skin.name}</h4>
              <span>{unlocked ? skin.tagline : `${skin.rarity.toUpperCase()} kutu düşüşü`}</span>
            </button>
          )
        })}
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

      {reveal ? (
        <div className="overlay">
          <div className="modal">
            <p className="reveal-emoji">{reveal.drop.emoji}</p>
            <h2>{reveal.duplicate ? 'TEKRAR' : 'YENİ BLOK'}</h2>
            <p>
              {reveal.duplicate
                ? `${reveal.drop.name} zaten sende · +35⚡ iade`
                : `${reveal.drop.name} kuşanıldı — ${reveal.drop.tagline}`}
            </p>
            <div className="actions">
              <button className="btn primary" onClick={() => setReveal(null)}>
                Tamam
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
