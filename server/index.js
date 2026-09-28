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
              content: `✅ **Webサイトとの連携を開始しました！**\n・アイテム（例: サラダ、納豆）を送るとリストに追加されます。\n・「サラダ購入」「納豆完了」のように送ると自動でチェックがつきます。`
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
            const newItem = {
              id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
              text: line,
              checked: false,
              createdAt: new Date().toISOString(),
              sourceUser: authorName,
              avatar: message.author.displayAvatarURL()
            };
            currentSession.items.push(newItem);
            newItems.push(newItem);
          }

          const addedNames = newItems.map(i => `「${i.text}」`).join(', ');
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

  // 4. 手動アイテム追加
  socket.on('add_item', (text) => {
    if (!text || !text.trim()) return;
    const newItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: text.trim(),
      checked: false,
      createdAt: new Date().toISOString(),
      sourceUser: 'Webサイト手動登録',
      avatar: null
    };
    currentSession.items.push(newItem);
    addLog('item_added', `手動でアイテム「${newItem.text}」を追加しました`);
    io.emit('session_update', currentSession);
  });

  // 5. アイテム削除
  socket.on('delete_item', (itemId) => {
    const index = currentSession.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      const removed = currentSession.items.splice(index, 1)[0];
      addLog('info', `「${removed.text}」を削除しました`);
      io.emit('session_update', currentSession);
    }
  });

  // 6. リストのクリア (全削除 or チェック済み削除)
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

  // 7. Botトークンの更新/接続
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
