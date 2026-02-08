# CLAUDE.md — AI Agent Context

This file provides context for AI coding agents (Claude Code, Codex, etc.) working on this project.

## Project Overview

**openclaw-discord-music** (토모 뮤직) is a Discord music bot that plays YouTube audio in voice channels via slash commands.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) — runs TypeScript directly, no build step
- **Language**: TypeScript (strict mode)
- **Framework**: discord.js v14 + @discordjs/voice
- **Audio Pipeline**: yt-dlp → ffmpeg (copy) → OGG/Opus → Discord voice
- **Package Manager**: Bun (`bun install`, `bun.lock`)

## Architecture

```
src/
├── index.ts              # Entry point — client setup, command registration, event handlers
├── commands/             # Slash command handlers (one file per command)
│   ├── play.ts           # /play <query> — join voice, search/play YouTube audio
│   ├── skip.ts           # /skip — kill processes, skip to next song
│   ├── stop.ts           # /stop — kill processes, clear queue, leave channel
│   ├── pause.ts          # /pause — pause playback
│   ├── resume.ts         # /resume — resume playback
│   ├── queue.ts          # /queue — display queue as embed
│   └── nowplaying.ts     # /nowplaying — show current song as embed
└── utils/
    ├── player.ts         # Audio pipeline (yt-dlp + ffmpeg), process lifecycle
    └── queue.ts          # GuildQueue data structure + QueueManager singleton
```

## Audio Pipeline Detail

```
YouTube → yt-dlp (opus/webm, format 251) → stdout
  → pipe → ffmpeg (-c:a copy, -f ogg) → stdout
  → createAudioResource(StreamType.OggOpus)
  → Discord voice channel
```

**Key**: ffmpeg does NOT re-encode. It copies the Opus stream from WebM into an OGG container.
This avoids "Error parsing Opus packet header" and CPU overhead.

## Key Design Decisions

### Process Management
- `activeProcesses` Map tracks yt-dlp + ffmpeg `ChildProcess` per guild ID
- `killActiveProcesses(guildId)` sends `SIGKILL` to both — called on skip, stop, errors
- All pipe streams have `.on('error', () => {})` to suppress EPIPE during cleanup
- ffmpeg stderr is logged with `[ffmpeg]` prefix for debugging
- yt-dlp stderr is logged with `[yt-dlp]` prefix

### Queue System
- `QueueManager` singleton holds per-guild queues
- `QueueManager.delete()` stops player + destroys voice connection
- Auto-leave: 30 seconds after queue empties, bot disconnects

### Command Pattern
Each command file exports:
- `data`: `SlashCommandBuilder` instance
- `execute(interaction)`: async handler function

### Event Handling
- Uses `clientReady` (not `ready`) for discord.js v15 compatibility
- Slash commands registered globally via REST API on startup
- `AudioPlayerStatus.Idle` triggers next song playback
- Listeners are removed before re-attaching to prevent memory leaks

## Environment Variables

```env
DISCORD_TOKEN=<bot token>
DISCORD_CLIENT_ID=<application id>
```

Bun auto-loads `.env` — no dotenv package needed.

## Scripts

- `bun start` — production run
- `bun dev` — watch mode (auto-restart on changes)

## External Dependencies (system)

- **yt-dlp**: `/opt/homebrew/bin/yt-dlp` (macOS Homebrew)
- **ffmpeg**: `/opt/homebrew/bin/ffmpeg` (macOS Homebrew, needs libopus)
- Paths are hardcoded in `src/utils/player.ts` (`YTDLP_PATH`, `FFMPEG_PATH`)
- For other environments, update these constants

## Known Issues

- **TimeoutNegativeWarning**: Bun runtime emits this from @discordjs/voice internals. Harmless, cannot be suppressed. Does not affect playback.
- **EPIPE on skip/stop**: Expected when killing processes mid-stream. Suppressed by error handlers.

## Discord Bot Settings

- **App ID**: 1470056074190000290
- **Bot**: 토모 뮤직#8571
- **Intents**: Guilds, GuildVoiceStates
- **Permissions**: Connect, Speak, Send Messages, Embed Links, Read Message History, Use Slash Commands, Use Voice Activity
- **Scopes**: bot, applications.commands
- **Invite**: `https://discord.com/oauth2/authorize?client_id=1470056074190000290`

## Development Guidelines

- No build step — Bun runs `.ts` directly
- `type` imports preferred (`import type { ... }`)
- Error replies use `ephemeral: true`
- Embed messages for queue/nowplaying displays
- Keep absolute paths for yt-dlp/ffmpeg
- Don't re-encode Opus — always use `-c:a copy`
