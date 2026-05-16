import React from 'react';
import { KdsTaskDisplay, KitchenTaskStatus } from '@/types';
import { AlertTriangle, Ban, Check, Clock, Flame, Play } from 'lucide-react';

interface OrderCardProps {
  task: KdsTaskDisplay;
  now: Date;
  onStart: (taskId: number) => void;
  onDone: (taskId: number) => void;
  onCancel: (taskId: number) => void;
  loading: boolean;
}

type UrgencyLevel = 'waiting' | 'normal' | 'caution' | 'critical';

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

const getUrgency = (
  status: KitchenTaskStatus,
  startedAt: string | null,
  now: Date,
  expectedCookTime: number | null,
): UrgencyLevel => {
  if (status !== 'COOKING' || !startedAt) return 'waiting';
  const elapsed = (now.getTime() - new Date(startedAt).getTime()) / 1000;
  const threshold = expectedCookTime ?? 600;
  if (elapsed < threshold * 0.6) return 'normal';
  if (elapsed < threshold)       return 'caution';
  return 'critical';
};

const urgencyCardStyle: Record<UrgencyLevel, string> = {
  waiting:  'border-kds-border border-l-[3px] border-l-kds-gold/70',
  normal:   'border-kds-border border-l-[3px] border-l-kds-blueText',
  caution:  'border-amber-500/40 border-l-[3px] border-l-amber-400 bg-amber-950/10',
  critical: 'border-kds-redText/40 border-l-[3px] border-l-kds-redText bg-red-950/20',
};

const urgencyTimerStyle: Record<UrgencyLevel, string> = {
  waiting:  'text-gray-400',
  normal:   'text-kds-blueText',
  caution:  'text-amber-400',
  critical: 'text-kds-redText font-bold',
};

