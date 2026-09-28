import React from 'react';
import { 
  CheckSquare, 
  Radio, 
  Settings, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Bot
} from 'lucide-react';

export default function Header({ 
  botStatus, 
  soundEnabled, 
  setSoundEnabled, 
  onOpenSettings,
  sessionStatus
}) {
  return (
    <header className="glass-panel" style={{ 
      padding: '16px 24px', 
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* ロゴ & タイトル */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #5865F2, #38bdf8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(88, 101, 242, 0.4)'
        }}>
          <CheckSquare size={24} color="#ffffff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Discord Checkbox Sync
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--accent-cyan)',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              LIVE
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Discordの投稿からチェックリストを自動生成＆完了同期
          </p>
        </div>
      </div>

      {/* 右側: ステータス & コントロール */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Bot ステータスバッジ */}
        <div 
          onClick={onOpenSettings}
          title="クリックしてBot設定を開く"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            background: botStatus.isReady ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${botStatus.isReady ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: botStatus.isReady ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            boxShadow: botStatus.isReady ? '0 0 10px var(--accent-emerald)' : '0 0 10px var(--accent-rose)'
          }} />
          <Bot size={16} color={botStatus.isReady ? 'var(--accent-emerald)' : 'var(--accent-rose)'} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: botStatus.isReady ? '#6ee7b7' : '#fda4af' }}>
            {botStatus.isReady ? (botStatus.username || 'Bot接続中') : 'Bot未接続 / 設定'}
          </span>
        </div>

        {/* サウンド切り替えボタン */}
        <button 
          className="btn-ghost"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? '効果音: ON' : '効果音: OFF'}
          style={{ padding: '8px 12px' }}
        >
          {soundEnabled ? (
            <Volume2 size={18} color="var(--accent-cyan)" />
          ) : (
            <VolumeX size={18} color="var(--text-dim)" />
          )}
        </button>

        {/* 設定ボタン */}
        <button 
          className="btn-ghost"
          onClick={onOpenSettings}
          title="設定"
          style={{ padding: '8px 12px' }}
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
