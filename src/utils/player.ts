import { createAudioResource, AudioPlayerStatus, StreamType } from '@discordjs/voice';
import { spawn, type ChildProcess } from 'child_process';
import type { Readable } from 'stream';
import { queueManager } from './queue';
import { type Client, TextChannel, EmbedBuilder } from 'discord.js';
import { createPlayerButtons } from './buttons';

const YTDLP_PATH = process.env.YTDLP_PATH ?? '/opt/homebrew/bin/yt-dlp';
const FFMPEG_PATH = process.env.FFMPEG_PATH ?? '/opt/homebrew/bin/ffmpeg';

interface ActiveProcess {
  ytdlp: ChildProcess;
  ffmpeg: ChildProcess;
}

const activeProcesses = new Map<string, ActiveProcess>();

export function killActiveProcesses(guildId: string): void {
  const procs = activeProcesses.get(guildId);
  if (!procs) return;
  try { procs.ytdlp.kill('SIGKILL'); } catch {}
  try { procs.ffmpeg.kill('SIGKILL'); } catch {}
  activeProcesses.delete(guildId);
}

interface SongInfo {
  title: string;
  url: string;
  duration: string;
}

export async function getSongInfo(query: string): Promise<SongInfo> {
  return new Promise((resolve, reject) => {
    const isUrl = query.startsWith('http://') || query.startsWith('https://');
    const args = isUrl
      ? ['--no-playlist', '-j', query]
      : [`ytsearch1:${query}`, '--no-playlist', '-j'];

    const proc = spawn(YTDLP_PATH, args);
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk; });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk; });
    proc.on('error', reject);

    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
      try {
        const info = JSON.parse(stdout);
        const dur = info.duration ?? 0;
        resolve({
          title: info.title ?? 'Unknown',
          url: info.webpage_url ?? info.url ?? query,
          duration: `${Math.floor(dur / 60)}:${Math.floor(dur % 60).toString().padStart(2, '0')}`,
        });
      } catch {
        reject(new Error('yt-dlp 출력을 파싱할 수 없습니다'));
      }
    });
  });
}

export function createStream(url: string, guildId: string): Readable {
  killActiveProcesses(guildId);

  // yt-dlp downloads opus/webm (format 251), ffmpeg just copies the codec into ogg container
  const ytdlp = spawn(YTDLP_PATH, [
    '-o', '-',
    '-f', 'bestaudio[acodec=opus]/bestaudio',
    '--no-playlist',
    url,
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  // Copy opus stream (no re-encoding!) into ogg container for discord.js
  const ffmpeg = spawn(FFMPEG_PATH, [
    '-i', 'pipe:0',
    '-analyzeduration', '0',
    '-c:a', 'copy',
    '-f', 'ogg',
    '-loglevel', 'warning',
    'pipe:1',
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  activeProcesses.set(guildId, { ytdlp, ffmpeg });

  ytdlp.stdout.pipe(ffmpeg.stdin);

  // Suppress EPIPE errors on pipes
  for (const stream of [ytdlp.stdout, ffmpeg.stdin, ffmpeg.stdout]) {
    stream.on('error', () => {});
  }

  ytdlp.stderr?.on('data', (chunk: Buffer) => {
    const msg = chunk.toString().trim();
    if (msg) console.error(`[yt-dlp] ${msg}`);
  });
  ffmpeg.stderr?.on('data', (chunk: Buffer) => {
    const msg = chunk.toString().trim();
    if (msg) console.error(`[ffmpeg] ${msg}`);
  });

  ytdlp.on('error', () => { try { ffmpeg.kill(); } catch {} });
  ffmpeg.on('error', () => { try { ytdlp.kill(); } catch {} });
  ytdlp.on('close', () => { try { ffmpeg.stdin.end(); } catch {} });
  ffmpeg.on('close', () => { activeProcesses.delete(guildId); });

  return ffmpeg.stdout;
}

export async function playSong(guildId: string, client: Client): Promise<void> {
  const queue = queueManager.get(guildId);
  if (!queue) return;

  if (queue.songs.length === 0) {
    queue.currentSong = null;
    queue.playing = false;
    killActiveProcesses(guildId);
    setTimeout(() => {
      const q = queueManager.get(guildId);
      if (q && !q.playing && q.songs.length === 0) {
        queueManager.delete(guildId);
      }
    }, 30_000);
    return;
  }

  const song = queue.songs.shift()!;
  queue.currentSong = song;
  queue.playing = true;

  try {
    const stream = createStream(song.url, guildId);
    const resource = createAudioResource(stream, {
      inputType: StreamType.OggOpus,
      inlineVolume: false,
    });

    queue.player.play(resource);
    queue.player.removeAllListeners(AudioPlayerStatus.Idle);
    queue.player.removeAllListeners('error');

    queue.player.on(AudioPlayerStatus.Idle, () => playSong(guildId, client));
    queue.player.on('error', (error) => {
      console.error(`플레이어 오류: ${error.message}`);
      killActiveProcesses(guildId);
      playSong(guildId, client);
    });

    // Disable buttons on previous now-playing message
    if (queue.nowPlayingMessage) {
      const disabledRow = createPlayerButtons(false);
      disabledRow.components.forEach(btn => btn.setDisabled(true));
      await queue.nowPlayingMessage.edit({ components: [disabledRow] }).catch(() => {});
      queue.nowPlayingMessage = null;
    }

    const channel = await client.channels.fetch(queue.textChannelId).catch(() => null);
    if (channel instanceof TextChannel) {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎵 지금 재생 중')
        .setDescription(`[**${song.title}**](${song.url})`)
        .addFields(
          { name: '⏱️ 길이', value: song.duration, inline: true },
          { name: '👤 신청자', value: song.requestedBy, inline: true },
        )
        .setFooter({ text: `대기열에 ${queue.songs.length}곡 남음` })
        .setTimestamp();

      const row = createPlayerButtons(false);
      const msg = await channel.send({ embeds: [embed], components: [row] }).catch(() => null);
      queue.nowPlayingMessage = msg;
    }
  } catch (error) {
    console.error('곡 재생 오류:', error);
    killActiveProcesses(guildId);
    playSong(guildId, client);
  }
}
