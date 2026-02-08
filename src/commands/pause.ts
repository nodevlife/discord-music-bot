import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Pause the current song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue || !queue.currentSong) {
    await interaction.reply({ content: '❌ Nothing is playing!', ephemeral: true });
    return;
  }

  queue.player.pause();
  await interaction.reply('⏸ Paused.');
}
