import type { BlockSkinId, Piece } from '../game/types'
import { fruitForColor } from '../game/shop'

type Props = {
  piece: Piece
  cell: number
  gap?: number
  className?: string
  skin?: BlockSkinId
}

export default function PieceView({ piece, cell, gap = 3, className, skin = 'neon' }: Props) {
  return (
    <div
      className={`piece ${className ?? ''}`}
      style={{
        gridTemplateColumns: `repeat(${piece.cols}, ${cell}px)`,
        gap,
      }}
    >
      {Array.from({ length: piece.rows * piece.cols }, (_, i) => {
        const r = Math.floor(i / piece.cols)
        const c = i % piece.cols
        const on = piece.cells.some(([pr, pc]) => pr === r && pc === c)
        return (
          <div
            key={i}
            className={`p-cell ${on ? `filled skin-${skin}` : ''}`}
            data-fruit={on && skin === 'meyve' ? fruitForColor(piece.color) : undefined}
            style={{
              width: cell,
              height: cell,
              background: on ? piece.color : 'transparent',
              boxShadow: on ? `0 0 8px ${piece.color}aa` : 'none',
            }}
          />
        )
      })}
    </div>
  )
}
