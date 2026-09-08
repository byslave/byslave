import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import CrateScreen from './screens/CrateScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import PlayScreen from './screens/PlayScreen'
import { freshlyUnlocked, loadProgress, saveProgress } from './game/progress'
import type { BlastSetId, Progress, TabId } from './game/types'

export default function App() {
  const [tab, setTab] = useState<TabId>('play')
  const [progress, setProgress] = useState<Progress>(() => loadProgress())

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  function patch(partial: Partial<Progress>) {
    setProgress((p) => {
      const next = { ...p, ...partial }
      return { ...next, unlocked: freshlyUnlocked(next) }
    })
  }

  function equip(id: BlastSetId) {
    if (!progress.unlocked.includes(id)) return
    patch({ equipped: id })
  }

  return (
    <div className="stage">
      <div className="phone">
        <div className={`pane ${tab === 'play' ? 'show' : ''}`}>
          <PlayScreen progress={progress} onProgress={patch} />
        </div>
        <div className={`pane ${tab === 'ranks' ? 'show' : ''}`}>
          <LeaderboardScreen progress={progress} />
        </div>
        <div className={`pane ${tab === 'crate' ? 'show' : ''}`}>
          <CrateScreen progress={progress} onEquip={equip} />
        </div>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  )
}
