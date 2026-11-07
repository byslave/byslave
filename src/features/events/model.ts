import type { Genre, Localized } from '@/src/data/demo';
import type { CoverKey } from '@/src/data/images';

import type { EventLife, EventSession } from './schedule';
import type { EventSource, VerificationStatus } from './verification';

export interface PulseEvent {
  id: string;
  venueId: string;
  title: string;
  concept: string;
  date: string;
  startTime: string;
  endTime: string;
  endDate: string;
  startAt: string;
  endAt: string;
  genres: Genre[];
  lineup: string[];
  price: Localized;
  ageLimit: number;
  description: Localized;
  going: number;
  checkedIn: number;
  mutuals: number;
  cover: CoverKey;
  attendeeIds: string[];
  source: EventSource;
  sourceName: string | null;
  externalId: string | null;
  ticketUrl: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: string | null;
  verifiedBy: string | null;
  verificationNote: string | null;
  status: EventLife;
  timeUnconfirmed: boolean;
  sessions: EventSession[];
  held: boolean;
  reporters: string[];
  createdBy: string | null;
  createdAt: string;
  sample: boolean;
}

export interface EventOverride {
  reporters: string[];
  held: boolean;
  verificationStatus?: VerificationStatus;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  verificationNote?: string | null;
  status?: EventLife;
  startAt?: string;
  endAt?: string;
  date?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  sessions?: EventSession[];
}

export interface OrganizerApplication {
  businessName: string;
  venueName: string;
  email: string;
  link: string;
  taxId: string;
  documentName: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
}

export interface VenueClaim {
  id: string;
  venueId: string;
  contact: string;
  status: 'pending' | 'approved' | 'rejected';
  note: string;
}

export interface ModerationEntry {
  id: string;
  at: string;
  actorId: string;
  action: 'approve' | 'reject' | 'hide' | 'approve-organizer' | 'reject-organizer' | 'approve-claim' | 'reject-claim';
  targetId: string;
  reason: string;
}

export interface InboxItem {
  id: string;
  kind: 'cancelled' | 'postponed';
  title: string;
  eventId: string;
  at: string;
}

export interface MessageRequest {
  id: string;
  senderId: string;
  recipientId: string;
  eventId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  body: string;
  createdAt: string;
}
