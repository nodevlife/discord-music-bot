import type { ChatInputCommandInteraction } from "discord.js";

interface GuildContext {
	guildId: string;
	interaction: ChatInputCommandInteraction;
}

export function ensureGuild(
	interaction: ChatInputCommandInteraction,
): GuildContext | null {
	const guildId = interaction.guildId;
	if (!guildId) return null;
	return { guildId, interaction };
}
