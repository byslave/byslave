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
import {
  anyTrayFits,
  canPlace,
  emptyGrid,
  formatScore,
  placePiece,
  rollTray,
} from '../game/engine'
import { GRID_SIZE, type Grid, type Piece, type Progress } from '../game/types'

type Props = {
  progress: Progress
  onProgress: (partial: Partial<Progress>) => void
}

type Drag = {
  index: number
  piece: Piece
  x: number
  y: number
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

export default function PlayScreen({ progress, onProgress }: Props) {
  const [grid, setGrid] = useState<Grid>(() => emptyGrid())
  const [tray, setTray] = useState<Array<Piece | null>>(() => rollTray())
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [paused, setPaused] = useState(false)
  const [over, setOver] = useState(false)
  const [drag, setDrag] = useState<Drag | null>(null)
  const [burst, setBurst] = useState<Burst | null>(null)
  const [clearing, setClearing] = useState<{ rows: number[]; cols: number[] } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<Drag | null>(null)
  const burstId = useRef(1)
  const [cell, setCell] = useState(36)
  const gap = 5

  const measure = useCallback(() => {
    const el = boardRef.current
    if (!el) return
    const w = el.clientWidth
    const next = Math.floor((w - gap * 7) / 8)
    if (next > 0) setCell(next)
  }, [])

  useEffect(() => {
    measure()
    const el = boardRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  function restart() {
    const nextGrid = emptyGrid()
    setGrid(nextGrid)
    setTray(rollTray(Math.random, 12, nextGrid))
    setScore(0)
    setCombo(0)
    setOver(false)
    setPaused(false)
    setDragState(null)
    onProgress({ gamesPlayed: progress.gamesPlayed + 1 })
  }

  function setDragState(next: Drag | null) {
    dragRef.current = next
    setDrag(next)
  }

  function hoverAt(clientX: number, clientY: number, piece: Piece) {
    const el = boardRef.current
    if (!el) return null
    const rect = el.getBoundingClientRect()
    const stride = cell + gap
    const originX = clientX - (piece.cols * stride) / 2
    const originY = clientY - piece.rows * stride - 28
    const col = Math.round((originX - rect.left) / stride)
    const row = Math.round((originY - rect.top) / stride)
    if (row < -2 || col < -2 || row > GRID_SIZE || col > GRID_SIZE) return null
    return { row, col, valid: canPlace(grid, piece, row, col) }
  }

  function onDown(index: number, piece: Piece, e: PointerEvent<HTMLDivElement>) {
    if (paused || over) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragState({
      index,
      piece,
      x: e.clientX,
      y: e.clientY,
      hover: hoverAt(e.clientX, e.clientY, piece),
    })
  }

  function onMove(e: PointerEvent<HTMLDivElement>) {
    const current = dragRef.current
    if (!current) return
    setDragState({
      ...current,
      x: e.clientX,
      y: e.clientY,
      hover: hoverAt(e.clientX, e.clientY, current.piece),
    })
  }

  function onUp() {
    const current = dragRef.current
    if (!current) return
    const { hover, piece, index } = current
    setDragState(null)
    if (!hover?.valid) return
    const result = placePiece(grid, piece, hover.row, hover.col, combo)
    if (!result) return

    let nextTray = tray.map((p, i) => (i === index ? null : p))
    const nextScore = score + result.scoreGain
    const nextBest = Math.max(progress.best, nextScore)
    const nextMaxCombo = Math.max(progress.maxCombo, result.combo)

    if (nextTray.every((p) => p === null)) {
      nextTray = rollTray(Math.random, 12, result.grid)
    }
    if (!anyTrayFits(result.grid, nextTray)) setOver(true)

    setGrid(result.grid)
    if (result.clear.lines > 0) {
      setClearing({ rows: result.clear.clearedRows, cols: result.clear.clearedCols })
      setBurst({
        id: burstId.current++,
        rows: result.clear.clearedRows,
        cols: result.clear.clearedCols,
        combo: result.combo,
      })
      buzz('medium')
      window.setTimeout(() => setClearing(null), 220)
    } else {
      buzz('light')
    }

    setTray(nextTray)
    setScore(nextScore)
    setCombo(result.combo)
    onProgress({ best: nextBest, maxCombo: nextMaxCombo })
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
        <button className="icon-btn" aria-label="Duraklat" onClick={() => setPaused(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        </button>
      </header>

      <div className="combo-wrap">
        {combo > 0 ? <div className="combo">KOMBO X{combo}</div> : null}
      </div>

      <div className="board-card">
        <div className="grid" ref={boardRef}>
          {grid.flatMap((row, r) =>
            row.map((color, c) => {
              const key = `${r}:${c}`
              const previewing = preview.has(key)
              const isClear =
                clearing && (clearing.rows.includes(r) || clearing.cols.includes(c))
              const cls = [
                'cell',
                color ? 'filled' : '',
                isClear ? 'clearing' : '',
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
                    } as CSSProperties
                  }
                />
              )
            }),
          )}
        </div>
        <BlastFx burst={burst} equipped={progress.equipped} cell={cell} gap={gap} />
      </div>

      <p className="hint">Parçanı sürükle, satırı patlat!</p>

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
            transform: `translate(${drag.x - (drag.piece.cols * (cell + 3)) / 2}px, ${
              drag.y - drag.piece.rows * (cell + 3) - 36
            }px)`,
          }}
        >
          <PieceView piece={drag.piece} cell={cell} />
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
