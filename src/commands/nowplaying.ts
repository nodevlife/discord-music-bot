import {
	type ChatInputCommandInteraction,
	SlashCommandBuilder,
} from "discord.js";
import { createSongEmbed } from "../utils/embed";
import { ensureGuild } from "../utils/interaction";
import { queueManager } from "../utils/queue";

export const data = [
	new SlashCommandBuilder()
		.setName("nowplaying")
		.setDescription("현재 재생 중인 곡을 보여줍니다"),
	new SlashCommandBuilder()
		.setName("지금재생")
		.setDescription("현재 재생 중인 곡을 보여줍니다"),
];

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	const ctx = ensureGuild(interaction);
	if (!ctx) return;

	const queue = queueManager.get(ctx.guildId);
	if (!queue || !queue.currentSong) {
		await interaction.reply({
			content: "❌ 재생 중인 곡이 없어요!",
			ephemeral: true,
		});
		return;
	}

	const { currentSong } = queue;
	const nextSong = queue.songs[0];

	const embed = createSongEmbed({
		title: "🎵 지금 재생 중",
		song: currentSong,
		footer: `대기열에 ${queue.songs.length}곡 남음`,
	}).setURL(currentSong.url);

	if (nextSong) {
		embed.addFields({
			name: "⏭️ 다음 곡",
			value: `${nextSong.title} [${nextSong.duration}]`,
			inline: false,
		});
	}

	await interaction.reply({ embeds: [embed] });
}
