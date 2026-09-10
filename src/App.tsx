import { useEffect, useRef, useState } from 'react'
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
import { freshlyUnlocked, normalizeProgress } from './game/progress'
import { openMysteryBox } from './game/shop'
import type { BlastSetId, BlockSkinId, Progress, TabId } from './game/types'

export default function App() {
  const [account, setAccount] = useState<Account>(() => ensureLocalProfile())
  const accountRef = useRef(account)
  const [tab, setTab] = useState<TabId>('play')
  const [mood, setMood] = useState('calm')

  useEffect(() => {
    accountRef.current = account
  }, [account])

  useEffect(() => {
    setMuted(account.progress.muted)
  }, [account.progress.muted])

  function patch(partial: Partial<Progress>) {
    setAccount((current) => {
      const next = normalizeProgress({ ...current.progress, ...partial })
      const progress = { ...next, unlocked: freshlyUnlocked(next) }
      return saveProgress(current, progress)
    })
  }

  function equip(id: BlastSetId) {
    if (!account.progress.unlocked.includes(id)) return
    patch({ equipped: id })
  }

  function equipSkin(id: BlockSkinId) {
    if (!account.progress.skins.includes(id)) return
    patch({ equippedSkin: id })
  }

  function openBox() {
    const current = accountRef.current
    const result = openMysteryBox(current.progress)
    if (result.ok) {
      const next = saveProgress(current, result.progress)
      accountRef.current = next
      setAccount(next)
    }
    return result
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
          <CrateScreen
            progress={account.progress}
            onEquip={equip}
            onEquipSkin={equipSkin}
            onOpenBox={openBox}
          />
        </div>
        <BottomNav tab={tab} onChange={setTab} />
      </div>
    </div>
  )
}
