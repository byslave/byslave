export function usernameIssue(value: string, users: { id: string; username: string }[], selfId?: string): string | null {
  const username = value.trim();
  if (username.length < 3 || username.length > 16) return 'Kullanıcı adı 3 ile 16 karakter olmalı.';
  if (users.some((user) => user.username === username && user.id !== selfId)) return 'Bu kullanıcı adı dolu.';
  return null;
}

export function guestUsername(users: { username: string }[]): string {
  const taken = new Set(users.map((user) => user.username));
  if (!taken.has('gece')) return 'gece';
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const name = `gece${Math.floor(1000 + Math.random() * 9000)}`;
    if (!taken.has(name)) return name;
  }
  return `gece${Date.now().toString().slice(-8)}`;
}
