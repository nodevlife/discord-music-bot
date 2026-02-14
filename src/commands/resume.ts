import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { ensureGuild } from "../utils/interaction";
import { updatePresence } from "../utils/presence";
import { queueManager } from "../utils/queue";

export const data = [
	new SlashCommandBuilder()
		.setName("resume")
		.setDescription("일시정지된 곡을 다시 재생합니다"),
	new SlashCommandBuilder()
		.setName("다시재생")
		.setDescription("일시정지된 곡을 다시 재생합니다"),
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

	queue.player.unpause();
	updatePresence(interaction.client, queue.currentSong, queue.songs.length);

	const embed = new EmbedBuilder()
		.setColor(0x57f287)
		.setTitle("▶️ 다시 재생")
		.setDescription(`**${queue.currentSong.title}**을(를) 다시 재생합니다.`)
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
}
