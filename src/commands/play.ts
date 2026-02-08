import { type ChatInputCommandInteraction, type GuildMember, SlashCommandBuilder } from 'discord.js';
import { joinVoiceChannel, createAudioPlayer } from '@discordjs/voice';
import { queueManager } from '../utils/queue';
import { getSongInfo, playSong } from '../utils/player';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Play a song from YouTube')
  .addStringOption(option =>
    option.setName('query')
      .setDescription('YouTube URL or search query')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member as GuildMember;
  const voiceChannel = member.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({ content: '❌ You need to be in a voice channel!', ephemeral: true });
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
      };
      queueManager.set(interaction.guildId!, queue);
      queue.songs.push(song);

      await interaction.editReply(`🎵 Playing: **${song.title}** [${song.duration}]`);
      await playSong(interaction.guildId!, interaction.client);
    } else {
      queue.songs.push(song);
      await interaction.editReply(`➕ Added to queue (#${queue.songs.length}): **${song.title}** [${song.duration}]`);
    }
  } catch (error) {
    console.error('Play error:', error);
    await interaction.editReply('❌ Failed to play the song. Please try again.');
  }
}
