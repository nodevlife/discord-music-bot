import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
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
	const guildId = interaction.guildId;
	if (!guildId) return;

	const queue = queueManager.get(guildId);
	if (!queue || !queue.currentSong) {
		await interaction.reply({
			content: "❌ 재생 중인 곡이 없어요!",
			ephemeral: true,
		});
		return;
	}

	const { title, duration, requestedBy, url } = queue.currentSong;
	const nextSong = queue.songs[0];

	const embed = new EmbedBuilder()
		.setTitle("🎵 지금 재생 중")
		.setDescription(`[**${title}**](${url})`)
		.addFields(
			{ name: "⏱️ 길이", value: duration, inline: true },
			{ name: "👤 신청자", value: requestedBy, inline: true },
		)
		.setColor(0x5865f2)
		.setURL(url)
		.setTimestamp();

	if (nextSong) {
		embed.addFields({
			name: "⏭️ 다음 곡",
			value: `${nextSong.title} [${nextSong.duration}]`,
			inline: false,
		});
	}

	embed.setFooter({ text: `대기열에 ${queue.songs.length}곡 남음` });

	await interaction.reply({ embeds: [embed] });
}
