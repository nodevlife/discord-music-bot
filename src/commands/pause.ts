import { type ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { queueManager } from '../utils/queue';

export const data = [
  new SlashCommandBuilder()
    .setName('pause')
    .setDescription('현재 곡을 일시정지합니다'),
  new SlashCommandBuilder()
    .setName('일시정지')
    .setDescription('현재 곡을 일시정지합니다'),
];

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const queue = queueManager.get(interaction.guildId!);
  if (!queue || !queue.currentSong) {
    await interaction.reply({ content: '❌ 재생 중인 곡이 없어요!', ephemeral: true });
    return;
  }

  queue.player.pause();

  const embed = new EmbedBuilder()
    .setColor(0xFEE75C)
    .setTitle('⏸️ 일시정지')
    .setDescription(`**${queue.currentSong.title}**을(를) 일시정지했어요.`)
    .setFooter({ text: '/resume 또는 /다시재생으로 계속할 수 있어요' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
