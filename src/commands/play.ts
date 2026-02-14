import { createAudioPlayer, joinVoiceChannel } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	type GuildMember,
	SlashCommandBuilder,
} from "discord.js";
import { createSongEmbed } from "../utils/embed";
import { ensureGuild } from "../utils/interaction";
import { getSongInfo, playSong } from "../utils/player";
import { updatePresence } from "../utils/presence";
import { queueManager } from "../utils/queue";

export const data = [
	new SlashCommandBuilder()
		.setName("play")
		.setDescription("유튜브에서 음악을 재생합니다")
		.addStringOption((option) =>
			option
				.setName("query")
				.setDescription("유튜브 URL 또는 검색어")
				.setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("재생")
		.setDescription("유튜브에서 음악을 재생합니다")
		.addStringOption((option) =>
			option
				.setName("query")
				.setDescription("유튜브 URL 또는 검색어")
				.setRequired(true),
		),
];

export async function execute(
	interaction: ChatInputCommandInteraction,
): Promise<void> {
	const ctx = ensureGuild(interaction);
	if (!ctx) return;

	const guild = interaction.guild;
	if (!guild) return;

	const member = interaction.member as GuildMember;
	const voiceChannel = member.voice.channel;

	if (!voiceChannel) {
		await interaction.reply({
			content: "❌ 먼저 음성 채널에 참여해 주세요!",
			ephemeral: true,
		});
		return;
	}

	const query = interaction.options.getString("query", true);
	await interaction.deferReply();

	try {
		const songInfo = await getSongInfo(query);
		const song = {
			title: songInfo.title,
			url: songInfo.url,
			duration: songInfo.duration,
			requestedBy: interaction.user.tag,
			thumbnail: songInfo.thumbnail,
		};

		let queue = queueManager.get(ctx.guildId);
		const shouldStartPlayback = !queue || !queue.playing;

		if (!queue) {
			const player = createAudioPlayer();
			const connection = joinVoiceChannel({
				channelId: voiceChannel.id,
				guildId: ctx.guildId,
				adapterCreator: guild.voiceAdapterCreator,
			});
			connection.subscribe(player);

			queue = {
				songs: [],
				currentSong: null,
				player,
				connection,
				textChannelId: interaction.channelId,
				playing: false,
				nowPlayingMessage: null,
			};
			queueManager.set(ctx.guildId, queue);
		}

		queue.songs.push(song);

		if (shouldStartPlayback) {
			const embed = createSongEmbed({ title: "🎵 재생 시작", song });
			await interaction.editReply({ embeds: [embed] });
			await playSong(ctx.guildId, interaction.client);
		} else {
			const embed = createSongEmbed({
				title: "➕ 대기열에 추가됨",
				song,
				color: 0x57f287,
				queuePosition: queue.songs.length,
			});
			await interaction.editReply({ embeds: [embed] });
			updatePresence(interaction.client, queue.currentSong, queue.songs.length);
		}
	} catch (error) {
		console.error("재생 오류:", error);
		await interaction.editReply(
			"❌ 곡을 재생할 수 없어요. 다시 시도해 주세요.",
		);
	}
}
