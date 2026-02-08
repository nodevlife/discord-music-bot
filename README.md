# 시로 뮤직 (Discord Music Bot)

Discord 음성채널에서 YouTube 음악을 재생하는 봇. Slash command 기반.

## Prerequisites

- [Bun](https://bun.sh) v1.0+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/) (libopus 지원 필요)
- Discord Bot Token ([Developer Portal](https://discord.com/developers/applications))

### macOS (Homebrew)

```bash
brew install yt-dlp ffmpeg
```

## Setup

```bash
git clone git@github.com:nodevlife/discord-music-bot.git
cd openclaw-discord-music
bun install
cp .env.example .env
```

`.env` 파일 수정:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
```

## Usage

```bash
# 실행
bun start

# 개발 모드 (파일 변경 시 자동 재시작)
bun dev
```

## Commands

| Command | Description |
|---------|-------------|
| `/play <query>` | YouTube URL 또는 검색어로 음악 재생 |
| `/skip` | 현재 곡 건너뛰기 |
| `/stop` | 재생 중지 + 큐 초기화 + 채널 퇴장 |
| `/queue` | 현재 대기열 확인 |
| `/pause` | 일시정지 |
| `/resume` | 재개 |
| `/nowplaying` | 현재 재생 중인 곡 정보 |

## Architecture

```
YouTube → yt-dlp (stream) → ffmpeg (WebM/Opus) → Discord Voice
```

- **yt-dlp**: YouTube에서 오디오 스트림 추출
- **ffmpeg**: libopus로 WebM/Opus 포맷으로 변환
- **@discordjs/voice**: Discord 음성채널로 전송

## Tech Stack

- [Bun](https://bun.sh) + TypeScript
- [discord.js](https://discord.js.org/) v14
- [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [ffmpeg](https://ffmpeg.org/)

## Notes

- yt-dlp, ffmpeg 경로는 `/opt/homebrew/bin/`으로 하드코딩됨 (macOS Homebrew 기준)
- 다른 환경이면 `src/utils/player.ts`의 `YTDLP_PATH`, `FFMPEG_PATH` 수정 필요
- Bun이 `.env` 자동 로드하므로 dotenv 불필요
- AI 에이전트용 콘텍스트는 `CLAUDE.md` 참고

## License

MIT
