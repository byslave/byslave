import { useState } from 'react'
import { enterGuest, enterReactor, listAccounts, switchAccount, type Account } from '../game/auth'
import { sfxLogin, sfxTap, unlockAudio } from '../game/audio'

type Props = {
  onEnter: (account: Account) => void
}

export default function LoginScreen({ onEnter }: Props) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const saved = listAccounts()

  function submit() {
    unlockAudio()
    const result = enterReactor(name, pin)
    if (result.ok === false) {
      setError(result.error)
      sfxTap()
      return
    }
    sfxLogin()
    onEnter(result.account)
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
        <h1>NEONPATLAT</h1>
        <p>Reaktöre bağlan, komboyu büyüt.</p>
      </div>

      <label className="field">
        <span>OYUNCU ADI</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Deniz"
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
      {error ? <p className="login-error">{error}</p> : <p className="login-hint">Yeni isim hesap açar, kayıtlı isim giriş yapar.</p>}

      <button className="btn primary" onClick={submit}>
        Reaktöre gir
      </button>
      <button
        className="btn ghost"
        onClick={() => {
          unlockAudio()
          sfxLogin()
          onEnter(enterGuest())
        }}
      >
        Misafir olarak oyna
      </button>

      {saved.length > 0 ? (
        <div className="saved">
          <div className="saved-label">Kayıtlı profiller</div>
          <div className="saved-row">
            {saved.map((account) => (
              <button
                key={account.id}
                className="chip"
                onClick={() => {
                  unlockAudio()
                  sfxTap()
                  const next = switchAccount(account.id)
                  if (next) onEnter(next)
                }}
              >
                {account.name}
                {account.guest ? ' · misafir' : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}
