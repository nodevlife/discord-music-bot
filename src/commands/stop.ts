import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';
import { killActiveProcesses } from '../utils/player';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Stop playback and clear the queue');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue) {
    await interaction.reply({ content: '❌ Nothing is playing!', ephemeral: true });
    return;
  }

  killActiveProcesses(interaction.guildId!);
  queue.songs.length = 0;
  queueManager.delete(interaction.guildId!);
  await interaction.reply('⏹ Stopped and cleared the queue.');
}
