import type { TabId } from '../game/types'

type Props = {
  tab: TabId
  onChange: (tab: TabId) => void
}

export default function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="nav">
      <button className={`nav-btn ${tab === 'play' ? 'active' : ''}`} onClick={() => onChange('play')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="8" height="8" rx="1.5" />
          <rect x="13" y="4" width="8" height="8" rx="1.5" />
          <rect x="3" y="14" width="8" height="8" rx="1.5" />
          <rect x="13" y="14" width="4" height="8" rx="1.5" />
        </svg>
        Oyna
      </button>
      <button className={`nav-btn ${tab === 'ranks' ? 'active' : ''}`} onClick={() => onChange('ranks')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M8 21h8M12 17v4M7 4h10v3a5 5 0 0 1-10 0V4Z" />
          <path d="M7 7H5a3 3 0 0 0 3 3M17 7h2a3 3 0 0 1-3 3" />
        </svg>
        Sıralama
      </button>
      <button className={`nav-btn ${tab === 'crate' ? 'active' : ''}`} onClick={() => onChange('crate')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
          <path d="M3 8 7 3h10l4 5" />
          <path d="M12 8v13" />
        </svg>
        Patlama Kasası
      </button>
    </nav>
  )
}
