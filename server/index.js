import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { Client, GatewayIntentBits, Partials, Events } from 'discord.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// --- Discord Bot Setup ---
let discordClient = null;
let botStatus = {
  isReady: false,
  username: null,
  avatar: null,
  error: null
};

// 完了判定用のキーワードリスト
const COMPLETION_KEYWORDS = [
  '購入', '買った', '買いました', '完了', '済', '済み', 'おわり', '終わり',
  'ok', 'OK', 'Ok', 'done', 'Done', 'check', 'Check', '買い終わった', '買ってきた', 'ゲット', 'get'
];

/**
 * 自然言語やメッセージから日時表現を抽出して ISO 文字列に変換する
 * 例: "サラダ 18:30まで", "納豆 明日 15:00", "牛乳 9/30 12:00まで"
 */
function parseDateTimeFromText(rawText) {
  let text = rawText.trim();
  let dueDate = null;
  const now = new Date();

  // パターン1: YYYY/MM/DD HH:mm or YYYY-MM-DD HH:mm
  const fullDateRegex = /(\d{4})[/-](\d{1,2})[/-](\d{1,2})\s+(\d{1,2}):(\d{2})(?:まで)?/i;
  const fullMatch = text.match(fullDateRegex);
  if (fullMatch) {
    const year = parseInt(fullMatch[1], 10);
    const month = parseInt(fullMatch[2], 10) - 1;
    const day = parseInt(fullMatch[3], 10);
    const hour = parseInt(fullMatch[4], 10);
    const minute = parseInt(fullMatch[5], 10);
    const d = new Date(year, month, day, hour, minute, 0);
    if (!isNaN(d.getTime())) {
      dueDate = d.toISOString();
      text = text.replace(fullMatch[0], '').trim();
      return { text, dueDate };
    }
  }

  // パターン2: MM/DD HH:mm or MM月DD日 HH:mm (例: 9/30 15:00, 9月30日 15:30まで)
  const monthDateRegex = /(\d{1,2})[月/](\d{1,2})日?\s*(\d{1,2}):(\d{2})(?:まで)?/i;
  const monthMatch = text.match(monthDateRegex);
  if (monthMatch) {
    const month = parseInt(monthMatch[1], 10) - 1;
    const day = parseInt(monthMatch[2], 10);
    const hour = parseInt(monthMatch[3], 10);
    const minute = parseInt(monthMatch[4], 10);
    let year = now.getFullYear();
    const d = new Date(year, month, day, hour, minute, 0);
    // 過去の日付（例: 現在12月で1月を指定した場合）は翌年に
    if (d.getTime() < now.getTime() - 86400000 * 30) {
      d.setFullYear(year + 1);
    }
    if (!isNaN(d.getTime())) {
      dueDate = d.toISOString();
      text = text.replace(monthMatch[0], '').trim();
      return { text, dueDate };
    }
  }

  // パターン3: 明日 / あす / あさって HH:mm or HH時mm分 (例: 明日 18:30まで, あす10:00)
  const relativeDateRegex = /(明日|あす|明後日|あさって)\s*(\d{1,2})(?::|時)(\d{2})?分?(?:まで)?/i;
  const relMatch = text.match(relativeDateRegex);
  if (relMatch) {
    const daysToAdd = (relMatch[1] === '明後日' || relMatch[1] === 'あさって') ? 2 : 1;
    const hour = parseInt(relMatch[2], 10);
    const minute = relMatch[3] ? parseInt(relMatch[3], 10) : 0;
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToAdd, hour, minute, 0);
    if (!isNaN(targetDate.getTime())) {
      dueDate = targetDate.toISOString();
      text = text.replace(relMatch[0], '').trim();
      return { text, dueDate };
    }
  }

  // パターン4: HH:mm or HH時mm分 or HH時 (例: 18:30まで, 18時30分まで, 18:00, 18時)
  const timeOnlyRegex = /(\d{1,2})(?::|時)(\d{2})?分?(?:まで)?/;
  const timeMatch = text.match(timeOnlyRegex);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1], 10);
    const minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      let targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
      // 指定時間が現時刻より過去なら翌日の同時刻とする
      if (targetDate.getTime() < now.getTime()) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      dueDate = targetDate.toISOString();
      text = text.replace(timeMatch[0], '').trim();
      return { text, dueDate };
    }
  }

  return { text, dueDate };
}

