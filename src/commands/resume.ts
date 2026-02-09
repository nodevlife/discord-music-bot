import { type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';
import { updatePresence } from '../utils/presence';

export const data = [
  new SlashCommandBuilder()
    .setName('resume')
    .setDescription('일시정지된 곡을 다시 재생합니다'),
  new SlashCommandBuilder()
    .setName('다시재생')
    .setDescription('일시정지된 곡을 다시 재생합니다'),
];

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue || !queue.currentSong) {
    await interaction.reply({ content: '❌ 재생 중인 곡이 없어요!', ephemeral: true });
    return;
  }

  queue.player.unpause();
  updatePresence(interaction.client, queue.currentSong, queue.songs.length);

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle('▶️ 다시 재생')
    .setDescription(`**${queue.currentSong.title}**을(를) 다시 재생합니다.`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
