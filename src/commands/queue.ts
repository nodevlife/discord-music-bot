import { type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Show the current queue');

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue || (!queue.currentSong && queue.songs.length === 0)) {
    await interaction.reply({ content: '📪 Queue is empty!', ephemeral: true });
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎶 Music Queue')
    .setColor(0x7289da);

  if (queue.currentSong) {
    const { title, duration, requestedBy } = queue.currentSong;
    embed.addFields({
      name: 'Now Playing',
      value: `**${title}** [${duration}] - requested by ${requestedBy}`,
    });
  }

  if (queue.songs.length > 0) {
    const list = queue.songs
      .slice(0, 10)
      .map((s, i) => `${i + 1}. **${s.title}** [${s.duration}] - ${s.requestedBy}`)
      .join('\n');
    const extra = queue.songs.length > 10 ? `\n...and ${queue.songs.length - 10} more` : '';
    embed.addFields({ name: 'Up Next', value: list + extra });
  }

  embed.setFooter({ text: `${queue.songs.length} song(s) in queue` });
  await interaction.reply({ embeds: [embed] });
}
