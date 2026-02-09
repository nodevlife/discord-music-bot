import { Client, GatewayIntentBits, REST, Routes, type ChatInputCommandInteraction } from 'discord.js';

const { DISCORD_TOKEN, DISCORD_CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID) {
  console.error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
  process.exit(1);
}

import * as play from './commands/play';
import * as skip from './commands/skip';
import * as stop from './commands/stop';
import * as queue from './commands/queue';
import * as pause from './commands/pause';
import * as resume from './commands/resume';
import * as nowplaying from './commands/nowplaying';

interface Command {
  data: { name: string; toJSON(): unknown }[];
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands: Command[] = [play, skip, stop, queue, pause, resume, nowplaying];
const commandMap = new Map<string, Command>();
for (const cmd of commands) {
  for (const d of cmd.data) {
    commandMap.set(d.name, cmd);
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

async function registerCommands(): Promise<void> {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN!);
  try {
    console.log('슬래시 커맨드 등록 중...');
    const allCommandData = commands.flatMap(c => c.data.map(d => d.toJSON()));
    await rest.put(
      Routes.applicationCommands(DISCORD_CLIENT_ID!),
      { body: allCommandData },
    );
    console.log(`슬래시 커맨드 ${allCommandData.length}개 등록 완료.`);
  } catch (error) {
    console.error('커맨드 등록 실패:', error);
  }
}

client.once('clientReady', () => {
  console.log(`${client.user?.tag} 로그인 완료`);
  registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`${interaction.commandName} 실행 오류:`, error);
    const reply = { content: '❌ 오류가 발생했어요. 다시 시도해 주세요.', ephemeral: true as const };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply).catch(() => {});
    } else {
      await interaction.reply(reply).catch(() => {});
    }
  }
});

client.login(DISCORD_TOKEN);
