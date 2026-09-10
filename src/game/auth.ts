import { DEFAULT, loadProgress as loadLegacyProgress, normalizeProgress } from './progress'
import type { Progress } from './types'

const STORE = 'neonpatlat-accounts-v1'

export type Account = {
  id: string
  name: string
  email: string | null
  pinHash: string | null
  guest: boolean
  progress: Progress
}

type Store = {
  accounts: Account[]
  sessionId: string | null
}

function blankStore(): Store {
  return { accounts: [], sessionId: null }
}

export function hashPin(name: string, pin: string): string {
  const s = `${name.trim().toLowerCase()}::${pin}::neonpatlat`
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16)
}

function read(): Store {
  try {
    const raw = localStorage.getItem(STORE)
    if (!raw) {
      const legacy = loadLegacyProgress()
      if (legacy.best > 0 || legacy.gamesPlayed > 0 || legacy.playerName !== DEFAULT.playerName) {
        const migrated: Account = {
          id: crypto.randomUUID(),
          name: legacy.playerName || 'Deniz',
          email: null,
          pinHash: null,
          guest: true,
          progress: normalizeProgress({ ...legacy, muted: legacy.muted ?? false }),
        }
        const store = { accounts: [migrated], sessionId: migrated.id }
        write(store)
        return store
      }
      return blankStore()
    }
    const parsed = JSON.parse(raw) as Store
    return {
      accounts: (parsed.accounts ?? []).map((account) => ({
        ...account,
        email: account.email ?? null,
        progress: normalizeProgress(account.progress),
      })),
      sessionId: parsed.sessionId ?? null,
    }
  } catch {
    return blankStore()
  }
}

function write(store: Store): void {
  localStorage.setItem(STORE, JSON.stringify(store))
}

export function listAccounts(): Account[] {
  return read().accounts
}

export function currentAccount(): Account | null {
  const store = read()
  if (!store.sessionId) return null
  return store.accounts.find((a) => a.id === store.sessionId) ?? null
}

export function persistAccount(account: Account): Account {
  const store = read()
  const i = store.accounts.findIndex((a) => a.id === account.id)
  if (i >= 0) store.accounts[i] = account
  else store.accounts.push(account)
  store.sessionId = account.id
  write(store)
  return account
}

export function saveProgress(account: Account, progress: Progress): Account {
  return persistAccount({
    ...account,
    progress: normalizeProgress(progress),
    name: account.guest ? account.name : progress.playerName,
  })
}

export function ranked(account: Account | null): boolean {
  return !!account && !account.guest && (!!account.email || !!account.pinHash)
}

export function mergeProgress(base: Progress, incoming: Progress, name: string): Progress {
  return normalizeProgress({
    ...base,
    ...incoming,
    playerName: name,
    best: Math.max(base.best, incoming.best),
    maxCombo: Math.max(base.maxCombo, incoming.maxCombo),
    gamesPlayed: Math.max(base.gamesPlayed, incoming.gamesPlayed),
    coins: Math.max(base.coins, incoming.coins),
    unlocked: Array.from(new Set([...base.unlocked, ...incoming.unlocked])),
    skins: Array.from(new Set([...base.skins, ...incoming.skins])),
  })
}

export function ensureLocalProfile(): Account {
  return currentAccount() ?? enterGuest()
}

export type AuthResult = { ok: true; account: Account } | { ok: false; error: string }

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizeEmail(email))
}

export function bindEmail(email: string, password: string, name: string, local: Progress): AuthResult {
  const mail = normalizeEmail(email)
  if (!validEmail(mail)) return { ok: false, error: 'Geçerli bir e-posta gir.' }
  if (password.length < 4) return { ok: false, error: 'Şifre en az 4 karakter olsun.' }

  const store = read()
  const existing = store.accounts.find((a) => a.email === mail && !a.guest)
  const pinHash = hashPin(mail, password)

  if (existing) {
    if (existing.pinHash !== pinHash) return { ok: false, error: 'Şifre hatalı.' }
    const account = persistAccount({
      ...existing,
      progress: mergeProgress(existing.progress, local, existing.name),
    })
    return { ok: true, account }
  }

  const trimmed = name.trim()
  if (trimmed.length < 2) return { ok: false, error: 'Oyuncu adı en az 2 karakter olsun.' }

  const account: Account = {
    id: crypto.randomUUID(),
    name: trimmed,
    email: mail,
    pinHash,
    guest: false,
    progress: normalizeProgress({ ...local, playerName: trimmed }),
  }
  persistAccount(account)
  return { ok: true, account }
}

export function bindLeague(name: string, pin: string, local: Progress): AuthResult {
  const trimmed = name.trim()
  if (trimmed.length < 2) return { ok: false, error: 'İsim en az 2 karakter olsun.' }
  if (!/^\d{4}$/.test(pin)) return { ok: false, error: 'PIN 4 haneli olmalı.' }

  const store = read()
  const existing = store.accounts.find((a) => a.name.toLowerCase() === trimmed.toLowerCase() && !a.guest)
  const pinHash = hashPin(trimmed, pin)

  if (existing) {
    if (existing.pinHash !== pinHash) return { ok: false, error: 'PIN hatalı.' }
    const account = persistAccount({
      ...existing,
      progress: mergeProgress(existing.progress, local, existing.name),
    })
    return { ok: true, account }
  }

  const account: Account = {
    id: crypto.randomUUID(),
    name: trimmed,
    email: null,
    pinHash,
    guest: false,
    progress: normalizeProgress({ ...local, playerName: trimmed }),
  }
  persistAccount(account)
  return { ok: true, account }
}

export function resumeRanked(id: string, local: Progress): Account | null {
  const store = read()
  const existing = store.accounts.find((a) => a.id === id && !a.guest)
  if (!existing) return null
  return persistAccount({
    ...existing,
    progress: mergeProgress(existing.progress, local, existing.name),
  })
}

export function unbindLeague(local: Progress): Account {
  const store = read()
  const guest = store.accounts.find((a) => a.guest)
  if (guest) {
    return persistAccount({
      ...guest,
      progress: mergeProgress(guest.progress, { ...local, playerName: guest.name }, guest.name),
    })
  }
  return enterGuest()
}

export function enterGuest(name = 'Misafir'): Account {
  const store = read()
  const existing = store.accounts.find((a) => a.guest)
  if (existing) {
    store.sessionId = existing.id
    write(store)
    return existing
  }
  const account: Account = {
    id: crypto.randomUUID(),
    name,
    email: null,
    pinHash: null,
    guest: true,
    progress: normalizeProgress({ ...DEFAULT, playerName: name, unlocked: [...DEFAULT.unlocked] }),
  }
  persistAccount(account)
  return account
}

export function logout(): void {
  const store = read()
  store.sessionId = null
  write(store)
}

export function switchAccount(id: string): Account | null {
  const store = read()
  const account = store.accounts.find((a) => a.id === id)
  if (!account) return null
  store.sessionId = account.id
  write(store)
  return account
}
