import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import BlastFx, { type Burst } from '../components/BlastFx'
import PieceView from '../components/PieceView'
import { sfxClear, sfxCombo, sfxFall, sfxGo, sfxLogin, sfxOver, sfxPerfect, sfxPlace, sfxReady, sfxTap, sfxTick, unlockAudio } from '../game/audio'
import {
  anyTrayFits,
  canPlace,
  canPlaceAnywhere,
  demoNearClear,
  emptyGrid,
  formatScore,
  gridEmpty,
  placePiece,
  rollTray,
} from '../game/engine'
import { GRID_SIZE, type Grid, type Piece, type PlaceResult, type Progress } from '../game/types'
import {
  nextStage,
  remapGrid,
  remapPiece,
  stageForScore,
  stageProgress,
  STAGES,
  type ArcadeStage,
} from '../game/stages'
import { clearStamp } from '../game/juice'

type Props = {
  progress: Progress
  onProgress: (partial: Partial<Progress>) => void
  onMood: (mood: string) => void
}

type Drag = {
  index: number
  piece: Piece
  x: number
  y: number
  lift: number
  hover: { row: number; col: number; valid: boolean } | null
}

type ScorePop = { id: number; x: number; y: number; text: string; kind: 'pts' | 'combo' }

function buzz(style: 'light' | 'medium' | 'heavy' = 'light') {
  try {
    void import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      const map = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }
      void Haptics.impact({ style: map[style] })
    })
  } catch {
    /* web */
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function bootMatch() {
  const demo = new URLSearchParams(window.location.search).get('demo')
  if (demo === 'patlat' || demo === 'kademe') {
    return { ...demoNearClear(), score: demo === 'kademe' ? 760 : 0 }
  }
  const grid = emptyGrid()
  return { grid, tray: rollTray(Math.random, 12, grid, STAGES[0]!.palette), score: 0 }
}

export default function PlayScreen({ progress, onProgress, onMood }: Props) {
  const [boot] = useState(bootMatch)
  const [grid, setGrid] = useState<Grid>(boot.grid)
  const [tray, setTray] = useState<Array<Piece | null>>(boot.tray)
  const [score, setScore] = useState(boot.score)
  const [combo, setCombo] = useState(0)
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [burst, setBurst] = useState<Burst | null>(null)
  const [clearing, setClearing] = useState<{ rows: number[]; cols: number[] } | null>(null)
  const [falling, setFalling] = useState<Record<string, number> | null>(null)
  const [banner, setBanner] = useState<ArcadeStage | null>(null)
  const [shake, setShake] = useState(0)
  const [flash, setFlash] = useState(false)
  const [pops, setPops] = useState<ScorePop[]>([])
  const [fresh, setFresh] = useState<Set<string>>(() => new Set())
  const [scoreBump, setScoreBump] = useState(false)
  const [comboTick, setComboTick] = useState(0)
  const [stamp, setStamp] = useState<string | null>(null)
  const [stampTick, setStampTick] = useState(0)
  const [intro, setIntro] = useState<'ready' | 'go' | null>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('demo')
      ? null
      : 'ready',
  )
  const [shownScore, setShownScore] = useState(boot.score)
  const [continueLeft, setContinueLeft] = useState<number | null>(null)
  const [trayPop, setTrayPop] = useState(false)
  const stage = stageForScore(score)
  const upcoming = nextStage(stage)
  const emptyRef = useRef(gridEmpty(boot.grid))
  const wrapRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const gridRef = useRef(grid)
  const cellRef = useRef(36)
  const burstId = useRef(1)
  const popId = useRef(1)
  const busyRef = useRef(false)
  const playId = useRef(0)
  const shakeTimer = useRef(0)
  const flashTimer = useRef(0)
  const freshTimer = useRef(0)
  const bumpTimer = useRef(0)
  const stampTimer = useRef(0)
  const trayTimer = useRef(0)
  const shownRef = useRef(boot.score)
  const [cell, setCell] = useState(36)
  const gap = 5

  useEffect(() => {
    return () => {
      document.body.classList.remove('is-dragging')
      window.clearTimeout(shakeTimer.current)
      window.clearTimeout(flashTimer.current)
      window.clearTimeout(stampTimer.current)
      window.clearTimeout(trayTimer.current)
    }
  }, [])

  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  useEffect(() => {
    cellRef.current = cell
  }, [cell])

  useEffect(() => {
    if (!intro) return
    if (intro === 'ready') {
      sfxReady()
      const t = window.setTimeout(() => setIntro('go'), 620)
      return () => window.clearTimeout(t)
    }
    sfxGo()
    const t = window.setTimeout(() => setIntro(null), 520)
    return () => window.clearTimeout(t)
  }, [intro])

  useEffect(() => {
    const from = shownRef.current
    const to = score
    if (from === to) return
    const t0 = performance.now()
    const dur = Math.min(480, 140 + Math.abs(to - from) * 0.05)
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur)
      const next = Math.round(from + (to - from) * p)
      shownRef.current = next
      setShownScore(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [score])

  useEffect(() => {
    if (!over) return
    const id = window.setInterval(() => {
      setContinueLeft((n) => {
        if (n == null || n <= 1) {
          window.clearInterval(id)
          return 0
        }
        if (n <= 4) sfxTick()
        return n - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [over])

  useEffect(() => {
    const empty = gridEmpty(grid)
    if (empty && !emptyRef.current) sfxLogin()
    emptyRef.current = empty
    onMood(empty ? `${stage.id}-void` : stage.id)
  }, [grid, stage.id, onMood])

  const measure = useCallback(() => {
    const el = wrapRef.current
    if (!el) return
    const pad = 24
    const avail = Math.min(el.clientWidth, el.clientHeight) - pad
    const next = Math.floor((avail - gap * 7) / 8)
    if (next >= 22) setCell(next)
  }, [])

  useEffect(() => {
    measure()
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  function restart() {
    playId.current += 1
    busyRef.current = false
    const nextGrid = emptyGrid()
    setGrid(nextGrid)
    setTray(rollTray(Math.random, 12, nextGrid, STAGES[0]!.palette))
    setScore(0)
    setCombo(0)
    setOver(false)
    setPaused(false)
    setFalling(null)
    setClearing(null)
    setDragState(null)
    setBanner(null)
    setShake(0)
    setFlash(false)
    setPops([])
    setFresh(new Set())
    setScoreBump(false)
    setStamp(null)
    setIntro('ready')
    shownRef.current = 0
    setShownScore(0)
    setContinueLeft(null)
    setTrayPop(true)
    window.clearTimeout(trayTimer.current)
    trayTimer.current = window.setTimeout(() => setTrayPop(false), 420)
    emptyRef.current = true
    sfxTap()
    onProgress({ gamesPlayed: progress.gamesPlayed + 1 })
  }

  function setDragState(next: Drag | null) {
    dragRef.current = next
    setDrag(next)
    document.body.classList.toggle('is-dragging', next !== null)
  }

  function punch(intensity: number) {
    setShake(intensity)
    setFlash(true)
    window.clearTimeout(shakeTimer.current)
    window.clearTimeout(flashTimer.current)
    shakeTimer.current = window.setTimeout(() => setShake(0), 360)
    flashTimer.current = window.setTimeout(() => setFlash(false), 150)
  }

  function bumpScore() {
    setScoreBump(true)
    window.clearTimeout(bumpTimer.current)
    bumpTimer.current = window.setTimeout(() => setScoreBump(false), 360)
  }

  function markFresh(piece: Piece, row: number, col: number) {
    const keys = new Set(piece.cells.map(([pr, pc]) => `${row + pr}:${col + pc}`))
    setFresh(keys)
    window.clearTimeout(freshTimer.current)
    freshTimer.current = window.setTimeout(() => setFresh(new Set()), 280)
  }

  function showStamp(text: string) {
    setStamp(text)
    setStampTick((n) => n + 1)
    window.clearTimeout(stampTimer.current)
    stampTimer.current = window.setTimeout(() => setStamp(null), 1100)
  }

  function spawnPop(text: string, kind: ScorePop['kind'], row: number, col: number) {
    const board = boardRef.current
    const wrap = wrapRef.current
    if (!board || !wrap) return
    const br = board.getBoundingClientRect()
    const wr = wrap.getBoundingClientRect()
    const stride = cellRef.current + gap
    const x = br.left - wr.left + (col + 0.5) * stride
    const y = br.top - wr.top + (row + 0.5) * stride
    const id = popId.current++
    setPops((list) => [...list, { id, x, y, text, kind }])
    window.setTimeout(() => setPops((list) => list.filter((p) => p.id !== id)), 1400)
  }

  function hoverAt(clientX: number, clientY: number, piece: Piece, lift: number) {
    const el = boardRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const size = cellRef.current
    const stride = size + gap
    const originX = clientX - (piece.cols * stride) / 2
    const originY = lift > 0
      ? clientY - piece.rows * stride - lift
      : clientY - (piece.rows * stride) / 2
    const col = Math.round((originX - rect.left) / stride)
    const row = Math.round((originY - rect.top) / stride)
    if (row < 0 || col < 0 || row >= GRID_SIZE || col >= GRID_SIZE) {
      if (row < -2 || col < -2 || row > GRID_SIZE + 1 || col > GRID_SIZE + 1) return null
      return { row, col, valid: false }
    }
    return { row, col, valid: canPlace(gridRef.current, piece, row, col) }
  }

  function pickHover(clientX: number, clientY: number, piece: Piece, lift: number) {
    const lifted = hoverAt(clientX, clientY, piece, lift)
    const direct = hoverAt(clientX, clientY, piece, 0)
    const value = (h: { row: number; col: number; valid: boolean } | null) => {
      if (!h?.valid) return -1
      const result = placePiece(gridRef.current, piece, h.row, h.col, 0)
      if (!result) return -1
      return result.lines * 1000 + result.placedCells
    }
    return value(direct) > value(lifted) ? direct : lifted
  }

  function onDown(index: number, piece: Piece, e: PointerEvent<HTMLDivElement>) {
    if (paused || over || busyRef.current || intro) return
    unlockAudio()
    const lift = e.pointerType === 'touch' ? 56 : 0
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      index,
      piece,
      x: e.clientX,
      y: e.clientY,
      lift,
      hover: pickHover(e.clientX, e.clientY, piece, lift),
    })
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const current = dragRef.current
    if (!current) return
    setDragState({
      ...current,
      x: e.clientX,
      y: e.clientY,
      hover: pickHover(e.clientX, e.clientY, current.piece, current.lift),
    })
  }

  function settleTray(finalGrid: Grid, nextTray: Array<Piece | null>, palette: string[]) {
    let trayNext = nextTray
    if (trayNext.every((p) => p === null)) {
      trayNext = rollTray(Math.random, 12, finalGrid, palette)
      setTrayPop(true)
      window.clearTimeout(trayTimer.current)
      trayTimer.current = window.setTimeout(() => setTrayPop(false), 420)
    }
    setTray(trayNext)
    if (!anyTrayFits(finalGrid, trayNext)) {
      setOver(true)
      setContinueLeft(9)
      sfxOver()
    }
  }

  function promote(from: ArcadeStage, to: ArcadeStage, board: Grid, nextTray: Array<Piece | null>) {
    const gridNext = remapGrid(board, from.palette, to.palette)
    const trayNext = nextTray.map((piece) => (piece ? remapPiece(piece, from.palette, to.palette) : piece))
    setBanner(to)
    punch(3)
    sfxLogin()
    window.setTimeout(() => setBanner(null), 1700)
    return { grid: gridNext, tray: trayNext }
  }

  async function playBlast(result: PlaceResult, nextTray: Array<Piece | null>, nextScore: number) {
    const token = ++playId.current
    const live = () => token === playId.current
    busyRef.current = true
    setGrid(result.placedGrid)
    sfxPlace()
    buzz('light')

    if (result.events.length > 0) {
      await wait(80)
      for (const ev of result.events) {
        if (!live()) return
        if (ev.type === 'clear') {
          setCombo(ev.combo)
          setComboTick((n) => n + 1)
          setClearing({ rows: ev.rows, cols: ev.cols })
          setBurst({
            id: burstId.current++,
            rows: ev.rows,
            cols: ev.cols,
            combo: ev.combo,
          })
          const pts = ev.lines * ev.lines * 100 * Math.max(1, ev.combo)
          const popR = ev.rows[0] ?? 3
          const popC = ev.cols[0] ?? 3
          spawnPop(`+${pts}`, 'pts', popR, popC)
          if (ev.combo >= 2) spawnPop(`KOMBO x${ev.combo}`, 'combo', Math.min(popR + 1, 7), popC)
          const perfect = gridEmpty(ev.grid)
          showStamp(clearStamp(ev.lines, perfect))
          punch(Math.min(4, Math.max(1, perfect ? 4 : ev.combo)))
          sfxClear(ev.combo)
          if (perfect) sfxPerfect()
          else if (ev.combo >= 3) sfxCombo(ev.combo)
          buzz(perfect || ev.combo >= 3 ? 'heavy' : 'medium')
          await wait(220)
          if (!live()) return
          setGrid(ev.grid)
          setClearing(null)
        } else {
          const drop: Record<string, number> = {}
          for (const move of ev.moves) drop[`${move.toR}:${move.toC}`] = move.toR - move.fromR
          setFalling(drop)
          setGrid(ev.grid)
          sfxFall()
          await wait(200)
          if (!live()) return
          setFalling(null)
        }
      }
    }

    if (!live()) return
    const from = stageForScore(score)
    const to = stageForScore(nextScore)
    let board = result.grid
    let trayNext = nextTray
    if (to.level > from.level) {
      const promoted = promote(from, to, board, trayNext)
      board = promoted.grid
      trayNext = promoted.tray
    }
    setGrid(board)
    setScore(nextScore)
    bumpScore()
    setCombo(result.events.length === 0 ? 0 : result.combo)
    settleTray(board, trayNext, to.palette)
    busyRef.current = false
  }

  function onUp() {
    const current = dragRef.current
    if (!current) return
    const { hover, piece, index } = current
    setDragState(null)
    if (!hover?.valid || busyRef.current) return
    const result = placePiece(gridRef.current, piece, hover.row, hover.col, combo)
    if (!result) return

    const nextTray = tray.map((p, i) => (i === index ? null : p))
    const nextScore = score + result.scoreGain
    markFresh(piece, hover.row, hover.col)
    spawnPop(`+${result.placedCells * 10}`, 'pts', hover.row, hover.col)
    onProgress({
      best: Math.max(progress.best, nextScore),
      maxCombo: Math.max(progress.maxCombo, result.combo),
    })
    void playBlast(result, nextTray, nextScore)
  }

  const preview = useMemo(() => {
    const map = new Set<string>()
    if (!drag?.hover) return map
    for (const [pr, pc] of drag.piece.cells) {
      map.add(`${drag.hover.row + pr}:${drag.hover.col + pc}`)
    }
    return map
  }, [drag])

  const blastHint = useMemo(() => {
    const rows = new Set<number>()
    const cols = new Set<number>()
    if (!drag?.hover?.valid) return { rows, cols, hot: false }
    const result = placePiece(grid, drag.piece, drag.hover.row, drag.hover.col, combo)
    const ev = result?.events.find((e) => e.type === 'clear')
    if (ev && ev.type === 'clear') {
      for (const r of ev.rows) rows.add(r)
      for (const c of ev.cols) cols.add(c)
    }
    return { rows, cols, hot: rows.size + cols.size > 0 }
  }, [drag, combo, grid])

  const almost = useMemo(() => {
    const rows = new Set<number>()
    const cols = new Set<number>()
    for (let r = 0; r < GRID_SIZE; r++) {
      let n = 0
      for (let c = 0; c < GRID_SIZE; c++) if (grid[r][c]) n += 1
      if (n === GRID_SIZE - 1) rows.add(r)
    }
    for (let c = 0; c < GRID_SIZE; c++) {
      let n = 0
      for (let r = 0; r < GRID_SIZE; r++) if (grid[r][c]) n += 1
      if (n === GRID_SIZE - 1) cols.add(c)
    }
    return { rows, cols }
  }, [grid])

  return (
    <section
      className={[
        'screen',
        'play',
        drag ? 'dragging' : '',
        shake ? `shake-${shake}` : '',
        flash ? 'flashing' : '',
        combo >= 2 ? 'heating' : '',
        blastHint.hot ? 'armed' : '',
        intro ? 'introing' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="topbar">
        <div className={`stat ${scoreBump ? 'bump' : ''}`}>
          <label>SKOR</label>
          <strong>{formatScore(shownScore)}</strong>
        </div>
        <div className="stat best">
          <label>EN İYİ</label>
          <strong>{formatScore(progress.best)}</strong>
        </div>
        <button
          className="icon-btn"
          aria-label="Duraklat"
          onClick={() => {
            sfxTap()
            setPaused(true)
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </button>
      </header>

      <div className={`kademe-hud ${banner ? 'levelup' : ''}`}>
        <div className="kademe-row">
          <strong>KADEME {stage.level}</strong>
          <span>{stage.name}</span>
        </div>
        <div className="kademe-bar">
          <i style={{ width: `${Math.round(stageProgress(score, stage) * 100)}%` }} />
        </div>
        <small>
          {upcoming
            ? `${formatScore(Math.max(0, upcoming.minScore - score))} puan → ${upcoming.name}`
            : 'MAX KADEME'}
        </small>
      </div>

      <div className="combo-wrap">
        {combo > 0 ? (
          <div key={comboTick} className={`combo punch ${combo >= 3 ? 'hot' : ''}`}>
            KOMBO X{combo}
          </div>
        ) : (
          <div className="combo ghost">{stage.tagline}</div>
        )}
      </div>

      <div className="board-wrap" ref={wrapRef}>
        <div className={`board-card ${gridEmpty(grid) ? 'void' : ''} ${combo >= 2 ? 'hot' : ''} ${blastHint.hot ? 'armed' : ''}`}>
          <div
            className="grid"
            ref={boardRef}
            style={{
              width: cell * 8 + gap * 7,
              height: cell * 8 + gap * 7,
              gap,
              gridTemplateColumns: `repeat(8, ${cell}px)`,
              ['--cell' as string]: `${cell}px`,
            }}
          >
            {grid.flatMap((row, r) =>
              row.map((color, c) => {
                const key = `${r}:${c}`
                const previewing = preview.has(key)
                const fall = falling?.[key]
                const isClear =
                  clearing && (clearing.rows.includes(r) || clearing.cols.includes(c))
                const willBlast = blastHint.rows.has(r) || blastHint.cols.has(c)
                const near = !color && (almost.rows.has(r) || almost.cols.has(c))
                const cls = [
                  'cell',
                  color ? 'filled' : '',
                  color && fresh.has(key) ? 'fresh' : '',
                  isClear ? 'clearing' : '',
                  fall ? 'drop' : '',
                  willBlast ? 'will-blast' : '',
                  near && !willBlast ? 'almost' : '',
                  previewing && drag?.hover?.valid ? 'preview-ok' : '',
                  previewing && drag && !drag.hover?.valid ? 'preview-bad' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <div
                    key={key}
                    className={cls}
                    style={
                      {
                        '--c': previewing ? drag?.piece.color : color ?? 'transparent',
                        '--fall': fall ?? 1,
                      } as CSSProperties
                    }
                  />
                )
              }),
            )}
          </div>
          <BlastFx burst={burst} equipped={progress.equipped} cell={cell} gap={gap} />
          {clearing
            ? clearing.rows.map((r) => (
                <i
                  key={`lr${r}`}
                  className="laser-h"
                  style={{
                    top: 12 + r * (cell + gap) + cell / 2,
                    left: 12,
                    width: cell * 8 + gap * 7,
                  }}
                />
              ))
            : null}
          {clearing
            ? clearing.cols.map((c) => (
                <i
                  key={`lc${c}`}
                  className="laser-v"
                  style={{
                    left: 12 + c * (cell + gap) + cell / 2,
                    top: 12,
                    height: cell * 8 + gap * 7,
                  }}
                />
              ))
            : null}
        </div>
        {pops.map((pop) => (
          <span
            key={pop.id}
            className={`score-pop kind-${pop.kind}`}
            style={{ left: pop.x, top: pop.y }}
          >
            {pop.text}
          </span>
        ))}
      </div>

      <p className="hint">
        {gridEmpty(grid)
          ? 'Reaktör temiz — ışık değişti!'
          : upcoming
            ? 'Bloklar düşer — kademe atla!'
            : 'Ultra kademe — patlatmaya devam!'}
      </p>

      <div className="tray">
        {tray.map((piece, i) => (
          <div
            key={piece?.id ?? `empty-${i}`}
            className={`slot ${piece ? '' : 'empty'} ${piece && !canPlaceAnywhere(grid, piece) ? 'stuck' : ''} ${trayPop && piece ? 'refill' : ''}`}
            onPointerDown={(e) => piece && onDown(i, piece, e)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={() => setDragState(null)}
          >
            {piece ? (
              <PieceView piece={piece} cell={18} className={drag?.index === i ? 'dragging' : ''} />
            ) : null}
          </div>
        ))}
      </div>

      {drag ? (
        <div
          className={`drag-layer ${blastHint.hot ? 'armed' : ''}`}
          style={{
            transform: `translate(${drag.x - (drag.piece.cols * (cell + gap)) / 2}px, ${
              drag.lift > 0
                ? drag.y - drag.piece.rows * (cell + gap) - drag.lift
                : drag.y - (drag.piece.rows * (cell + gap)) / 2
            }px)`,
          }}
        >
          <PieceView piece={drag.piece} cell={cell} gap={gap} />
        </div>
      ) : null}

      {banner ? (
        <div className="kademe-banner">
          <div className="kademe-banner-card">
            <small>KADEME {banner.level}</small>
            <h2>{banner.name}</h2>
            <p>Bloklar ve kabin değişti</p>
          </div>
        </div>
      ) : null}

      {stamp ? (
        <div key={stampTick} className={`stamp ${stamp === 'PERFECT' ? 'perfect' : ''}`}>
          {stamp}
        </div>
      ) : null}

      {intro ? (
        <div className="intro" aria-hidden>
          <strong className={intro}>{intro === 'ready' ? 'READY' : 'GO!'}</strong>
        </div>
      ) : null}

      <div className={`juice-flash ${flash ? 'on' : ''}`} />

      {paused ? (
        <div className="overlay">
          <div className="modal">
            <h2>DURAKLATILDI</h2>
            <p>Reaktör çekirdeği bekliyor.</p>
            <div className="actions">
              <button className="btn primary" onClick={() => setPaused(false)}>
                Devam et
              </button>
              <button
                className="btn ghost"
                onClick={() => onProgress({ muted: !progress.muted })}
              >
                {progress.muted ? 'Sesi aç' : 'Sesi kapat'}
              </button>
              <button className="btn ghost" onClick={restart}>
                Yeniden başla
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {over ? (
        <div className="overlay arcade-over">
          <div className="modal">
            {continueLeft && continueLeft > 0 ? (
              <>
                <h2>DEVAM?</h2>
                <div key={continueLeft} className="continue-count">
                  {continueLeft}
                </div>
                <p>
                  Skor {formatScore(score)} · En iyi {formatScore(progress.best)}
                </p>
              </>
            ) : (
              <>
                <h2>GAME OVER</h2>
                <p>
                  Skor {formatScore(score)} · En iyi {formatScore(progress.best)}
                </p>
              </>
            )}
            <div className="actions">
              <button className="btn primary" onClick={restart}>
                {continueLeft && continueLeft > 0 ? 'Devam et' : 'Tekrar patlat'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
