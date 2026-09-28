import React, { useState } from 'react';
import { X, Key, ExternalLink, Check, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, onSaveToken, botStatus }) {
  const [tokenInput, setTokenInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    onSaveToken(tokenInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="glass-panel animate-pop-in" style={{
        maxWidth: '540px',
        width: '100%',
        padding: '32px',
        position: 'relative',
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={16} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Key size={20} color="var(--accent-discord)" />
          <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Discord Bot 設定</h2>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Discord Developer Portal で作成したBotのトークンを設定します。
        </p>

        {/* トークン入力フォーム */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: '#e2e8f0' }}>
              Bot Token (トークン)
            </label>
            <input
              type="password"
              placeholder="例: MTEx..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '14px',
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} className="btn-ghost">
              キャンセル
            </button>
            <button type="submit" className="btn-primary">
              {savedSuccess ? <Check size={16} /> : null}
              {savedSuccess ? '接続しました！' : '保存してBotに接続'}
            </button>
          </div>
        </form>

        {/* セットアップガイド */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <div style={{ fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--accent-cyan)" />
            Bot設定の重要チェック項目
          </div>
          <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px', lineHeight: 1.5 }}>
            <li>
              <a 
                href="https://discord.com/developers/applications" 
                target="_blank" 
                rel="noreferrer"
                style={{ color: 'var(--accent-cyan)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Discord Developer Portal <ExternalLink size={10} />
              </a> でBotを作成
            </li>
            <li>
              Bot設定画面の <strong>Privileged Gateway Intents</strong> にて、<strong style={{ color: '#fff' }}>「MESSAGE CONTENT INTENT」</strong> を必ず <strong>ON</strong> にしてください（メッセージを読み取るために必須です）。
            </li>
            <li>
              OAuth2 → URL Generator で <strong>bot</strong> 権限（メッセージ送信・メッセージ履歴閲覧・リアクション追加）を選択してサーバーに招待してください。
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
