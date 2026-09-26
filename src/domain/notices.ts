import { badgeBoard } from './badges';
import { eventPhase } from './format';
import type { ActivityComment, ActivitySummary, AppNotification, NightEvent, PublicUser } from './types';

export function activityNotices(input: {
  profileId: string | null;
  activities: ActivitySummary[];
  comments: ActivityComment[];
  events: NightEvent[];
  users: PublicUser[];
  followingIds: string[];
  now?: number;
}): AppNotification[] {
  const now = input.now ?? Date.now();
  const name = (userId: string) => input.users.find((item) => item.id === userId)?.displayName ?? 'Biri';
  const items: AppNotification[] = [];
  if (input.profileId) {
    for (const activity of input.activities.filter((item) => item.userId === input.profileId)) {
      for (const userId of activity.respectIds) {
        if (userId === input.profileId) continue;
        items.push({
          id: `ntf-respect-${activity.id}-${userId}`,
          title: `${name(userId)} saygı bıraktı`,
          body: activity.title,
          createdAt: activity.endedAt,
          read: false,
          href: `/session/${activity.id}`,
        });
      }
    }
    for (const comment of input.comments) {
      const activity = input.activities.find((item) => item.id === comment.activityId);
      if (!activity || activity.userId !== input.profileId || comment.userId === input.profileId) continue;
      items.push({
        id: `ntf-comment-${comment.id}`,
        title: `${name(comment.userId)} yorum yaptı`,
        body: comment.text,
        createdAt: comment.createdAt,
        read: false,
        href: `/session/${activity.id}`,
      });
    }
    for (const badge of badgeBoard(input.activities, input.profileId)) {
      if (!badge.earnedAt) continue;
      items.push({
        id: `ntf-badge-${badge.key}`,
        title: `Rozet · ${badge.title}`,
        body: badge.description,
        createdAt: badge.earnedAt,
        read: false,
        href: '/(tabs)/activity',
      });
    }
  }
  for (const activity of input.activities) {
    if (!activity.shared || activity.userId === input.profileId) continue;
    if (!input.followingIds.includes(activity.userId)) continue;
    if (now - new Date(activity.startedAt).getTime() > 12 * 60 * 60 * 1000) continue;
    items.push({
      id: `ntf-start-${activity.id}`,
      title: `${name(activity.userId)} gece başlattı`,
      body: activity.title,
      createdAt: activity.startedAt,
      read: false,
      href: `/session/${activity.id}`,
    });
  }
  for (const event of input.events) {
    const phase = eventPhase(event.startsAt, now);
    if (phase === 'live') {
      items.push({
        id: `ntf-live-${event.id}`,
        title: `${event.title} açık`,
        body: `${event.venue} şu an kayıtta.`,
        createdAt: event.startsAt,
        read: false,
        href: `/event/${event.id}`,
      });
    }
    if (phase === 'upcoming' && new Date(event.startsAt).getTime() - now < 7 * 24 * 60 * 60 * 1000) {
      items.push({
        id: `ntf-soon-${event.id}`,
        title: `${event.title} yakında`,
        body: event.venue,
        createdAt: new Date(now).toISOString(),
        read: false,
        href: `/event/${event.id}`,
      });
    }
  }
  return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);
}
