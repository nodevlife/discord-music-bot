import { EmbedBuilder } from "discord.js";
import type { Song } from "./queue";

interface SongEmbedOptions {
	title: string;
	song: Song;
	color?: number;
	footer?: string;
	queuePosition?: number;
}

export function createSongEmbed({
	title,
	song,
	color = 0x5865f2,
	footer,
	queuePosition,
}: SongEmbedOptions): EmbedBuilder {
	const embed = new EmbedBuilder()
		.setColor(color)
		.setTitle(title)
		.setDescription(`[**${song.title}**](${song.url})`)
		.addFields(
			{ name: "⏱️ 길이", value: song.duration, inline: true },
			{ name: "👤 신청자", value: song.requestedBy, inline: true },
		)
		.setTimestamp();

	if (queuePosition !== undefined) {
		embed.addFields({
			name: "📋 대기 순서",
			value: `${queuePosition}번째`,
			inline: true,
		});
	}

	if (song.thumbnail) {
		embed.setThumbnail(song.thumbnail);
	}

	if (footer) {
		embed.setFooter({ text: footer });
	}

	return embed;
}
