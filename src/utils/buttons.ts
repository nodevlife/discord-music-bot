import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const ButtonIds = {
	PAUSE_RESUME: "player_pause_resume",
	SKIP: "player_skip",
	STOP: "player_stop",
} as const;

export function createDisabledButtons(): ActionRowBuilder<ButtonBuilder> {
	const row = createPlayerButtons(false);
	for (const btn of row.components) {
		btn.setDisabled(true);
	}
	return row;
}

export function createPlayerButtons(
	paused: boolean,
): ActionRowBuilder<ButtonBuilder> {
	return new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(ButtonIds.PAUSE_RESUME)
			.setEmoji(paused ? "▶️" : "⏸️")
			.setLabel(paused ? "다시재생" : "일시정지")
			.setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
		new ButtonBuilder()
			.setCustomId(ButtonIds.SKIP)
			.setEmoji("⏭️")
			.setLabel("스킵")
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId(ButtonIds.STOP)
			.setEmoji("⏹️")
			.setLabel("정지")
			.setStyle(ButtonStyle.Danger),
	);
}
