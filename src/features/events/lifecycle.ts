import type { Schedulable } from './schedule';
import { validateWindow } from './schedule';

export function cancelEvent(event: Schedulable): Schedulable {
  return { ...event, status: 'cancelled' };
}

export function postponeEvent(
  event: Schedulable,
  input: { date: string; endDate?: string; startTime: string; endTime: string; now: Date },
): { ok: true; event: Schedulable } | { ok: false; error: string } {
  const window = validateWindow({ ...input, timeUnconfirmed: false, editing: true });
  if (!window.ok) return { ok: false, error: window.error };
  return {
    ok: true,
    event: {
      ...event,
      status: 'scheduled',
      startAt: window.start.toISOString(),
      endAt: window.end.toISOString(),
      sessions: event.sessions.length > 0 ? [{ id: 'main', startAt: window.start.toISOString(), endAt: window.end.toISOString() }] : [],
    },
  };
}

export function cancellationNotice(title: string): string {
  return title;
}

export function goingShouldStayGoing(): true {
  return true;
}
