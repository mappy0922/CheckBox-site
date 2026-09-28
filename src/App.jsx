import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import Header from './components/Header';
import IdleView from './components/IdleView';
import WaitingCodeView from './components/WaitingCodeView';
import ActiveView from './components/ActiveView';
import SettingsModal from './components/SettingsModal';
import { playSound } from './utils/sound';

const SOCKET_SERVER_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001' 
  : window.location.origin;

export default function App() {
  const [socket, setSocket] = useState(null);
  const [botStatus, setBotStatus] = useState({ isReady: false, username: null });
  const [session, setSession] = useState({
    status: 'idle',
    pinCode: null,
    items: [],
    logs: []
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const prevItemsCountRef = useRef(0);
  const prevCheckedCountRef = useRef(0);
  const prevStatusRef = useRef('idle');

  // Socket.io 接続
  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to backend server');
    });

    newSocket.on('bot_status', (status) => {
      setBotStatus(status);
    });

    newSocket.on('session_update', (updatedSession) => {
      setSession(prev => {
        // ステータス変化による効果音・演出
        if (prev.status === 'waiting_code' && updatedSession.status === 'connected') {
          if (soundEnabled) playSound('connect');
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
        } else if (prev.status === 'connected' && updatedSession.status === 'idle') {
          if (soundEnabled) playSound('stop');
        }

        // アイテム追加/完了チェックによる効果音
        const prevItems = prev.items || [];
        const nextItems = updatedSession.items || [];

        if (nextItems.length > prevItems.length) {
          if (soundEnabled) playSound('add');
        } else {
          const prevChecked = prevItems.filter(i => i.checked).length;
          const nextChecked = nextItems.filter(i => i.checked).length;
          if (nextChecked > prevChecked) {
            if (soundEnabled) playSound('check');
            // 全完了時のConfetti
            if (nextChecked === nextItems.length && nextItems.length > 0) {
              confetti({
                particleCount: 120,
                spread: 100,
                origin: { y: 0.5 }
              });
            }
          }
        }

        return updatedSession;
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [soundEnabled]);

  // アクションハンドラ
  const handleStartSession = () => {
    if (socket) {
      socket.emit('start_session');
    }
  };

  const handleStopSession = () => {
    if (socket) {
      socket.emit('stop_session');
    }
  };

  const handleToggleItem = (itemId) => {
    if (socket) {
      socket.emit('toggle_item', itemId);
    }
  };

  const handleAddItem = (text) => {
    if (socket) {
      socket.emit('add_item', text);
    }
  };

  const handleDeleteItem = (itemId) => {
    if (socket) {
      socket.emit('delete_item', itemId);
    }
  };

  const handleClearItems = (type) => {
    if (socket) {
      socket.emit('clear_items', { type });
    }
  };

  const handleSaveBotToken = (token) => {
    if (socket) {
      socket.emit('set_bot_token', token);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px', minHeight: '100vh' }}>
      {/* 共通ヘッダー */}
      <Header
        botStatus={botStatus}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSettings={() => setIsSettingsOpen(true)}
        sessionStatus={session.status}
      />

      {/* メインコンテンツ表示切り替え */}
      <main>
        {session.status === 'idle' && (
          <IdleView
            onStartSession={handleStartSession}
            botStatus={botStatus}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}

        {session.status === 'waiting_code' && (
          <WaitingCodeView
            pinCode={session.pinCode}
            onCancel={handleStopSession}
            botStatus={botStatus}
          />
        )}

        {session.status === 'connected' && (
          <ActiveView
            session={session}
            onStopSession={handleStopSession}
            onToggleItem={handleToggleItem}
            onAddItem={handleAddItem}
            onDeleteItem={handleDeleteItem}
            onClearItems={handleClearItems}
            soundEnabled={soundEnabled}
          />
        )}
      </main>

      {/* 設定モーダル */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveToken={handleSaveBotToken}
        botStatus={botStatus}
      />
    </div>
  );
}