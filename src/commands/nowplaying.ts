import { type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Show the currently playing song');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue || !queue.currentSong) {
    await interaction.reply({ content: '❌ Nothing is playing!', ephemeral: true });
    return;
  }

  const { title, duration, requestedBy, url } = queue.currentSong;
  const embed = new EmbedBuilder()
    .setTitle('🎵 Now Playing')
    .setDescription(`**${title}**`)
    .addFields(
      { name: 'Duration', value: duration, inline: true },
      { name: 'Requested by', value: requestedBy, inline: true },
    )
    .setColor(0x00ff00)
    .setURL(url);

  await interaction.reply({ embeds: [embed] });
}
