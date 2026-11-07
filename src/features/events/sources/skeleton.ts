import type { EventSourceAdapter, ExternalEvent, PulseEventDraft } from './types';

export function disabledFeed(id: string, sourceName: string, enabled: boolean): EventSourceAdapter {
  return {
    id,
    sourceName,
    enabled,
    async fetchEvents() {
      if (!enabled) return [];
      throw new Error(`${sourceName} feed is enabled but no contracted client is configured`);
    },
    mapToPulseEvent(raw: ExternalEvent): PulseEventDraft {
      return {
        source: 'official_feed',
        sourceName,
        externalId: raw.externalId,
        title: raw.title,
        concept: raw.concept ?? raw.genre ?? raw.title,
        startAt: raw.startAt,
        endAt: raw.endAt,
        ticketUrl: raw.ticketUrl,
        status: raw.status,
        verificationStatus: 'verified',
        genre: raw.genre,
        imageUrl: raw.imageUrl,
      };
    },
    isExpired(raw, now) {
      return new Date(raw.endAt).getTime() <= now.getTime() || raw.status === 'cancelled';
    },
  };
}
