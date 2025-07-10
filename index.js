const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const express = require('express');
require('dotenv').config();

const app = express();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ===== إعدادات ثابتة =====
const PREFIX = '+';
const ACCEPT_COMMAND = '+عسكريه';
const APPLY_COMMAND = '+عسكرية';
const ACTIVATE_COMMAND = '+تفعيل';
const VOTE_COMMAND = '+قيم';
const GIVE_ROLE_COMMAND = '+ر';
const REMOVE_ROLE_COMMAND = '-ر';

const MILITARY_CHANNEL_ID = '1375565013095419965';
const VOTE_COMMAND_CHANNEL_ID = '1382231934511480883';
const VOTE_RESULT_CHANNEL_ID = '1382205551273840640';
const AUTO_CHANNEL_ID = '1392184409263968398';
const VOICE_CHANNEL_ID = '1392297222791626833';
const ROLE_COMMAND_CHANNEL_ID = '1373393688398401566';

const MILITARY_ROLES = [
  '1392165074466246868',
  '1375264243099766884',
  '1375255759142522900',
  '1392164508528803932',
  '1375274426064703630',
  '1375255941649535126'
];
const MILITARY_ACCEPT_ROLE_ID = '1385699383726833664';
const ACTIVATE_GIVE_ROLES = ['1375267739777765467', '1373393688398401566'];
const ACTIVATE_REMOVE_ROLE = '1373575057548382268';

const ADMIN_ROLE_ID = '1373021014325461203';
const HOW_TO_ENTER_CHANNEL_ID = '1392245741409538058';
const EMBED_IMAGE = 'https://cdn.discordapp.com/attachments/1391768888391237743/1392235052888494090/png.png?ex=686ecb6f&is=686d79ef&hm=70696ef3095b0ac6e41fd35e6610a6e4eba06078921aefa8b016b69cb06b39aa&';

const applications = new Map();
const voting = new Map();

// ===== تشغيل البوت =====
client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(VOICE_CHANNEL_ID);
    if (channel?.isVoiceBased()) {
      joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
        selfMute: true
      });
      console.log('🔊 دخل الروم الصوتي');
    }
  } catch (err) {
    console.error('❌ خطأ في دخول الصوت:', err);
  }

  setInterval(() => {
    const autoChannel = client.channels.cache.get(AUTO_CHANNEL_ID);
    if (autoChannel) autoChannel.send('101 🎾');
  }, 240000);
});

