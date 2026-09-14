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
        <h1>REACTOR LEAGUE</h1>
        <p>Sign in with email to see ranks. The account stays on this device — nothing is sent to a server.</p>
      </div>

      <form
        className="login-form"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
      <label className="field">
        <span>EMAIL</span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nova@blockpatlat.com"
          type="email"
          autoComplete="email"
          inputMode="email"
        />
      </label>
      <label className="field">
        <span>PASSWORD</span>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="at least 4 characters"
          type="password"
          autoComplete="current-password"
        />
      </label>
      <label className="field">
        <span>PLAYER NAME (new account)</span>
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
        <p className="login-hint">A new email creates an account. A saved email signs you in.</p>
      )}

      <button className="btn primary" type="submit">
        Join the league
      </button>
      <a className="login-privacy" href="./privacy.html">
        Privacy
      </a>
      </form>

      {saved.length > 0 ? (
        <div className="saved">
          <div className="saved-label">Saved league profiles</div>
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
