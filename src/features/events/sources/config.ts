function on(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

/** Official ticket feeds stay off until a partner key exists. Never scrape. */
export const feedFlags = {
  bubilet: on(process.env.ENABLE_BUBILET_FEED),
  biletix: on(process.env.ENABLE_BILETIX_FEED),
  passo: on(process.env.ENABLE_PASSO_FEED),
  bugece: on(process.env.ENABLE_BUGECE_FEED),
} as const;

export function feedEnabled(id: keyof typeof feedFlags): boolean {
  return feedFlags[id];
}
