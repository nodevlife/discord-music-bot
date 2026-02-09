import { ActivityType, PresenceUpdateStatus, type Client } from 'discord.js';
import type { Song } from './queue';

function truncateTitle(title: string): string {
  if (title.length <= 128) return title;
  return title.slice(0, 125) + '...';
}

export function updatePresence(client: Client, track: Song | null, queueLength: number): void {
  if (!track) {
    client.user?.setPresence({
      status: PresenceUpdateStatus.DoNotDisturb,
      activities: [],
    });
    return;
  }

  const name = queueLength > 0
    ? `${truncateTitle(track.title)} 외 ${queueLength}곡 대기 중`
    : truncateTitle(track.title);

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
