import React, { useState } from 'react';
import { Copy, Check, Radio, AlertCircle, X, ShieldAlert } from 'lucide-react';

export default function WaitingCodeView({ pinCode, onCancel, botStatus }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!pinCode) return;
    navigator.clipboard.writeText(pinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="animate-pop-in" style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="glass-panel" style={{
        padding: '40px 32px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* キャンセルボタン */}
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          title="起動をキャンセル"
        >
          <X size={18} />
        </button>

        {/* 状態インジケータ */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: 'var(--radius-full)',
          color: 'var(--accent-cyan)',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--accent-cyan)',
            boxShadow: '0 0 10px var(--accent-cyan)',
            animation: 'floatAnim 1.5s infinite ease-in-out'
          }} />
          Discordからの確認コード入力を待機中...
        </div>

        <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          起動コードを入力してください
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          連携したいDiscordチャンネルで、以下の <strong style={{ color: '#fff' }}>4桁のコード</strong> をそのまま送信してください。
        </p>

        {/* 4桁コード表示パネル */}
        <div 
          onClick={handleCopy}
          className="animate-glow-pulse"
          style={{
            background: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid rgba(88, 101, 242, 0.5)',
            borderRadius: '20px',
            padding: '24px 32px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '24px',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            marginBottom: '28px'
          }}
        >
          <div style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '48px',
            fontWeight: 800,
            letterSpacing: '10px',
            color: '#ffffff',
            textShadow: '0 0 20px rgba(56, 189, 248, 0.6)'
          }}>
            {pinCode || '----'}
          </div>

          <button
            style={{
              background: copied ? 'var(--accent-emerald)' : 'rgba(88, 101, 242, 0.25)',
              border: `1px solid ${copied ? 'var(--accent-emerald)' : 'rgba(88, 101, 242, 0.5)'}`,
              color: '#ffffff',
              padding: '10px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'コピー済み' : 'コピー'}
          </button>
        </div>

        {/* ガイド注記 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'left',
          fontSize: '13px',
          color: 'var(--text-muted)',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start'
        }}>
          <AlertCircle size={18} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>
              チャンネルの自動特定について
            </div>
            コードを送信したチャンネルが自動的に特定され、そのチャンネル内の発言のみがこのWebサイトに反映されるようになります（他のチャンネルの会話は混ざりません）。
          </div>
        </div>

        <div style={{ marginTop: '24px' }}>
          <button onClick={onCancel} className="btn-ghost" style={{ fontSize: '13px' }}>
            キャンセルして待機画面に戻る
          </button>
        </div>
      </div>
    </div>
  );
}
