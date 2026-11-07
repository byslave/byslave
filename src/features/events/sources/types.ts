import type { EventSource, VerificationStatus } from '../verification';

export interface ExternalEvent {
  externalId: string;
  title: string;
  venueName: string;
  startAt: string;
  endAt: string;
  ticketUrl: string;
  status: 'scheduled' | 'cancelled' | 'postponed';
  genre?: string;
  imageUrl?: string;
}

export interface PulseEventDraft {
  source: EventSource;
  sourceName: string;
  externalId: string;
  title: string;
  startAt: string;
  endAt: string;
  ticketUrl: string;
  status: 'scheduled' | 'cancelled' | 'postponed';
  verificationStatus: VerificationStatus;
  genre?: string;
  imageUrl?: string;
}

/** Adapters only run with a contracted feed. They must not scrape public pages. */
export interface EventSourceAdapter {
  id: string;
  sourceName: string;
  enabled: boolean;
  fetchEvents(): Promise<ExternalEvent[]>;
  mapToPulseEvent(raw: ExternalEvent): PulseEventDraft;
  isExpired(raw: ExternalEvent, now: Date): boolean;
}
