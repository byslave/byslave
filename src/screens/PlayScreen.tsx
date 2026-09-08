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
import { sfxClear, sfxFall, sfxLogin, sfxOver, sfxPlace, sfxTap, unlockAudio } from '../game/audio'
import {
  anyTrayFits,
  canPlace,
  demoNearClear,
  emptyGrid,
  formatScore,
  gridEmpty,
  placePiece,
  rollTray,
} from '../game/engine'
import { GRID_SIZE, type Grid, type Piece, type PlaceResult, type Progress } from '../game/types'

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

function buzz(style: 'light' | 'medium' = 'light') {
  try {
    void import('@capacitor/haptics').then(({ Haptics, ImpactStyle }) => {
      void Haptics.impact({
        style: style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light,
      })
    })
  } catch {
    /* web */
  }
}

function wait(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function bootMatch() {
  if (new URLSearchParams(window.location.search).get('demo') === 'patlat') {
    return demoNearClear()
  }
  const grid = emptyGrid()
  return { grid, tray: rollTray(Math.random, 12, grid) }
}

export default function PlayScreen({ progress, onProgress, onMood }: Props) {
  const [boot] = useState(bootMatch)
  const [grid, setGrid] = useState<Grid>(boot.grid)
  const [tray, setTray] = useState<Array<Piece | null>>(boot.tray)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [burst, setBurst] = useState<Burst | null>(null)
  const [clearing, setClearing] = useState<{ rows: number[]; cols: number[] } | null>(null)
  const [falling, setFalling] = useState<Record<string, number> | null>(null)
  const [skin, setSkin] = useState(0)
  const emptyRef = useRef(gridEmpty(boot.grid))
  const wrapRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const gridRef = useRef(grid)
  const cellRef = useRef(36)
  const burstId = useRef(1)
  const busyRef = useRef(false)
  const playId = useRef(0)
  const [cell, setCell] = useState(36)
  const gap = 5

  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  useEffect(() => {
    cellRef.current = cell
  }, [cell])

  useEffect(() => {
    const empty = gridEmpty(grid)
    if (empty && !emptyRef.current) {
      setSkin((s) => s + 1)
      sfxLogin()
    }
    emptyRef.current = empty
    if (empty) onMood(`void-${skin % 4}`)
    else if (combo >= 6) onMood('overdrive')
    else if (combo >= 3) onMood('heat')
    else onMood('calm')
  }, [grid, combo, skin, onMood])

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
    setTray(rollTray(Math.random, 12, nextGrid))
    setScore(0)
    setCombo(0)
    setOver(false)
    setPaused(false)
    setFalling(null)
    setClearing(null)
    setDragState(null)
    emptyRef.current = true
    sfxTap()
    onProgress({ gamesPlayed: progress.gamesPlayed + 1 })
  }

  function setDragState(next: Drag | null) {
    dragRef.current = next
    setDrag(next)
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
    if (paused || over || busyRef.current) return
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

  function settleTray(finalGrid: Grid, nextTray: Array<Piece | null>) {
    let trayNext = nextTray
    if (trayNext.every((p) => p === null)) {
      trayNext = rollTray(Math.random, 12, finalGrid)
    }
    setTray(trayNext)
    if (!anyTrayFits(finalGrid, trayNext)) {
      setOver(true)
      sfxOver()
    }
  }

  async function playBlast(result: PlaceResult, nextTray: Array<Piece | null>, nextScore: number) {
    const token = ++playId.current
    const live = () => token === playId.current
    busyRef.current = true
    setGrid(result.placedGrid)
    sfxPlace()
    buzz('light')

    if (result.events.length === 0) {
      setCombo(0)
      setScore(nextScore)
      settleTray(result.grid, nextTray)
      busyRef.current = false
      return
    }

    await wait(80)
    for (const ev of result.events) {
      if (!live()) return
      if (ev.type === 'clear') {
        setCombo(ev.combo)
        setClearing({ rows: ev.rows, cols: ev.cols })
        setBurst({
          id: burstId.current++,
          rows: ev.rows,
          cols: ev.cols,
          combo: ev.combo,
        })
        sfxClear(ev.combo)
        buzz('medium')
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

    if (!live()) return
    setGrid(result.grid)
    setScore(nextScore)
    setCombo(result.combo)
    settleTray(result.grid, nextTray)
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

  return (
    <section className="screen">
      <header className="topbar">
        <div className="stat">
          <label>SKOR</label>
          <strong>{formatScore(score)}</strong>
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

      <div className="combo-wrap">
        {combo > 0 ? <div className="combo">KOMBO X{combo}</div> : null}
      </div>

      <div className="board-wrap" ref={wrapRef}>
        <div className={`board-card ${gridEmpty(grid) ? 'void' : ''} ${combo >= 3 ? 'hot' : ''}`}>
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
                const cls = [
                  'cell',
                  color ? 'filled' : '',
                  isClear ? 'clearing' : '',
                  fall ? 'drop' : '',
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
        </div>
      </div>

      <p className="hint">
        {gridEmpty(grid) ? 'Reaktör temiz — ışık değişti!' : 'Bloklar düşer — zinciri patlat!'}
      </p>

      <div className="tray">
        {tray.map((piece, i) => (
          <div
            key={piece?.id ?? `empty-${i}`}
            className={`slot ${piece ? '' : 'empty'}`}
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
          className="drag-layer"
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
        <div className="overlay">
          <div className="modal">
            <h2>TAHTA KİLİTLENDİ</h2>
            <p>
              Skor {formatScore(score)} · En iyi {formatScore(progress.best)}
            </p>
            <div className="actions">
              <button className="btn primary" onClick={restart}>
                Tekrar patlat
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
