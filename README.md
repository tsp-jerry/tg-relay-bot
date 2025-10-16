# Telegram 双向客服转发机器人（个人账号/群聊均可）

> 用户 ➜ **Bot** ➜ 你的“收件处”（个人账号 *或* 客服群）  
> 你**对那条转发的消息点“回复”** ➜ Bot 把回复发回用户  
> 支持文本 / 图片 / 语音 / 视频 / 文件（通过 `copyMessage` 原样转发）

---

## 这项目做什么？
- 用户给 **Bot** 发私聊消息，Bot **自动转发**到你指定的收件处（个人账号或群）。
- 你在收件处**对着那条转发的消息点“回复”**，Bot **回传**给该用户。
- 适合把个人号/小团队快速做成“轻量客服”。

---

## 准备工作

### 1) 创建机器人（@BotFather）
1. 在 Telegram 搜索 **@BotFather** → 发送 `/newbot`  
2. 按提示设置 **显示名** 与 **用户名**（必须以 `bot` 结尾，例如 `my_support_bot`）  
3. 记录返回的 **Bot Token**（形如 `123456:ABC-DEF...`）

> **如果用“群”做收件处**：  
> 发送 `/setprivacy` 给 @BotFather → 选择你的 Bot → 选 **Disable**（关闭隐私模式），否则 Bot 收不到群里的普通消息/回复。

### 2) 拿到你的收件处 ID（个人 `user_id` 或群 `chat_id`）
二选一：
- **个人账号作为收件处**（单人客服，**正整数** ID）  
  私聊 **@userinfobot** 或 **@getidsbot** → 它会回你的 `user_id`。
- **群作为收件处**（多人协作，**负数** ID）  
  把 Bot 拉进群（且上一步已关闭隐私模式）→ 在群里发 **/id** → 记录返回的 `chat.id`（形如 `-100xxxxxxxxxx`）。

> 注意：你自己也需要先给 **Bot** 发送一次消息（点 **Start**），Bot 才能给你发私聊。

---

## 安装与配置

### 3) 获取代码并安装依赖
```bash
git clone <your-repo-url> tg-relay-bot
cd tg-relay-bot
npm i
# 若是空目录：先 npm init -y，再 npm i telegraf dotenv
```

# 配置环境变量

先复制模板：
```bash
cp .env.example .env
```

# 运行与使用
5) 启动

临时前台：

node index.js


长期运行（PM2）：

npm i -g pm2
pm2 start index.js --name tg-relay-bot
pm2 save
# （可选）开机自启：pm2 startup


# 如何使用

你先用个人账号和 Bot 对话（点 Start），确认 Bot 能私聊你。

用户给 Bot 发消息 → 你（或你的群）会收到：

一条“来自 XX(id=…) 的提示”

紧接着 原消息的转发

你对着那条转发消息点击“回复”并发送 → Bot 会把你的回复回传给该用户（尽量引用其原消息）。

机器人内置命令：

/start：欢迎语

/id：回显 chat.id / from.id（获取 ID 时很好用）