// ===== أوامر البوت =====
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  // أوامر إعطاء/سحب الرتب
  if (message.channel.id === ROLE_COMMAND_CHANNEL_ID) {
    if (![GIVE_ROLE_COMMAND, REMOVE_ROLE_COMMAND].some(cmd => message.content.startsWith(cmd))) return;

    if (!message.member.roles.cache.has(ADMIN_ROLE_ID))
      return message.reply('❌ ما عندك صلاحية.');

    const [cmd, _, userMention, roleMention] = message.content.split(' ');
    const user = message.mentions.members.first();
    const role = message.mentions.roles.first();

    if (!user || !role) return message.reply('❌ تأكد من منشن العضو والرتبة.');

    const bot = message.guild.members.me;
    if (role.position >= bot.roles.highest.position)
      return message.reply('❌ الرتبة أعلى من رتبة البوت.');

    if (cmd === GIVE_ROLE_COMMAND) {
      await user.roles.add(role).catch(() => {});
      return message.reply(`✅ تم إعطاء <@&${role.id}> إلى ${user}`);
    } else if (cmd === REMOVE_ROLE_COMMAND) {
      await user.roles.remove(role).catch(() => {});
      return message.reply(`✅ تم إزالة <@&${role.id}> من ${user}`);
    }
  }

  // أمر التفعيل
  if (message.content.startsWith(ACTIVATE_COMMAND)) {
    if (!message.member.roles.cache.has(ADMIN_ROLE_ID))
      return message.reply('❌ ما عندك صلاحية.');

    const member = message.mentions.members.first() || message.member;
    const name = message.content.split(' ').slice(2).join(' ') || null;

    for (const roleId of ACTIVATE_GIVE_ROLES)
      await member.roles.add(roleId).catch(() => {});
    await member.roles.remove(ACTIVATE_REMOVE_ROLE).catch(() => {});
    if (name) await member.setNickname(name).catch(() => {});
    return message.reply(`✅ تم التفعيل لـ ${member}`);
  }

  // تقديم عسكري
  if (message.channel.id === MILITARY_CHANNEL_ID && message.content === APPLY_COMMAND) {
    if (applications.has(message.author.id)) return;
    await message.delete().catch(() => {});
    const questions = ['اسمك:', 'عمرك:', 'خبراتك:', 'سبب تقديمك:', 'القطاع المقدم عليه:'];
    applications.set(message.author.id, { answers: [], step: 0, questions });
    const ask = await message.channel.send(questions[0]);
    applications.get(message.author.id).last = ask;
    return;
  }

  if (applications.has(message.author.id)) {
    const app = applications.get(message.author.id);
    app.answers.push(message.content);
    await message.delete().catch(() => {});
    if (app.last) app.last.delete().catch(() => {});
    app.step++;
    if (app.step < app.questions.length) {
      const next = await message.channel.send(app.questions[app.step]);
      app.last = next;
    } else {
      const embed = {
        title: '📩 استبيان تقديم وزارة الداخلية 👮🏻‍♀️',
        description: `
- اسمك: ${app.answers[0]}
- عمرك: ${app.answers[1]}
- خبراتك: ${app.answers[2]}
- سبب تقديمك: ${app.answers[3]}
- القطاع المقدم عليه: ${app.answers[4]}

هل مستعد للإلتزام بجميع القوانين العسكرية: ✅  
• سيتم الرد عليك من <@&${MILITARY_ACCEPT_ROLE_ID}>
        `,
        color: 0x2ecc71,
        footer: { text: `ID المستخدم: ${message.author.id}` }
      };
      await message.channel.send({ embeds: [embed] });
      applications.delete(message.author.id);
    }
    return;
  }

  // قبول عسكري
  if (message.content === ACCEPT_COMMAND && message.channel.id === MILITARY_CHANNEL_ID) {
    if (!message.member.roles.cache.has(MILITARY_ACCEPT_ROLE_ID))
      return message.reply('❌ ما عندك صلاحية.');
    if (!message.reference) return message.reply('❌ رد على رسالة التقديم.');
    const targetMsg = await message.channel.messages.fetch(message.reference.messageId).catch(() => {});
    const userId = targetMsg?.embeds[0]?.footer?.text?.match(/ID المستخدم: (\d+)/)?.[1];
    if (!userId) return message.reply('❌ معرف غير موجود.');
    const target = await message.guild.members.fetch(userId).catch(() => {});
    if (!target) return message.reply('❌ العضو مو في السيرفر.');
    for (const r of MILITARY_ROLES) await target.roles.add(r).catch(() => {});
    await message.reply(`✅ تم قبول <@${userId}>`);
    return;
  }

  // تقييم (قيام)
  if (message.channel.id === VOTE_COMMAND_CHANNEL_ID && message.content === VOTE_COMMAND) {
    if (voting.has(message.author.id)) return;
    voting.set(message.author.id, { answers: [], step: 0 });
    const qs = [
      'ما هو معرّف الهوست؟',
      'ما هو معرّف المساعد؟',
      'ما هو موعد الرحلة؟',
      'ما هو موعد صعود الطائرة؟',
      'ما هو موعد الإقلاع؟'
    ];
    const ask = await message.channel.send(qs[0]);
    voting.get(message.author.id).last = ask;
    voting.get(message.author.id).questions = qs;
    return;
  }

  if (voting.has(message.author.id)) {
    const vote = voting.get(message.author.id);
    vote.answers.push(message.content);
    await message.delete().catch(() => {});
    if (vote.last) vote.last.delete().catch(() => {});
    vote.step++;
    if (vote.step < vote.questions.length) {
      const next = await message.channel.send(vote.questions[vote.step]);
      vote.last = next;
    } else {
      const embed = {
        description: `**__
معرّف الهوست :
${vote.answers[0]}

معرّف المساعد :
${vote.answers[1]}

موعد الرحلة :
${vote.answers[2]}

موعد صعود الطائرة :
${vote.answers[3]}

موعد الإقلاع :
${vote.answers[4]}

نرجو منكم عدم فتح الميكروفون أثناء الصعود إلى الطائرة.

وفي حال عدم معرفتكم بطريقة الدخول إلى الرحلة، يُرجى مراجعة قسم:
<#${HOW_TO_ENTER_CHANNEL_ID}>
__**`,
        color: 0x3498db,
        image: { url: EMBED_IMAGE }
      };
      const channel = client.channels.cache.get(VOTE_RESULT_CHANNEL_ID);
      if (channel) {
        await channel.send('@everyone');
        const sent = await channel.send({ embeds: [embed] });
        await sent.react('<:emojidis:1392274583712829624>');
      }
      voting.delete(message.author.id);
    }
    return;
  }
});

// Web server لـ UptimeRobot
app.get('/', (req, res) => res.send('Bot is alive!'));
app.listen(3000, () => console.log('🌐 Web server running'));

// مؤقت 16 ساعة (57600000 ملي ثانية)
setTimeout(() => {
  console.log('🛑 انتهت 16 ساعة، سيتم إيقاف البوت.');
  process.exit();
}, 16 * 60 * 60 * 1000); // 16 ساعة

client.login(process.env.TOKEN);
