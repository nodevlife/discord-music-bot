import type { AudioPlayer, VoiceConnection } from "@discordjs/voice";
import type { Message } from "discord.js";

export interface Song {
	title: string;
	url: string;
	duration: string;
	requestedBy: string;
}

export interface GuildQueue {
	songs: Song[];
	currentSong: Song | null;
	player: AudioPlayer;
	connection: VoiceConnection;
	textChannelId: string;
	playing: boolean;
	nowPlayingMessage: Message | null;
}

class QueueManager {
	private readonly queues = new Map<string, GuildQueue>();

	get(guildId: string): GuildQueue | undefined {
		return this.queues.get(guildId);
	}

	set(guildId: string, queue: GuildQueue): void {
		this.queues.set(guildId, queue);
	}

	delete(guildId: string): void {
		const queue = this.queues.get(guildId);
		if (!queue) return;
		try {
			queue.player.stop();
		} catch {}
		try {
			queue.connection.destroy();
		} catch {}
		this.queues.delete(guildId);
	}

	has(guildId: string): boolean {
		return this.queues.has(guildId);
	}

	entries(): IterableIterator<[string, GuildQueue]> {
		return this.queues.entries();
	}
}

export const queueManager = new QueueManager();
