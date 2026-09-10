import { useState } from 'react'
import {
  bindEmail,
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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const saved = listAccounts().filter((a) => !a.guest)

  function submit() {
    unlockAudio()
    const result = bindEmail(email, password, name, progress)
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
        <p>Sıralamaya e-posta ile bağlan. Skorun ve kutuların burada kalır.</p>
      </div>

      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
      <label className="field">
        <span>E-POSTA</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nova@neonpatlat.com"
          type="email"
          autoComplete="email"
          inputMode="email"
        />
      </label>
      <label className="field">
        <span>ŞİFRE</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="en az 4 karakter"
          type="password"
          autoComplete="current-password"
        />
      </label>
      <label className="field">
        <span>OYUNCU ADI (yeni hesap)</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nova"
          autoComplete="username"
          maxLength={16}
        />
      </label>
      {error ? (
        <p className="login-error">{error}</p>
      ) : (
        <p className="login-hint">Yeni e-posta hesap açar. Kayıtlı e-posta giriş yapar.</p>
      )}

      <button className="btn primary" type="submit">
        Lige bağlan
      </button>
      </form>

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
                {account.email ? <small> {account.email}</small> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
