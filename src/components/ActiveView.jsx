import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  Plus, 
  PowerOff, 
  Radio, 
  CheckCircle2, 
  Clock, 
  User, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ActiveView({
  session,
  onStopSession,
  onToggleItem,
  onAddItem,
  onDeleteItem,
  onClearItems,
  soundEnabled
}) {
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [showLogs, setShowLogs] = useState(false);

  const items = session.items || [];
  const logs = session.logs || [];

  const completedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 手動追加ハンドラ
  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onAddItem(inputText);
    setInputText('');
  };

  // フィルタリング
  const filteredItems = items.filter(item => {
    if (filter === 'active') return !item.checked;
    if (filter === 'completed') return item.checked;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* 接続中ステータスバナー & 停止ボタン */}
      <div className="glass-panel" style={{
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        borderColor: 'rgba(16, 185, 129, 0.3)',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(19, 26, 42, 0.8) 100%)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: 'var(--accent-emerald)',
            boxShadow: '0 0 14px var(--accent-emerald)',
            animation: 'pulseGlow 2s infinite'
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                LIVE 連携中
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>•</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {session.guildName}
              </span>
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>#</span> {session.channelName}
            </div>
          </div>
        </div>

        {/* サイト側での起動停止ボタン */}
        <button
          onClick={onStopSession}
          className="btn-danger"
          style={{ padding: '10px 20px', fontSize: '14px' }}
          title="監視を終了して待機状態に戻ります"
        >
          <PowerOff size={16} />
          起動停止 (セッション終了)
        </button>
      </div>

      {/* 進捗プログレスバー */}
      <div className="glass-panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
              チェックリスト進捗
            </span>
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-muted)'
            }}>
              {completedCount} / {totalCount} 完了
            </span>
          </div>
          <span style={{
            fontSize: '18px',
            fontWeight: 800,
            color: progressPercent === 100 && totalCount > 0 ? 'var(--accent-emerald)' : 'var(--accent-cyan)'
          }}>
            {progressPercent}%
          </span>
        </div>

        <div style={{
          height: '10px',
          borderRadius: '999px',
          background: 'rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{
            height: '100%',
            width: `${progressPercent}%`,
            background: progressPercent === 100 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #5865F2, #38bdf8)',
            borderRadius: '999px',
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)'
          }} />
        </div>
      </div>

      {/* メインエリア: リスト & 操作 */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* 手動追加フォーム & コントロール */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* 追加フォーム */}
          <form onSubmit={handleManualAdd} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Discordで送信、またはここから直接アイテムを追加..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px 20px' }}>
              <Plus size={18} />
              追加
            </button>
          </form>

          {/* フィルター & 一括操作ボタン */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            {/* フィルタータブ */}
            <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '10px', gap: '4px' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: filter === 'all' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: filter === 'all' ? '#fff' : 'var(--text-muted)'
                }}
              >
                すべて ({totalCount})
              </button>
              <button
                onClick={() => setFilter('active')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: filter === 'active' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: filter === 'active' ? '#fff' : 'var(--text-muted)'
                }}
              >
                未完了 ({totalCount - completedCount})
              </button>
              <button
                onClick={() => setFilter('completed')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '7px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: filter === 'completed' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                  color: filter === 'completed' ? '#fff' : 'var(--text-muted)'
                }}
              >
                完了済 ({completedCount})
              </button>
            </div>

            {/* 一括削除メニュー */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {completedCount > 0 && (
                <button
                  onClick={() => onClearItems('completed')}
                  className="btn-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                >
                  <CheckCircle2 size={14} />
                  完了分を削除
                </button>
              )}
              {totalCount > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm('すべてのアイテムを削除してもよろしいですか？')) {
                      onClearItems('all');
                    }
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '12px', padding: '6px 12px', color: '#fda4af' }}
                >
                  <Trash2 size={14} />
                  すべて削除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* チェックボックスアイテム一覧 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredItems.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px',
              color: 'var(--text-dim)',
              fontSize: '14px'
            }}>
              <MessageSquare size={36} color="rgba(255, 255, 255, 0.15)" style={{ margin: '0 auto 12px' }} />
              <div>アイテムがまだありません</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Discordチャンネル <strong style={{ color: 'var(--accent-cyan)' }}>#{session.channelName}</strong> で「サラダ」「納豆」などのメッセージを送信してください。
              </div>
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                className="animate-pop-in"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: item.checked ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${item.checked ? 'rgba(16, 185, 129, 0.2)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* チェックボックス & アイテム名 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <label className="custom-checkbox-wrapper" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      className="custom-checkbox-input"
                      checked={item.checked}
                      onChange={() => onToggleItem(item.id)}
                    />
                    <Check size={16} strokeWidth={3} className="custom-checkbox-icon" />
                  </label>

                  <div style={{ flex: 1 }}>
                    <span style={{
                      fontSize: '16px',
                      fontWeight: 600,
                      color: item.checked ? 'var(--text-dim)' : 'var(--text-main)',
                      textDecoration: item.checked ? 'line-through' : 'none',
                      transition: 'all 0.2s'
                    }}>
                      {item.text}
                    </span>

                    {/* 送信者・タイムスタンプ情報 */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginTop: '4px',
                      fontSize: '12px',
                      color: 'var(--text-dim)'
                    }}>
                      {item.sourceUser && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} />
                          {item.sourceUser}
                        </span>
                      )}
                      {item.completedBy && item.checked && (
                        <span style={{ color: '#6ee7b7' }}>
                          ✓ {item.completedBy} が完了
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 削除ボタン */}
                <button
                  onClick={() => onDeleteItem(item.id)}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-dim)',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent-rose)'; e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-dim)'; e.currentTarget.style.background = 'transparent'; }}
                  title="削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Discordリアルタイム受信ログ (折りたたみ可能) */}
      <div className="glass-panel" style={{ padding: '16px 24px' }}>
        <div 
          onClick={() => setShowLogs(!showLogs)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>
              Discord 通信ログ ({logs.length})
            </span>
          </div>
          <button className="btn-ghost" style={{ padding: '4px 8px' }}>
            {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {showLogs && (
          <div className="animate-fade-in" style={{
            marginTop: '16px',
            maxHeight: '200px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            paddingRight: '6px'
          }}>
            {logs.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-dim)', textAlign: 'center', padding: '12px' }}>
                ログはまだありません
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  style={{
                    fontSize: '13px',
                    padding: '8px 12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: log.type === 'item_checked' ? '3px solid var(--accent-emerald)' : log.type === 'item_added' ? '3px solid var(--accent-cyan)' : '3px solid var(--accent-discord)'
                  }}
                >
                  <span style={{ color: '#e2e8f0' }}>{log.text}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '12px' }}>{log.timestamp}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
