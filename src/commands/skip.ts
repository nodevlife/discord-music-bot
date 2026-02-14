import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { killActiveProcesses } from "../utils/player";
import { queueManager } from "../utils/queue";

export const data = [
	new SlashCommandBuilder()
		.setName("skip")
		.setDescription("현재 곡을 건너뜁니다"),
	new SlashCommandBuilder()
		.setName("스킵")
		.setDescription("현재 곡을 건너뜁니다"),
];

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	const queue = queueManager.get(interaction.guildId!);
	if (!queue || !queue.currentSong) {
		await interaction.reply({
			content: "❌ 재생 중인 곡이 없어요!",
			ephemeral: true,
		});
		return;
	}

	const skipped = queue.currentSong;
	killActiveProcesses(interaction.guildId!);
	queue.player.stop();

	const embed = new EmbedBuilder()
		.setColor(0xfee75c)
		.setTitle("⏭️ 곡 스킵")
		.setDescription(`[**${skipped.title}**](${skipped.url})`)
		.setFooter({
			text: `다음 곡이 ${queue.songs.length > 0 ? "곧 재생됩니다" : "없습니다"}`,
		})
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
}
