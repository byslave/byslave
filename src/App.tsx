import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import CrateScreen from './screens/CrateScreen'
import LeaderboardScreen from './screens/LeaderboardScreen'
import LoginScreen from './screens/LoginScreen'
import PlayScreen from './screens/PlayScreen'
import { currentAccount, logout, saveProgress, type Account } from './game/auth'
import { setMuted, unlockAudio } from './game/audio'
import { freshlyUnlocked } from './game/progress'
import type { BlastSetId, Progress, TabId } from './game/types'

export default function App() {
  const [account, setAccount] = useState<Account | null>(() => currentAccount())
  const [tab, setTab] = useState<TabId>('play')

  useEffect(() => {
    setMuted(account?.progress.muted ?? false)
  }, [account?.progress.muted])

  function patch(partial: Partial<Progress>) {
    setAccount((current) => {
      if (!current) return current
      const next = { ...current.progress, ...partial }
      const progress = { ...next, unlocked: freshlyUnlocked(next) }
      return saveProgress(current, progress)
    })
  }

  function equip(id: BlastSetId) {
    if (!account?.progress.unlocked.includes(id)) return
    patch({ equipped: id })
  }

  function signOut() {
    logout()
    setTab('play')
    setAccount(null)
  }

  if (!account) {
    return (
      <div className="stage">
        <div className="phone">
          <LoginScreen onEnter={setAccount} />
        </div>
      </div>
    )
  }

  return (
    <div className="stage" onPointerDown={unlockAudio}>
      <div className="phone">
        <div className={`pane ${tab === 'play' ? 'show' : ''}`}>
          <PlayScreen
            key={account.id}
            progress={account.progress}
            onProgress={patch}
            onLogout={signOut}
          />
        </div>
        <div className={`pane ${tab === 'ranks' ? 'show' : ''}`}>
          <LeaderboardScreen progress={account.progress} />
        </div>
        <div className={`pane ${tab === 'crate' ? 'show' : ''}`}>
          <CrateScreen progress={account.progress} onEquip={equip} />
        </div>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  )
}