// セッション管理 (現在アクティブなセッション)
let currentSession = {
  sessionId: null,
  pinCode: null,
  status: 'idle', // 'idle' | 'waiting_code' | 'connected' | 'stopped'
  activeChannelId: null,
  activeGuildId: null,
  channelName: null,
  guildName: null,
  connectedAt: null,
  items: [],
  logs: []
};

function generatePinCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function addLog(type, text, user = null) {
  const logItem = {
    id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    type,
    text,
    user,
    timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  };
  currentSession.logs.unshift(logItem);
  if (currentSession.logs.length > 50) {
    currentSession.logs = currentSession.logs.slice(0, 50);
  }
  return logItem;
}

// 期限超過監視タイマー (10秒ごとに定期チェック)
setInterval(async () => {
  try {
    if (!discordClient || !botStatus.isReady) return;
    if (currentSession.status !== 'connected' || !currentSession.activeChannelId) return;

    const now = new Date();
    const itemsToRemind = [];

    for (const item of currentSession.items) {
      if (!item.checked && item.dueDate && !item.reminded) {
        const due = new Date(item.dueDate);
        if (now >= due) {
          itemsToRemind.push(item);
        }
      }
    }

    if (itemsToRemind.length === 0) return;

    const channel = await discordClient.channels.fetch(currentSession.activeChannelId).catch(() => null);
    if (!channel) return;

    for (const item of itemsToRemind) {
      item.reminded = true;
      item.remindedAt = now.toISOString();

      const dueDateObj = new Date(item.dueDate);
      const formattedDate = dueDateObj.toLocaleString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      // 送信者IDがあればメンション、なければ @here
      const mention = item.sourceUserId ? `<@${item.sourceUserId}>` : '@here';

      const reminderMessage = `⚠️ ${mention} **【期限超過リマインド】**\n登録されたアイテム「**${item.text}**」の期限（**${formattedDate}**）を過ぎました！`;

      try {
        await channel.send(reminderMessage);
        addLog('warning', `⚠️ 「${item.text}」の期限超過リマインドをDiscordに通知しました（期限: ${formattedDate}）`, item.sourceUser);
      } catch (err) {
        console.error('Failed to send reminder to Discord:', err);
      }
    }

    io.emit('session_update', currentSession);
  } catch (err) {
    console.error('Error in deadline watcher interval:', err);
  }
}, 10000);

