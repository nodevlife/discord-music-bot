import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';
import { killActiveProcesses } from '../utils/player';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Skip the current song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue || !queue.currentSong) {
    await interaction.reply({ content: '❌ Nothing is playing!', ephemeral: true });
    return;
  }

  const skipped = queue.currentSong.title;
  killActiveProcesses(interaction.guildId!);
  queue.player.stop();
  await interaction.reply(`⏭ Skipped: **${skipped}**`);
}
