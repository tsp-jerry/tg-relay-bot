// index.js — Telegram 双向客服转发（个人账号收件）
// 需求点：用户端不出现“引用”样式；收件处不再显示“请直接回复…”那行

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

// 内存映射：key = `${supportChatId}:${forwardedMsgId}` -> { userId, userMsgId, ts }
const bridge = new Map();

const keyOf = (chatId, msgId) => `${chatId}:${msgId}`;
const isStaff = (uid) => STAFF_IDS.includes(uid);

// 纯 ASCII 转义，避免奇怪引号导致语法问题
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

// 简单命令
bot.start((ctx) => ctx.reply('你好，我是客服，有什么可以帮你。'));
bot.command('id', (ctx) => ctx.reply(`chat.id=${ctx.chat.id}\nfrom.id=${ctx.from?.id}`));

/**
 * A) 用户给 Bot 发私聊消息：转发到“收件处”（你的个人账号）
 */
bot.on('message', async (ctx) => {
  const m = ctx.message;

  // 普通用户（非客服）在私聊里发送
  if (m.chat.type === 'private' && !isStaff(m.from.id)) {
    // 只保留一行来源提示（不再提示“请直接回复…”）
    await ctx.telegram.sendMessage(
      SUPPORT_CHAT_ID,
      `📩 来自 ${esc(nameOf(m.from))} (id=${m.from.id})`,
      { parse_mode: 'HTML' }
    );

    // 把用户原消息复制到你的收件处，并记录映射（用于后续你回复时路由回用户）
    const sent = await ctx.telegram.copyMessage(SUPPORT_CHAT_ID, m.chat.id, m.message_id);
    bridge.set(keyOf(SUPPORT_CHAT_ID, sent.message_id), {
      userId: m.chat.id,
      userMsgId: m.message_id,
      ts: Date.now(),
    });
    return;
  }

  /**
   * B) 你在与 Bot 的私聊（SUPPORT_CHAT_ID）里，回复那条“转发过来的消息”，
   *    机器人把你的消息再发回给对应用户。
   *    —— 注意：这里 **不再** 传 reply_to_message_id，用户端不会出现“引用头”。
   */
  if (m.chat.id === SUPPORT_CHAT_ID && m.reply_to_message) {
    const ref = bridge.get(keyOf(m.chat.id, m.reply_to_message.message_id));
    if (ref) {
      try {
        // 不带 reply_to_message_id —— 客户端不会显示“— 引用”
        await ctx.telegram.copyMessage(ref.userId, m.chat.id, m.message_id);
      } catch (e) {
        await ctx.reply(`⚠️ 发送失败：${e.description || e.message}`);
      }
    }
  }
});

// 定期清理过期映射（默认 7 天）
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of bridge.entries()) {
    if (now - v.ts > 7 * 24 * 3600 * 1000) bridge.delete(k);
  }
}, 3600 * 1000);

bot.launch().then(() => {
  console.log('tg-relay-bot started (personal account mode).');
});
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
