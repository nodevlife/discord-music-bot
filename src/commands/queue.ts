import {
	type ChatInputCommandInteraction,
	EmbedBuilder,
	SlashCommandBuilder,
} from "discord.js";
import { ensureGuild } from "../utils/interaction";
import { queueManager } from "../utils/queue";

export const data = [
	new SlashCommandBuilder()
		.setName("queue")
		.setDescription("현재 대기열을 보여줍니다"),
	new SlashCommandBuilder()
		.setName("대기열")
		.setDescription("현재 대기열을 보여줍니다"),
];

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	const ctx = ensureGuild(interaction);
	if (!ctx) return;

	const queue = queueManager.get(ctx.guildId);
	if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
		await interaction.reply({
			content: "📪 대기열이 비어있어요!",
			ephemeral: true,
		});
		return;
	}

	const embed = new EmbedBuilder()
		.setTitle("📋 재생 대기열")
		.setColor(0x5865f2)
		.setTimestamp();

	if (queue.currentSong) {
		const { title, url, duration, requestedBy } = queue.currentSong;
		embed.addFields({
			name: "🎵 지금 재생 중",
			value: `[**${title}**](${url})\n⏱️ ${duration}  ·  👤 ${requestedBy}`,
		});
	}

	if (queue.songs.length > 0) {
		const list = queue.songs
			.slice(0, 10)
			.map(
				(s, i) =>
					`\`${(i + 1).toString().padStart(2, " ")}\` [**${s.title}**](${s.url}) — ${s.duration}  ·  ${s.requestedBy}`,
			)
			.join("\n");
		const extra =
			queue.songs.length > 10 ? `\n\n*...외 ${queue.songs.length - 10}곡*` : "";
		embed.addFields({ name: "⏳ 다음 곡", value: list + extra });
	}

	const totalSongs = queue.songs.length + (queue.currentSong ? 1 : 0);
	embed.setFooter({
		text: `총 ${totalSongs}곡  ·  대기 ${queue.songs.length}곡`,
	});

	await interaction.reply({ embeds: [embed] });
}
