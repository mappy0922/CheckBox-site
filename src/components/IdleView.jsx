import React from 'react';
import { Play, Sparkles, MessageSquare, CheckCircle2, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export default function IdleView({ onStartSession, botStatus, onOpenSettings }) {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* ヒーローセクション */}
      <div className="glass-panel" style={{
        padding: '48px 32px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 装飾の背景グラデーション */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(88, 101, 242, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: 'var(--radius-full)',
          background: 'rgba(88, 101, 242, 0.1)',
          border: '1px solid rgba(88, 101, 242, 0.25)',
          color: '#a5b4fc',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <Sparkles size={16} color="var(--accent-cyan)" />
          Discord チャンネル自動連携システム
        </div>

        <h2 style={{
          fontSize: '32px',
          fontWeight: 800,
          marginBottom: '16px',
          letterSpacing: '-0.02em',
          background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Discordで話すだけで、<br />チェックリストが自動で出来上がる
        </h2>

        <p style={{
          fontSize: '16px',
          color: 'var(--text-muted)',
          maxWidth: '560px',
          margin: '0 auto 36px',
          lineHeight: 1.6
        }}>
          起動ボタンを押して発行される4桁の認証コードを、Discordの任意のチャンネルで送信するだけ。
          そのチャンネル専用のチェックリストがリアルタイムで稼働します。
        </p>

        {/* 起動ボタン */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={onStartSession}
            className="btn-primary"
            style={{
              fontSize: '18px',
              padding: '16px 36px',
              borderRadius: 'var(--radius-md)'
            }}
          >
            <Play size={20} fill="#ffffff" />
            サイトを起動する
          </button>
        </div>

        {!botStatus.isReady && (
          <div style={{
            marginTop: '24px',
            padding: '12px 18px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 'var(--radius-md)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '14px',
            color: '#fcd34d'
          }}>
            <Zap size={18} />
            <span>Botがまだログインしていません。右上の設定からBotトークンを入力してください。</span>
            <button
              onClick={onOpenSettings}
              style={{
                background: 'rgba(245, 158, 11, 0.2)',
                color: '#fff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600
              }}
            >
              設定を開く
            </button>
          </div>
        )}
      </div>

      {/* 3ステップ利用ガイド */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(88, 101, 242, 0.15)',
            border: '1px solid rgba(88, 101, 242, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--accent-discord)',
            fontWeight: 800
          }}>
            1
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            起動 & コード発行
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            上の「起動する」ボタンを押すと、ワンタイムの起動コード（例: 4829）が画面に表示されます。
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--accent-cyan)',
            fontWeight: 800
          }}>
            2
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            Discordでコード送信
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            連携したいDiscordチャンネルにコードを送信。そのチャンネルとWebサイトが即座に同期されます。
          </p>
        </div>

        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--accent-emerald)',
            fontWeight: 800
          }}>
            3
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
            話すだけでチェック同期
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            「サラダ」と送信でアイテム追加。「サラダ購入」と送信で自動チェック！終わったらサイト側で停止。
          </p>
        </div>
      </div>
    </div>
  );
}
