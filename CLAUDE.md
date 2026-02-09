# CLAUDE.md — AI Agent Context

AI 코딩 에이전트(Claude Code, Codex 등)를 위한 프로젝트 컨텍스트.

## 프로젝트 개요

**discord-music-bot** (토모 뮤직) — Discord 음성채널에서 YouTube 오디오를 재생하는 봇.
한국어/영어 이중 슬래시 커맨드 + 재생 컨트롤 버튼 UI.

## 기술 스택

- **런타임**: [Bun](https://bun.sh) — TypeScript 직접 실행, 빌드 단계 없음
- **언어**: TypeScript (strict mode)
- **프레임워크**: discord.js v14 + @discordjs/voice
- **오디오 파이프라인**: yt-dlp → ffmpeg (copy) → OGG/Opus → Discord voice
- **패키지 매니저**: Bun (`bun install`, `bun.lock`)
- **네이티브 애드온 없음**: opusscript (pure JS), libsodium-wrappers (WASM)

## 디렉토리 구조

```
src/
├── index.ts              # 엔트리포인트 — 클라이언트 설정, 커맨드 등록, 이벤트 핸들러, 버튼 인터랙션 처리
├── commands/             # 슬래시 커맨드 핸들러 (커맨드당 한 파일)
│   ├── play.ts           # /재생, /play — 음성 채널 입장, YouTube 오디오 재생
│   ├── skip.ts           # /스킵, /skip — 프로세스 kill, 다음 곡
│   ├── stop.ts           # /정지, /stop — 프로세스 kill, 대기열 초기화, 채널 퇴장
│   ├── pause.ts          # /일시정지, /pause
│   ├── resume.ts         # /다시재생, /resume
│   ├── queue.ts          # /대기열, /queue — 대기열 embed 표시
│   └── nowplaying.ts     # /지금재생, /nowplaying — 현재 곡 embed
└── utils/
    ├── buttons.ts        # 재생 컨트롤 버튼 빌더 (일시정지/스킵/정지)
    ├── player.ts         # 오디오 파이프라인 (yt-dlp + ffmpeg), 프로세스 라이프사이클
    └── queue.ts          # GuildQueue 데이터 구조 + QueueManager 싱글톤
```

## 커맨드 시스템

각 커맨드 파일은 다음을 export:
- `data`: `SlashCommandBuilder[]` 배열 (한국어 + 영어 커맨드)
- `execute(interaction)`: async 핸들러

`index.ts`에서 `flatMap`으로 모든 커맨드를 펼쳐 등록. 총 14개 커맨드 (7 한국어 + 7 영어).

## 오디오 파이프라인

```
YouTube → yt-dlp (opus/webm, format 251) → stdout
  → pipe → ffmpeg (-c:a copy, -f ogg) → stdout
  → createAudioResource(StreamType.OggOpus)
  → Discord voice channel
```

ffmpeg는 리인코딩 없이 Opus 스트림을 WebM에서 OGG 컨테이너로 복사만 함.

## 버튼 시스템

- `src/utils/buttons.ts`에서 `createPlayerButtons(paused)` 함수
- 곡 재생 시 embed 아래에 3개 버튼 표시: ⏸️ 일시정지, ⏭️ 스킵, ⏹️ 정지
- `index.ts`에서 `interactionCreate` 이벤트로 버튼 클릭 처리
- 일시정지/다시재생 토글 시 embed + 버튼 업데이트
- 다음 곡 재생 시 이전 메시지 버튼 자동 비활성화
- `GuildQueue.nowPlayingMessage`에 현재 재생 메시지 참조 저장

## 프로세스 관리

- `activeProcesses` Map으로 길드별 yt-dlp + ffmpeg ChildProcess 추적
- `killActiveProcesses(guildId)`로 SIGKILL — skip, stop, 에러 시 호출
- 모든 pipe 스트림에 `.on('error', () => {})` (EPIPE 억제)

## 큐 시스템

- `QueueManager` 싱글톤으로 길드별 큐 관리
- `QueueManager.delete()`로 플레이어 정지 + 음성 연결 해제
- 대기열 비면 30초 후 자동 퇴장

## 환경변수

```env
DISCORD_TOKEN=<bot token>
DISCORD_CLIENT_ID=<application id>
YTDLP_PATH=<yt-dlp 경로>      # 기본값: /opt/homebrew/bin/yt-dlp
FFMPEG_PATH=<ffmpeg 경로>    # 기본값: /opt/homebrew/bin/ffmpeg
```

Bun이 `.env` 자동 로드 — dotenv 불필요.

## Docker 배포

- Dockerfile: `oven/bun:1` 기반, ffmpeg + yt-dlp 포함
- Dokploy로 배포 (nodevlife org, autodeploy ON)
- Docker 환경 경로: `YTDLP_PATH=/usr/local/bin/yt-dlp`, `FFMPEG_PATH=/usr/bin/ffmpeg`

## Discord 봇 설정

- **App ID**: 1470056074190000290
- **Bot**: 토모 뮤직#8571
- **Intents**: Guilds, GuildVoiceStates
- **권한**: Connect, Speak, Send Messages, Embed Links, Read Message History, Use Slash Commands
- **Invite**: `https://discord.com/oauth2/authorize?client_id=1470056074190000290`

## UI/UX 규칙

- 모든 유저 메시지는 **한국어**
- Discord Embed 사용, 색상 테마:
  - `0x5865F2` (Blurple) — 재생, 대기열, 지금 재생 중
  - `0x57F287` (Green) — 대기열 추가, 다시 재생
  - `0xFEE75C` (Yellow) — 스킵, 일시정지
  - `0xED4245` (Red) — 정지, 오류
- 에러 응답은 `ephemeral: true`

## 알려진 이슈

- **TimeoutNegativeWarning**: @discordjs/voice 내부 경고. 무해함.
- **EPIPE on skip/stop**: 미드스트림 kill 시 예상된 동작. 에러 핸들러로 억제.

## 개발 가이드라인

- 빌드 단계 없음 — Bun이 `.ts` 직접 실행
- `type` import 선호 (`import type { ... }`)
- 절대 경로로 yt-dlp/ffmpeg 사용 (env 또는 상수)
- Opus 리인코딩 금지 — 항상 `-c:a copy`
- 네이티브 애드온 사용 금지 (Docker 호환성)
