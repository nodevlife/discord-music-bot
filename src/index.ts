import { AudioPlayerStatus } from "@discordjs/voice";
import {
	type ChatInputCommandInteraction,
	Client,
	EmbedBuilder,
	GatewayIntentBits,
	REST,
	Routes,
} from "discord.js";
import { ButtonIds, createPlayerButtons } from "./utils/buttons";
import { killActiveProcesses } from "./utils/player";
import { updatePresence, updatePresencePaused } from "./utils/presence";
import { queueManager } from "./utils/queue";

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
	console.error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env");
	process.exit(1);
}

import * as nowplaying from "./commands/nowplaying";
import * as pause from "./commands/pause";
import * as play from "./commands/play";
import * as queue from "./commands/queue";
import * as resume from "./commands/resume";
import * as skip from "./commands/skip";
import * as stop from "./commands/stop";

interface Command {
	data: { name: string; toJSON(): unknown }[];
	execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands: Command[] = [
	play,
	skip,
	stop,
	queue,
	pause,
	resume,
	nowplaying,
];
const commandMap = new Map<string, Command>();
for (const cmd of commands) {
	for (const d of cmd.data) {
		commandMap.set(d.name, cmd);
	}
}

const client = new Client({
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
	presence: {
		status: "dnd",
		activities: [],
	},
});

async function registerCommands(): Promise<void> {
	const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN!);
	try {
		console.log("슬래시 커맨드 등록 중...");
		const allCommandData = commands.flatMap((c) =>
			c.data.map((d) => d.toJSON()),
		);
		await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID!), {
			body: allCommandData,
		});
		console.log(`슬래시 커맨드 ${allCommandData.length}개 등록 완료.`);
	} catch (error) {
		console.error("커맨드 등록 실패:", error);
	}
}

client.once("clientReady", () => {
	console.log(`${client.user?.tag} 로그인 완료`);
	registerCommands();
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = commandMap.get(interaction.commandName);
		if (!command) return;

		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(`${interaction.commandName} 실행 오류:`, error);
			const reply = {
				content: "❌ 오류가 발생했어요. 다시 시도해 주세요.",
				ephemeral: true as const,
			};
			if (interaction.replied || interaction.deferred) {
				await interaction.followUp(reply).catch(() => {});
			} else {
				await interaction.reply(reply).catch(() => {});
			}
		}
		return;
	}

	if (interaction.isButton()) {
		const guildId = interaction.guildId;
		if (!guildId) return;

		const queue = queueManager.get(guildId);
		if (!queue || !queue.currentSong) {
			await interaction
				.reply({ content: "❌ 재생 중인 곡이 없어요!", ephemeral: true })
				.catch(() => {});
			return;
		}

		try {
			switch (interaction.customId) {
				case ButtonIds.PAUSE_RESUME: {
					const isPaused =
						queue.player.state.status === AudioPlayerStatus.Paused;
					if (isPaused) {
						queue.player.unpause();
						updatePresence(client, queue.currentSong, queue.songs.length);
					} else {
						queue.player.pause();
						updatePresencePaused(client);
					}
					const nowPaused = !isPaused;
					const row = createPlayerButtons(nowPaused);
					const embed = EmbedBuilder.from(interaction.message.embeds[0])
						.setTitle(nowPaused ? "⏸️ 일시정지" : "🎵 지금 재생 중")
						.setColor(nowPaused ? 0xfee75c : 0x5865f2);
					await interaction.update({ embeds: [embed], components: [row] });
					break;
				}
				case ButtonIds.SKIP: {
					const skipped = queue.currentSong;
					killActiveProcesses(guildId);
					queue.player.stop();
					const disabledRow = createPlayerButtons(false);
					disabledRow.components.forEach((btn) => btn.setDisabled(true));
					const embed = EmbedBuilder.from(interaction.message.embeds[0])
						.setTitle("⏭️ 곡 스킵")
						.setColor(0xfee75c)
						.setFooter({
							text: `다음 곡이 ${queue.songs.length > 0 ? "곧 재생됩니다" : "없습니다"}`,
						});
					await interaction.update({
						embeds: [embed],
						components: [disabledRow],
					});
					break;
				}
				case ButtonIds.STOP: {
					killActiveProcesses(guildId);
					queue.songs.length = 0;
					queueManager.delete(guildId);
					updatePresence(client, null, 0, guildId);
					const disabledRow = createPlayerButtons(false);
					disabledRow.components.forEach((btn) => btn.setDisabled(true));
					const embed = EmbedBuilder.from(interaction.message.embeds[0])
						.setTitle("⏹️ 재생 정지")
						.setColor(0xed4245)
						.setDescription("재생을 멈추고 대기열을 모두 비웠어요.")
						.setFooter({ text: "재생이 정지되었습니다" });
					await interaction.update({
						embeds: [embed],
						components: [disabledRow],
					});
					break;
				}
			}
		} catch (error) {
			console.error("버튼 상호작용 오류:", error);
			await interaction
				.reply({ content: "❌ 오류가 발생했어요.", ephemeral: true })
				.catch(() => {});
		}
	}
});

client.login(DISCORD_TOKEN);
