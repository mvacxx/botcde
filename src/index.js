const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PermissionsBitField
} = require('discord.js');
const {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const play = require('play-dl');
const {
  token,
  autoRoleId,
  prefix,
  getFeatureSettings,
  ensureSettingsFile
} = require('./config');
const { startPanel } = require('./panel/server');

ensureSettingsFile();

if (!token) {
  throw new Error('DISCORD_TOKEN não foi configurado no .env');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Channel]
});

const queues = new Map();

function getGuildQueue(guildId) {
  if (!queues.has(guildId)) {
    const player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Stop }
    });

    queues.set(guildId, {
      player,
      songs: [],
      textChannel: null,
      voiceChannel: null,
      connection: null,
      playing: false
    });

    player.on(AudioPlayerStatus.Idle, () => {
      playNext(guildId).catch((err) => console.error('Erro ao avançar música:', err.message));
    });
  }

  return queues.get(guildId);
}

async function connectToVoiceChannel(message, queue) {
  queue.connection = joinVoiceChannel({
    channelId: queue.voiceChannel.id,
    guildId: message.guild.id,
    adapterCreator: message.guild.voiceAdapterCreator,
    selfDeaf: true
  });

  queue.connection.subscribe(queue.player);

  await entersState(queue.connection, VoiceConnectionStatus.Ready, 20_000);
}

async function playNext(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  const nextSong = queue.songs.shift();
  if (!nextSong) {
    queue.playing = false;
    queue.connection?.destroy();
    queue.connection = null;
    return;
  }

  queue.playing = true;
  const stream = await play.stream(nextSong.url, { discordPlayerCompatibility: true });
  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
    inlineVolume: true
  });

  queue.player.play(resource);
  await queue.textChannel?.send(`▶️ Tocando agora: **${nextSong.title}**`);
}

client.once('ready', () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'músicas no YouTube', type: ActivityType.Listening }],
    status: 'online'
  });

  startPanel(client);
});

client.on('guildMemberAdd', async (member) => {
  const featureFlags = getFeatureSettings();
  if (!featureFlags.autoRole) return;

  if (!autoRoleId) {
    console.warn('AUTO_ROLE_ID não configurado. Auto-cargo ignorado.');
    return;
  }

  try {
    const role = member.guild.roles.cache.get(autoRoleId);
    if (!role) {
      console.warn(`Cargo ${autoRoleId} não encontrado em ${member.guild.name}`);
      return;
    }

    await member.roles.add(role);
    console.log(`Auto-cargo aplicado para ${member.user.tag}`);
  } catch (error) {
    console.error('Erro ao aplicar auto-cargo:', error.message);
  }
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const featureFlags = getFeatureSettings();
  const args = message.content.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift()?.toLowerCase();

  if (command === 'play') {
    if (!featureFlags.music) {
      await message.reply('🎵 O player está desativado no painel.');
      return;
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      await message.reply('Entre em um canal de voz para usar o comando `-play`.');
      return;
    }

    const botMember = message.guild.members.me;
    const permissions = voiceChannel.permissionsFor(botMember);
    const canConnect = permissions?.has(PermissionsBitField.Flags.Connect);
    const canSpeak = permissions?.has(PermissionsBitField.Flags.Speak);

    if (!canConnect || !canSpeak) {
      await message.reply('Eu preciso de permissão para entrar e falar no canal de voz.');
      return;
    }

    const query = args.join(' ');
    if (!query) {
      await message.reply('Uso: `-play <nome da música ou link do YouTube>`');
      return;
    }

    try {
      const results = await play.search(query, { limit: 1 });
      if (!results.length) {
        await message.reply('Não encontrei resultados no YouTube para esse termo.');
        return;
      }

      const song = results[0];
      const queue = getGuildQueue(message.guild.id);
      queue.textChannel = message.channel;
      queue.voiceChannel = voiceChannel;
      queue.songs.push({ title: song.title, url: song.url });

      if (!queue.connection) {
        await connectToVoiceChannel(message, queue);
      }

      if (!queue.playing) {
        await playNext(message.guild.id);
      } else {
        await message.reply(`➕ Adicionada na fila: **${song.title}**`);
      }
    } catch (error) {
      console.error('Erro no comando play:', error.message);
      await message.reply('Não consegui tocar essa música. Verifique o link/termo e tente novamente.');
    }
  }

  if (command === 'skip') {
    const queue = queues.get(message.guild.id);
    if (!queue || (!queue.playing && queue.songs.length === 0)) {
      await message.reply('Não há fila ativa para pular músicas.');
      return;
    }

    queue.player.stop(true);
    await message.reply('⏭️ Música pulada.');
  }

  if (command === 'stop') {
    const queue = queues.get(message.guild.id);
    if (!queue) {
      await message.reply('Não há nenhuma música tocando agora.');
      return;
    }

    queue.songs = [];
    queue.playing = false;
    queue.player.stop(true);
    queue.connection?.destroy();
    queue.connection = null;
    await message.reply('⏹️ Reprodução encerrada.');
  }
});

client.login(token);
