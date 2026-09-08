import { useState } from 'react'
import {
  bindLeague,
  listAccounts,
  resumeRanked,
  type Account,
} from '../game/auth'
import { sfxLogin, sfxTap, unlockAudio } from '../game/audio'
import type { Progress } from '../game/types'

type Props = {
  progress: Progress
  onBound: (account: Account) => void
}

export default function LoginScreen({ progress, onBound }: Props) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const saved = listAccounts().filter((a) => !a.guest)

  function submit() {
    unlockAudio()
    const result = bindLeague(name, pin, progress)
    if (result.ok === false) {
      setError(result.error)
      sfxTap()
      return
    }
    sfxLogin()
    onBound(result.account)
  }

  return (
    <section className="screen login">
      <div className="login-hero">
        <div className="login-cubes" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <h1>REAKTÖR LİGİ</h1>
        <p>Sıralamaya girmek için hesabını bağla. Skorun burada kalır.</p>
      </div>

      <label className="field">
        <span>OYUNCU ADI</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova"
          autoComplete="username"
          maxLength={16}
        />
      </label>
      <label className="field">
        <span>4 HANELİ PIN</span>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          inputMode="numeric"
          autoComplete="off"
        />
      </label>
      {error ? (
        <p className="login-error">{error}</p>
      ) : (
        <p className="login-hint">Yeni isim lig hesabı açar, kayıtlı isim giriş yapar.</p>
      )}

      <button className="btn primary" onClick={submit}>
        Lige bağlan
      </button>

      {saved.length > 0 ? (
        <div className="saved">
          <div className="saved-label">Kayıtlı lig profilleri</div>
          <div className="saved-row">
            {saved.map((account) => (
              <button
                key={account.id}
                className="chip"
                onClick={() => {
                  unlockAudio()
                  sfxTap()
                  const next = resumeRanked(account.id, progress)
                  if (next) {
                    sfxLogin()
                    onBound(next)
                  }
                }}
              >
                {account.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