export const OrderCard: React.FC<OrderCardProps> = ({ task, now, onStart, onDone, onCancel, loading }) => {
  const elapsedSeconds = task.startedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(task.startedAt).getTime()) / 1000))
    : 0;

  const urgency = getUrgency(task.status, task.startedAt, now, task.expectedCookTime);

  return (
    <div
      className={`bg-kds-card rounded-xl p-4 flex flex-col gap-3 border transition-colors ${urgencyCardStyle[urgency]}`}
    >
      {/* ── Header: thumbnail + title + badge ───────────── */}
      <div className="flex gap-3">
        {/* Thumbnail */}
        {task.imageUrl ? (
          <img
            src={task.imageUrl}
            alt={task.dishName}
            className="w-14 h-14 rounded-lg object-cover shrink-0 border border-kds-border"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-black/30 border border-kds-border flex items-center justify-center shrink-0 text-gray-600 text-xl font-display select-none">
            {task.dishName.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-mono text-gray-500 bg-black/20 px-1.5 py-0.5 rounded shrink-0">
                  #{task.taskId}
                </span>
                {urgency === 'critical' && (
                  <AlertTriangle size={13} className="text-kds-redText shrink-0 animate-pulse" />
                )}
              </div>
              <h3 className="text-xl font-display text-white leading-tight">
                {task.dishName}
                {task.quantity > 1 && (
                  <span className="ml-1.5 text-kds-gold font-bold text-lg">×{task.quantity}</span>
                )}
              </h3>
              <p className="text-gray-500 text-xs mt-0.5">
                Bàn {task.tableId}
                <span className="mx-1 text-gray-700">•</span>
                Mục #{task.orderItemId}
              </p>
            </div>
            <StatusBadge status={task.status} />
          </div>
        </div>
      </div>

      {/* ── Notes ───────────────────────────────────────── */}
      {(task.itemNote || task.orderNote) && (
        <div className="space-y-1 bg-black/20 rounded-lg px-3 py-2 border border-kds-border/50">
          {task.itemNote && (
            <p className="text-xs text-amber-300/80 leading-snug">
              <span className="mr-1 text-gray-500">📝</span>
              {task.itemNote}
            </p>
          )}
          {task.orderNote && (
            <p className="text-xs text-gray-400 leading-snug">
              <span className="mr-1 text-gray-500">🗒</span>
              {task.orderNote}
            </p>
          )}
        </div>
      )}

      {/* ── Timer row ───────────────────────────────────── */}
      <div className={`text-sm flex items-center gap-2 ${urgencyTimerStyle[urgency]}`}>
        <Clock size={13} className="shrink-0" />
        {task.status === 'COOKING' && task.startedAt && (
          <>
            <span className="tabular-nums font-mono">
              {formatDuration(elapsedSeconds)}
              {urgency === 'caution' && (
                <span className="ml-1.5 text-xs font-sans font-normal text-amber-500">⚠ Chậm</span>
              )}
              {urgency === 'critical' && (
                <span className="ml-1.5 text-xs font-sans font-normal text-kds-redText">‼ Trễ</span>
              )}
            </span>
            {task.expectedCookTime && (
              <span className="ml-auto text-xs text-gray-600 font-sans tabular-nums">
                / {formatDuration(task.expectedCookTime)}
              </span>
            )}
          </>
        )}
        {task.status === 'DONE' && task.actualCookSeconds !== null && (
          <span className="tabular-nums font-mono text-gray-400">
            Thời gian: {formatDuration(task.actualCookSeconds)}
          </span>
        )}
        {task.status === 'CREATED' && (
          <>
            <span className="text-gray-500">Chưa bắt đầu</span>
            {task.expectedCookTime && (
              <span className="ml-auto text-xs text-gray-600">
                ~{Math.round(task.expectedCookTime / 60)} phút
              </span>
            )}
          </>
        )}
        {task.status === 'CANCELLED' && <span className="text-gray-600">Đã hủy</span>}
      </div>

      {/* ── Action ──────────────────────────────────────── */}
      <div className="mt-auto pt-1">
        <ActionButton task={task} onStart={onStart} onDone={onDone} onCancel={onCancel} loading={loading} />
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const ActionButton: React.FC<{
  task: KdsTaskDisplay;
  onStart: (id: number) => void;
  onDone: (id: number) => void;
  onCancel: (id: number) => void;
  loading: boolean;
}> = ({ task, onStart, onDone, onCancel, loading }) => {
  if (task.status === 'CREATED') {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled={loading}
          onClick={() => onStart(task.taskId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg bg-kds-gold text-black font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-gold/50 focus:ring-offset-1 focus:ring-offset-kds-card"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            : <Play size={14} className="fill-current" />
          }
          Bắt đầu nấu
        </button>
        <button
          disabled={loading}
          onClick={() => onCancel(task.taskId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText font-semibold text-sm hover:bg-red-900/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-redText/40 focus:ring-offset-1 focus:ring-offset-kds-card"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-kds-redText/30 border-t-kds-redText rounded-full animate-spin" />
            : <Ban size={14} />
          }
          Hủy món
        </button>
      </div>
    );
  }

  if (task.status === 'COOKING') {
    return (
      <div className="flex flex-col gap-2">
        <button
          disabled={loading}
          onClick={() => onDone(task.taskId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg bg-kds-greenBg border border-kds-greenText/50 text-kds-greenText font-semibold text-sm hover:bg-green-900/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-greenText/40 focus:ring-offset-1 focus:ring-offset-kds-card"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-kds-greenText/30 border-t-kds-greenText rounded-full animate-spin" />
            : <Check size={14} />
          }
          Hoàn thành
        </button>
        <button
          disabled={loading}
          onClick={() => onCancel(task.taskId)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText font-semibold text-sm hover:bg-red-900/30 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-redText/40 focus:ring-offset-1 focus:ring-offset-kds-card"
        >
          {loading
            ? <span className="w-3.5 h-3.5 border-2 border-kds-redText/30 border-t-kds-redText rounded-full animate-spin" />
            : <Ban size={14} />
          }
          Hủy món
        </button>
      </div>
    );
  }

  if (task.status === 'CANCELLED') {
    return (
      <div className="px-4 py-2 rounded-lg bg-kds-redBg/40 border border-kds-redText/20 text-kds-redText/60 text-sm text-center">
        Đã hủy
      </div>
    );
  }

  return (
    <div className="px-4 py-2 rounded-lg bg-black/20 border border-kds-border text-gray-500 text-sm text-center flex items-center justify-center gap-1.5">
      <Flame size={13} className="text-kds-greenText" />
      Đã xong
    </div>
  );
};

const StatusBadge: React.FC<{ status: KitchenTaskStatus }> = ({ status }) => {
  const styleMap: Record<KitchenTaskStatus, string> = {
    CREATED:   'bg-kds-gold/15 text-kds-gold border border-kds-gold/30',
    COOKING:   'bg-kds-blueBg text-kds-blueText border border-kds-blueText/30',
    DONE:      'bg-kds-greenBg text-kds-greenText border border-kds-greenText/30',
    CANCELLED: 'bg-kds-redBg text-kds-redText border border-kds-redText/30',
  };
  const labelMap: Record<KitchenTaskStatus, string> = {
    CREATED:   'CHỜ',
    COOKING:   'ĐANG NẤU',
    DONE:      'XONG',
    CANCELLED: 'HỦY',
  };

  return (
    <span className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${styleMap[status]}`}>
      {labelMap[status]}
    </span>
  );
};
