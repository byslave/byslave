import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import CrateScreen from './screens/CrateScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import PlayScreen from './screens/PlayScreen'
import {
  ensureLocalProfile,
  ranked,
  saveProgress,
  unbindLeague,
  type Account,
} from './game/auth'
import { setMuted, unlockAudio } from './game/audio'
import { freshlyUnlocked } from './game/progress'
import type { BlastSetId, Progress, TabId } from './game/types'

export default function App() {
  const [account, setAccount] = useState<Account>(() => ensureLocalProfile())
  const [tab, setTab] = useState<TabId>('play')
  const [mood, setMood] = useState('calm')

  useEffect(() => {
    setMuted(account.progress.muted)
  }, [account.progress.muted])

  function patch(partial: Partial<Progress>) {
    setAccount((current) => {
      const next = { ...current.progress, ...partial }
      const progress = { ...next, unlocked: freshlyUnlocked(next) }
      return saveProgress(current, progress)
    })
  }

  function equip(id: BlastSetId) {
    if (!account.progress.unlocked.includes(id)) return
    patch({ equipped: id })
  }

  return (
    <div className="stage" data-mood={mood} onPointerDown={unlockAudio}>
      <div className="phone" data-mood={mood}>
        <div className={`pane ${tab === 'play' ? 'show' : ''}`}>
          <PlayScreen progress={account.progress} onProgress={patch} onMood={setMood} />
        </div>
        <div className={`pane ${tab === 'ranks' ? 'show' : ''}`}>
          <LeaderboardScreen
            progress={account.progress}
            ranked={ranked(account)}
            onBound={setAccount}
            onUnbind={() => setAccount(unbindLeague(account.progress))}
          />
        </div>
        <div className={`pane ${tab === 'crate' ? 'show' : ''}`}>
          <CrateScreen progress={account.progress} onEquip={equip} />
        </div>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  )
}
