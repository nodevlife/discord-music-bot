import { ActivityType, type Client } from "discord.js";
import type { Song } from "./queue";
import { queueManager } from "./queue";

const MAX_ACTIVITY_NAME = 128;

function truncate(text: string, max: number): string {
	if (text.length <= max) return text;
	return `${text.slice(0, max - 3)}...`;
}

/** Find any guild that is currently playing a track (excluding the given guildId). */
function findActiveTrack(
	excludeGuildId?: string,
): { track: Song; queueLength: number } | null {
	for (const [guildId, queue] of queueManager.entries()) {
		if (guildId === excludeGuildId) continue;
		if (queue.currentSong && queue.playing) {
			return { track: queue.currentSong, queueLength: queue.songs.length };
		}
	}
	return null;
}

export function updatePresence(
	client: Client,
	track: Song | null,
	queueLength: number,
	guildId?: string,
): void {
	if (!track) {
		// Before resetting to DND, check if another guild is still playing
		const other = findActiveTrack(guildId);
		if (other) {
			updatePresence(client, other.track, other.queueLength);
			return;
		}

		client.user?.setPresence({
			status: "dnd",
			activities: [],
		});
		return;
	}

	const suffix = queueLength > 0 ? ` 외 ${queueLength}곡 대기 중` : "";
	const titleMax = MAX_ACTIVITY_NAME - suffix.length;
	const name = `${truncate(track.title, Math.max(titleMax, 10))}${suffix}`;

	client.user?.setPresence({
		status: "online",
		activities: [{ name, type: ActivityType.Listening }],
	});
}

export function updatePresencePaused(client: Client): void {
	const current = client.user?.presence.activities[0];
	client.user?.setPresence({
		status: "idle",
		activities: current ? [{ name: current.name, type: current.type }] : [],
	});
}
