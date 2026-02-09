# 토모 뮤직 🎵

Discord 음성채널에서 YouTube 음악을 재생하는 봇.
한국어/영어 슬래시 커맨드 지원, 재생 컨트롤 버튼 포함.

## 필수 조건

- [Bun](https://bun.sh) v1.0+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- [ffmpeg](https://ffmpeg.org/) (libopus 지원)
- Discord Bot Token ([Developer Portal](https://discord.com/developers/applications))

## 설치

```bash
git clone git@github.com:nodevlife/discord-music-bot.git
cd discord-music-bot
bun install
cp .env.example .env
```

`.env` 파일 수정:

```env
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
YTDLP_PATH=/path/to/yt-dlp       # 기본값: /opt/homebrew/bin/yt-dlp
FFMPEG_PATH=/path/to/ffmpeg       # 기본값: /opt/homebrew/bin/ffmpeg
```

## 실행

```bash
bun start        # 실행
bun dev          # 개발 모드 (파일 변경 시 자동 재시작)
```

## 커맨드

한국어와 영어 커맨드 모두 사용 가능합니다.

| 한국어 | English | 설명 |
|--------|---------|------|
| `/재생 <검색어>` | `/play <query>` | YouTube URL 또는 검색어로 음악 재생 |
| `/스킵` | `/skip` | 현재 곡 건너뛰기 |
| `/정지` | `/stop` | 재생 중지 + 대기열 초기화 + 채널 퇴장 |
| `/대기열` | `/queue` | 현재 대기열 확인 |
| `/일시정지` | `/pause` | 일시정지 |
| `/다시재생` | `/resume` | 다시 재생 |
| `/지금재생` | `/nowplaying` | 현재 재생 중인 곡 정보 |

## 재생 컨트롤 버튼

곡이 재생될 때 메시지에 컨트롤 버튼이 함께 표시됩니다:

- ⏸️ **일시정지** / ▶️ **다시재생** — 토글
- ⏭️ **스킵** — 다음 곡으로
- ⏹️ **정지** — 재생 중단 + 퇴장

## 아키텍처

```
YouTube → yt-dlp (opus/webm) → ffmpeg (copy, no re-encode) → OGG/Opus → Discord Voice
```

## 기술 스택

- [Bun](https://bun.sh) + TypeScript
- [discord.js](https://discord.js.org/) v14
- [@discordjs/voice](https://www.npmjs.com/package/@discordjs/voice)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) + [ffmpeg](https://ffmpeg.org/)
- opusscript (pure JS) + libsodium-wrappers (WASM)

## Docker

```bash
docker build -t tomo-music .
docker run --env-file .env tomo-music
```

Dockerfile에 yt-dlp, ffmpeg 포함되어 있어 별도 설치 불필요.

## License

MIT
