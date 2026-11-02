import { feedFlags } from './config';
import { disabledFeed } from './skeleton';
import type { EventSourceAdapter, PulseEventDraft } from './types';

export const eventSources: EventSourceAdapter[] = [
  disabledFeed('bubilet', 'bubilet', feedFlags.bubilet),
  disabledFeed('biletix', 'biletix', feedFlags.biletix),
  disabledFeed('passo', 'passo', feedFlags.passo),
  disabledFeed('bugece', 'bugece', feedFlags.bugece),
];

/** Daily sync entry. Disabled feeds contribute nothing and never fetch HTML. */
export async function syncOfficialFeeds(now: Date): Promise<PulseEventDraft[]> {
  const drafts: PulseEventDraft[] = [];
  for (const source of eventSources) {
    if (!source.enabled) continue;
    const rows = await source.fetchEvents();
    for (const row of rows) {
      if (source.isExpired(row, now)) continue;
      const draft = source.mapToPulseEvent(row);
      if (!draft.ticketUrl.startsWith('https://')) continue;
      drafts.push(draft);
    }
  }
  return drafts;
}

export function dedupeKey(sourceName: string, externalId: string): string {
  return `${sourceName}:${externalId}`;
}
