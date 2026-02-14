import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { killActiveProcesses } from "../utils/player";
import { updatePresence } from "../utils/presence";
import { queueManager } from "../utils/queue";

export const data = [
	new SlashCommandBuilder()
		.setName("stop")
		.setDescription("재생을 멈추고 대기열을 비웁니다"),
	new SlashCommandBuilder()
		.setName("정지")
		.setDescription("재생을 멈추고 대기열을 비웁니다"),
];

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	const queue = queueManager.get(interaction.guildId!);
	if (!queue) {
		await interaction.reply({
			content: "❌ 재생 중인 곡이 없어요!",
			ephemeral: true,
		});
		return;
	}

	killActiveProcesses(interaction.guildId!);
	queue.songs.length = 0;
	queueManager.delete(interaction.guildId!);
	updatePresence(interaction.client, null, 0, interaction.guildId!);

	const embed = new EmbedBuilder()
		.setColor(0xed4245)
		.setTitle("⏹️ 재생 정지")
		.setDescription("재생을 멈추고 대기열을 모두 비웠어요.")
		.setTimestamp();

	await interaction.reply({ embeds: [embed] });
}
