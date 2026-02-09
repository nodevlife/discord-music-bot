import { ActivityType, PresenceUpdateStatus, type Client } from 'discord.js';
import type { Song } from './queue';

const MAX_ACTIVITY_NAME = 128;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

export function updatePresence(client: Client, track: Song | null, queueLength: number): void {
  if (!track) {
    client.user?.setPresence({
      status: PresenceUpdateStatus.DoNotDisturb,
      activities: [],
    });
    return;
  }

  const suffix = queueLength > 0 ? ` 외 ${queueLength}곡 대기 중` : '';
  const titleMax = MAX_ACTIVITY_NAME - suffix.length;
  const name = truncate(track.title, Math.max(titleMax, 10)) + suffix;

  client.user?.setPresence({
    status: PresenceUpdateStatus.Online,
    activities: [{ name, type: ActivityType.Listening }],
  });
}

export function updatePresencePaused(client: Client): void {
  const current = client.user?.presence.activities[0];
  client.user?.setPresence({
    status: PresenceUpdateStatus.Idle,
    activities: current ? [{ name: current.name, type: current.type }] : [],
  });
}
