// index.js  —— personal account relay
require('dotenv').config();
const { Telegraf } = require('telegraf');

const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPPORT_CHAT_ID = Number(process.env.SUPPORT_CHAT_ID); // 你的个人 user_id（正数）
const STAFF_IDS = (process.env.STAFF_IDS || '')
  .split(',')
  .map(s => Number(s.trim()))
  .filter(Boolean);

if (!BOT_TOKEN || !SUPPORT_CHAT_ID) {
  console.error('请在 .env 中设置 BOT_TOKEN 和 SUPPORT_CHAT_ID');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const bridge = new Map(); // key: `${chatId}:${msgId}` -> { userId, userMsgId, ts }

const keyOf = (chatId, msgId) => `${chatId}:${msgId}`;
const isStaff = (uid) => STAFF_IDS.includes(uid);

// 纯 ASCII 的转义函数（避免中文引号导致的语法错误）
const esc = (s = '') =>
  s.replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[m]);

const nameOf = (u = {}) =>
  u.username ? '@' + u.username : [u.first_name || '', u.last_name || ''].join(' ').trim() || `id:${u.id || ''}`;

bot.start((ctx) => ctx.reply('你好，我是客服，有什么可以帮你。'));
bot.command('id', (ctx) => ctx.reply(`chat.id=${ctx.chat.id}\nfrom.id=${ctx.from?.id}`));

// A) 用户 → 私聊发给 Bot：转发到你的个人账号
bot.on('message', async (ctx) => {
  const m = ctx.message;

  if (m.chat.type === 'private' && !isStaff(m.from.id)) {
    const header =
      `📩 来自 ${esc(nameOf(m.from))} (id=${m.from.id})\n` +
      `🧵 请“直接回复下面这条消息”，你的回复会回到该用户`;
    await ctx.telegram.sendMessage(SUPPORT_CHAT_ID, header, { parse_mode: 'HTML' });

    const sent = await ctx.telegram.copyMessage(SUPPORT_CHAT_ID, m.chat.id, m.message_id);
    bridge.set(keyOf(SUPPORT_CHAT_ID, sent.message_id), {
      userId: m.chat.id,
      userMsgId: m.message_id,
      ts: Date.now(),
    });
    return;
  }

  // B) 你 ↔ Bot 的私聊里，回复那条转发消息 → 回到原用户
  if (m.chat.id === SUPPORT_CHAT_ID && m.reply_to_message) {
    const ref = bridge.get(keyOf(m.chat.id, m.reply_to_message.message_id));
    if (ref) {
      try {
        await ctx.telegram.copyMessage(ref.userId, m.chat.id, m.message_id, {
          reply_to_message_id: ref.userMsgId,
          allow_sending_without_reply: true,
        });
      } catch (e) {
        await ctx.reply(`⚠️ 发送失败：${e.description || e.message}`);
      }
    }
  }
});

// 过期清理（7 天）
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of bridge.entries()) if (now - v.ts > 7 * 24 * 3600 * 1000) bridge.delete(k);
}, 3600 * 1000);

bot.launch().then(() => console.log('tg-relay-bot started (personal account mode).'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