// Bot初期化関数
async function initDiscordBot(token) {
  if (!token) {
    botStatus = { isReady: false, username: null, avatar: null, error: 'トークンが未設定です' };
    io.emit('bot_status', botStatus);
    return;
  }

  if (discordClient) {
    try {
      await discordClient.destroy();
    } catch (e) {
      console.error('Error destroying previous discord client:', e);
    }
  }

  discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel, Partials.Message]
  });

  discordClient.once(Events.ClientReady, (c) => {
    console.log(`Discord Bot ready: ${c.user.tag}`);
    botStatus = {
      isReady: true,
      username: c.user.username,
      avatar: c.user.displayAvatarURL(),
      error: null
    };
    io.emit('bot_status', botStatus);
  });

  discordClient.on(Events.MessageCreate, async (message) => {
    try {
      if (message.author.bot) return;

      const rawContent = message.content ? message.content.trim() : '';
      if (!rawContent) return;

      const authorName = message.member?.displayName || message.author.displayName || message.author.username;
      const authorId = message.author.id;

      // 1. 起動コード待機中の場合: 届いたメッセージが起動コードと一致するか判定
      if (currentSession.status === 'waiting_code' && currentSession.pinCode) {
        if (rawContent === currentSession.pinCode) {
          // チャンネルとセッションを紐付け！
          currentSession.status = 'connected';
          currentSession.activeChannelId = message.channel.id;
          currentSession.activeGuildId = message.guild?.id || null;
          currentSession.channelName = message.channel.name || 'DM';
          currentSession.guildName = message.guild?.name || 'ダイレクトメッセージ';
          currentSession.connectedAt = new Date().toISOString();

          addLog('system', `チャンネル「#${currentSession.channelName}」と連携開始しました！`, authorName);

          // Discord側にリアクションまたは確認メッセージ
          try {
            await message.react('🚀');
            await message.reply({
              content: `✅ **Webサイトとの連携を開始しました！**\n・アイテム（例: サラダ、納豆 18:30まで）を送るとリストに追加されます。\n・「サラダ購入」「納豆完了」のように送ると自動でチェックがつきます。\n・設定した期限を過ぎるとメンション通知が届きます。`
            });
          } catch (err) {
            console.error('Discord reply error:', err);
          }

          io.emit('session_update', currentSession);
          return;
        }
      }

      // 2. 連携中の場合: 対象チャンネルからのメッセージのみ処理
      if (currentSession.status === 'connected' && currentSession.activeChannelId === message.channel.id) {
        // A. 完了メッセージ判定
        // 既存の未完了アイテムを探す
        let matchedItem = null;
        let matchedKeyword = null;

        for (const item of currentSession.items) {
          if (!item.checked) {
            const itemText = item.text.trim();
            // メッセージにアイテム名が含まれているか確認
            if (rawContent.includes(itemText)) {
              // 完了キーワードが含まれているか確認
              for (const kw of COMPLETION_KEYWORDS) {
                if (rawContent.includes(kw)) {
                  matchedItem = item;
                  matchedKeyword = kw;
                  break;
                }
              }
            }
            if (matchedItem) break;
          }
        }

        if (matchedItem) {
          // アイテムにチェックを付ける
          matchedItem.checked = true;
          matchedItem.completedAt = new Date().toISOString();
          matchedItem.completedBy = authorName;

          addLog('item_checked', `「${matchedItem.text}」が完了になりました（トリガー: ${rawContent}）`, authorName);

          try {
            await message.react('✅');
          } catch (e) {
            console.error(e);
          }

          io.emit('session_update', currentSession);
          return;
        }

        // B. 新規アイテム追加判定（改行や読点区切りで複数アイテムにも対応）
        const lines = rawContent
          .split(/[\n,、]/)
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('//') && !s.startsWith('#'));

        if (lines.length > 0) {
          const newItems = [];
          for (const line of lines) {
            // 日時表現のパース抽出
            const { text: cleanText, dueDate } = parseDateTimeFromText(line);
            const itemTitle = cleanText || line;

            const newItem = {
              id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              text: itemTitle,
              checked: false,
              createdAt: new Date().toISOString(),
              sourceUser: authorName,
              sourceUserId: authorId,
              avatar: message.author.displayAvatarURL(),
              dueDate: dueDate,
              reminded: false
            };
            currentSession.items.push(newItem);
            newItems.push(newItem);
          }

          const addedNames = newItems.map(i => {
            if (i.dueDate) {
              const d = new Date(i.dueDate);
              const timeStr = `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
              return `「${i.text} (期限: ${timeStr})」`;
            }
            return `「${i.text}」`;
          }).join(', ');

          addLog('item_added', `新規アイテム ${addedNames} を追加しました`, authorName);

          try {
            await message.react('📝');
          } catch (e) {
            console.error(e);
          }

          io.emit('session_update', currentSession);
          return;
        }
      }
    } catch (err) {
      console.error('Error in messageCreate handler:', err);
    }
  });

  discordClient.on(Events.Error, (err) => {
    console.error('Discord client error:', err);
    botStatus = { isReady: false, username: null, avatar: null, error: err.message };
    io.emit('bot_status', botStatus);
  });

  try {
    await discordClient.login(token);
  } catch (err) {
    console.error('Failed to login to Discord:', err);
    botStatus = { isReady: false, username: null, avatar: null, error: 'ログイン失敗: ' + err.message };
    io.emit('bot_status', botStatus);
  }
}

// Socket.io 通信ハンドラ
io.on('connection', (socket) => {
  // 初期状態をクライアントに送信
  socket.emit('bot_status', botStatus);
  socket.emit('session_update', currentSession);

  // 1. セッション起動 (起動コード発行)
  socket.on('start_session', () => {
    const code = generatePinCode();
    currentSession = {
      sessionId: 'sess_' + Date.now(),
      pinCode: code,
      status: 'waiting_code',
      activeChannelId: null,
      activeGuildId: null,
      channelName: null,
      guildName: null,
      connectedAt: null,
      items: currentSession.items || [],
      logs: currentSession.logs || []
    };
    addLog('system', `起動コード【${code}】を発行しました。Discordのチャンネルで送信してください。`);
    io.emit('session_update', currentSession);
  });

  // 2. セッション停止
  socket.on('stop_session', () => {
    if (currentSession.status === 'connected') {
      addLog('system', `サイト側からセッションを終了（監視停止）しました。`);
    }
    currentSession.status = 'idle';
    currentSession.pinCode = null;
    currentSession.activeChannelId = null;
    currentSession.channelName = null;
    currentSession.guildName = null;
    io.emit('session_update', currentSession);
  });

  // 3. アイテムの手動トグル (チェック/未チェック)
  socket.on('toggle_item', (itemId) => {
    const item = currentSession.items.find(i => i.id === itemId);
    if (item) {
      item.checked = !item.checked;
      if (item.checked) {
        item.completedAt = new Date().toISOString();
        item.completedBy = 'Webサイト操作';
        addLog('item_checked', `「${item.text}」を手動でチェックしました`);
      } else {
        item.completedAt = null;
        item.completedBy = null;
        addLog('info', `「${item.text}」のチェックを手動で解除しました`);
      }
      io.emit('session_update', currentSession);
    }
  });

  // 4. 手動アイテム追加 (期限指定にも対応)
  socket.on('add_item', (data) => {
    let text = '';
    let dueDate = null;

    if (typeof data === 'string') {
      text = data;
    } else if (data && typeof data === 'object') {
      text = data.text || '';
      dueDate = data.dueDate || null;
    }

    if (!text || !text.trim()) return;

    // テキスト内の自然言語日時も解析
    if (!dueDate) {
      const parsed = parseDateTimeFromText(text);
      text = parsed.text || text;
      dueDate = parsed.dueDate;
    }

    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: text.trim(),
      checked: false,
      createdAt: new Date().toISOString(),
      sourceUser: 'Webサイト手動登録',
      sourceUserId: null,
      avatar: null,
      dueDate: dueDate,
      reminded: false
    };
    currentSession.items.push(newItem);
    addLog('item_added', `手動でアイテム「${newItem.text}」${dueDate ? ` (期限: ${new Date(dueDate).toLocaleString('ja-JP')})` : ''} を追加しました`);
    io.emit('session_update', currentSession);
  });

  // 5. 期限の更新・削除
  socket.on('update_item_due_date', ({ itemId, dueDate }) => {
    const item = currentSession.items.find(i => i.id === itemId);
    if (item) {
      item.dueDate = dueDate || null;
      item.reminded = false; // 期限を変更した場合はリマインド状態をリセット
      const logText = dueDate 
        ? `「${item.text}」の期限を ${new Date(dueDate).toLocaleString('ja-JP')} に設定しました` 
        : `「${item.text}」の期限を解除しました`;
      addLog('info', logText);
      io.emit('session_update', currentSession);
    }
  });

  // 6. アイテム削除
  socket.on('delete_item', (itemId) => {
    const index = currentSession.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      const removed = currentSession.items.splice(index, 1)[0];
      addLog('info', `「${removed.text}」を削除しました`);
      io.emit('session_update', currentSession);
    }
  });

  // 7. リストのクリア (全削除 or チェック済み削除)
  socket.on('clear_items', ({ type }) => {
    if (type === 'completed') {
      const remaining = currentSession.items.filter(i => !i.checked);
      const count = currentSession.items.length - remaining.length;
      currentSession.items = remaining;
      addLog('info', `完了済みアイテム ${count} 件を削除しました`);
    } else if (type === 'all') {
      currentSession.items = [];
      addLog('info', `すべてのアイテムをクリアしました`);
    }
    io.emit('session_update', currentSession);
  });

  // 8. Botトークンの更新/接続
  socket.on('set_bot_token', async (token) => {
    if (token && token.trim()) {
      await initDiscordBot(token.trim());
    }
  });
});

// REST API エンドポイント (ヘルスチェックや設定用)
app.get('/api/status', (req, res) => {
  res.json({
    bot: botStatus,
    session: currentSession
  });
});

// 起動時に環境変数のトークンがあればBot起動
const initialToken = process.env.DISCORD_BOT_TOKEN;
if (initialToken) {
  initDiscordBot(initialToken);
}

httpServer.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
