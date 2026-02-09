import { type ChatInputCommandInteraction, type GuildMember, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer } from '@discordjs/voice';
import { queueManager } from '../utils/queue';
import { getSongInfo, playSong } from '../utils/player';

export const data = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('유튜브에서 음악을 재생합니다')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('유튜브 URL 또는 검색어')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('재생')
    .setDescription('유튜브에서 음악을 재생합니다')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('유튜브 URL 또는 검색어')
        .setRequired(true)
    ),
];

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({ content: '❌ 먼저 음성 채널에 참여해 주세요!', ephemeral: true });
    return;
  }

  const query = interaction.options.getString('query', true);
  await interaction.deferReply();

  try {
    const songInfo = await getSongInfo(query);
    const song = {
      title: songInfo.title,
      url: songInfo.url,
      duration: songInfo.duration,
      requestedBy: interaction.user.tag,
    };

    let queue = queueManager.get(interaction.guildId!);

    if (!queue) {
      const player = createAudioPlayer();
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guildId!,
        adapterCreator: interaction.guild!.voiceAdapterCreator,
      });
      connection.subscribe(player);

      queue = {
        songs: [],
        currentSong: null,
        player,
        connection,
        textChannelId: interaction.channelId,
        playing: false,
        nowPlayingMessage: null,
      };
      queueManager.set(interaction.guildId!, queue);
      queue.songs.push(song);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎵 재생 시작')
        .setDescription(`[**${song.title}**](${song.url})`)
        .addFields(
          { name: '⏱️ 길이', value: song.duration, inline: true },
          { name: '👤 신청자', value: song.requestedBy, inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      await playSong(interaction.guildId!, interaction.client);
    } else {
      queue.songs.push(song);

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('➕ 대기열에 추가됨')
        .setDescription(`[**${song.title}**](${song.url})`)
        .addFields(
          { name: '⏱️ 길이', value: song.duration, inline: true },
          { name: '👤 신청자', value: song.requestedBy, inline: true },
          { name: '📋 대기 순서', value: `${queue.songs.length}번째`, inline: true },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  } catch (error) {
    console.error('재생 오류:', error);
    await interaction.editReply('❌ 곡을 재생할 수 없어요. 다시 시도해 주세요.');
  }
}
