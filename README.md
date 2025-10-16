Telegram 双向客服转发机器人（个人账号 / 群聊均可）

用户 ➜ Bot ➜ 你的“收件处”（个人账号 或 客服群）
你对那条转发的消息点“回复” ➜ Bot 再把回复发回给原用户
支持文本 / 图片 / 语音 / 视频 / 文件（通过 copyMessage 原样转发）

0. 项目做什么？

把用户发给 Bot 的私聊消息，自动转发到你配置的收件处（你的个人账号或一个群）。

你在收件处对着那条消息“回复”，Bot 自动把你的回复回传给该用户。

适合把个人号/小团队做成“简易客服”。

1) 如何创建机器人（@BotFather）

在 Telegram 搜索 @BotFather，发送 /newbot

按提示输入：显示名、用户名（必须以 bot 结尾，如 my_support_bot）

记录返回的 Bot Token（形如 123456:ABC-DEF...）

（可选，仅当“用群做收件处”时需要）关闭隐私模式：

给 @BotFather 发送 /setprivacy → 选择你的 Bot → 选 Disable

目的：让 Bot 能在群里收到普通消息/回复

提示：若不小心泄露了 Token，可在 @BotFather 用 /token 重新生成，或 /revoke 撤销旧 Token。

2) 如何拿到你的个人 user_id（作为收件处）

任选一种方式：

方式 A（最简单）：在 Telegram 搜索并私聊 @userinfobot（或 @getidsbot），它会回你的 user_id（正整数）。

方式 B（用本项目）：等项目跑起来后，给你的 Bot 发送 /id，它会回显 chat.id / from.id。

个人账号私聊里的 from.id 就是你的 user_id

如果将群作为收件处，把 Bot 拉进群（且隐私模式已禁用），在群里发 /id，返回的 chat.id（负数） 就是该群的 chat_id

重要规则：Bot 不能主动给从未和它对话的用户发消息。
你自己也要先给 Bot 发 “Start / 任何消息”，Bot 才能给你（个人账号）发私聊消息。
