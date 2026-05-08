import React from 'react';
import { KitchenBatchResponse, KitchenBatchStatus } from '@/types';
import { Bot, Clock, Flame, Layers, Check } from 'lucide-react';

interface BatchCardProps {
  batch: KitchenBatchResponse;
  dishName: string;
  loading: boolean;
  onAccept: (batchId: number) => void;
  onConfirm: (batchId: number) => void;
  onStart: (batchId: number) => void;
  onDone: (batchId: number) => void;
}

const statusSteps: KitchenBatchStatus[] = ['SUGGESTED', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'DONE'];

const stepLabel: Record<KitchenBatchStatus, string> = {
  SUGGESTED:   'Gợi ý',
  ACCEPTED:    'Chấp nhận',
  CONFIRMED:   'Xác nhận',
  IN_PROGRESS: 'Đang nấu',
  DONE:        'Hoàn thành',
};

export const BatchCard: React.FC<BatchCardProps> = ({
  batch, dishName, loading, onAccept, onConfirm, onStart, onDone,
}) => {
  const currentStepIndex = statusSteps.indexOf(batch.status);

  return (
    <div className="bg-kds-card rounded-xl p-5 border border-kds-border flex flex-col h-full">

      {/* ── Source badge + status ──────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {batch.source === 'AI' ? (
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/15 border border-violet-500/30 px-2 py-0.5 rounded-full">
              <Bot size={10} /> AI
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-500/15 border border-gray-500/30 px-2 py-0.5 rounded-full">
              <Layers size={10} /> Manual
            </span>
          )}
        </div>
        <BatchStatusBadge status={batch.status} />
      </div>

      {/* ── Dish info ──────────────────────────────────── */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display font-bold text-kds-gold tabular-nums">{batch.quantity}×</span>
          <h3 className="text-lg font-display text-white leading-tight">{dishName}</h3>
        </div>
        {batch.batchNote && (
          <p className="text-gray-400 text-xs mt-1.5 leading-relaxed">{batch.batchNote}</p>
        )}
      </div>

      {/* ── Progress steps ─────────────────────────────── */}
      <div className="flex items-center gap-0.5 mb-4">
        {statusSteps.map((step, i) => (
          <React.Fragment key={step}>
            <div className={`flex-1 flex flex-col items-center gap-0.5 ${i <= currentStepIndex ? 'opacity-100' : 'opacity-30'}`}>
              <div className={`w-full h-1 rounded-full transition-colors ${
                i < currentStepIndex ? 'bg-kds-greenText' :
                i === currentStepIndex ? 'bg-kds-gold' :
                'bg-kds-border'
              }`} />
              <span className="text-[9px] text-gray-500 whitespace-nowrap">{stepLabel[step]}</span>
            </div>
            {i < statusSteps.length - 1 && <div className="w-1 shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      {/* ── Meta info ──────────────────────────────────── */}
      <div className="space-y-1.5 text-xs text-gray-400 mb-4 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Batch #{batch.id} • Món #{batch.menuItemId}</span>
        </div>
        {batch.aiConfidence !== null && (
          <div>
            <div className="flex justify-between mb-0.5">
              <span className="text-gray-500">Độ tin cậy AI</span>
              <span className={`font-semibold tabular-nums ${batch.aiConfidence > 0.7 ? 'text-kds-greenText' : 'text-amber-400'}`}>
                {(batch.aiConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="h-1 bg-kds-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${batch.aiConfidence > 0.7 ? 'bg-kds-greenText' : 'bg-amber-400'}`}
                style={{ width: `${(batch.aiConfidence * 100).toFixed(0)}%` }}
              />
            </div>
          </div>
        )}
        {batch.startedAt && (
          <div className="flex items-center gap-1 text-gray-500">
            <Flame size={11} className="text-kds-blueText" />
            Bắt đầu: {new Date(batch.startedAt).toLocaleTimeString('vi-VN', { hour12: false })}
          </div>
        )}
        {batch.completedAt && (
          <div className="flex items-center gap-1 text-gray-500">
            <Check size={11} className="text-kds-greenText" />
            Hoàn thành: {new Date(batch.completedAt).toLocaleTimeString('vi-VN', { hour12: false })}
          </div>
        )}
        {batch.estimatedSavingMinutes !== null && (
          <div className="flex items-center justify-between pt-1 border-t border-kds-border/60">
            <span className="flex items-center gap-1 text-gray-500">
              <Clock size={11} /> Tiết kiệm ước tính
            </span>
            <span className="text-kds-gold font-semibold">~{batch.estimatedSavingMinutes} phút</span>
          </div>
        )}
      </div>

      {/* ── Action buttons ─────────────────────────────── */}
      <div className="mt-auto space-y-2">
          {batch.status !== 'DONE' && (
          <PrimaryActionButton batch={batch} loading={loading} onAccept={onAccept} onConfirm={onConfirm} onStart={onStart} onDone={onDone} />
        )}

        {batch.status === 'DONE' && (
          <div className="w-full py-2.5 rounded-lg bg-kds-greenBg border border-kds-greenText/30 text-kds-greenText text-sm font-semibold text-center flex items-center justify-center gap-2">
            <Check size={14} /> Batch hoàn thành
          </div>
        )}
      </div>
    </div>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────────

const PrimaryActionButton: React.FC<{
  batch: KitchenBatchResponse;
  loading: boolean;
  onAccept: (id: number) => void;
  onConfirm: (id: number) => void;
  onStart: (id: number) => void;
  onDone: (id: number) => void;
}> = ({ batch, loading, onAccept, onConfirm, onStart, onDone }) => {
  const config: Record<Exclude<KitchenBatchStatus, 'DONE'>, { label: string; icon: React.ReactNode; action: () => void }> = {
    SUGGESTED:   { label: 'Chấp nhận gợi ý', icon: <Check size={14} />, action: () => onAccept(batch.id) },
    ACCEPTED:    { label: 'Xác nhận batch',   icon: <Check size={14} />, action: () => onConfirm(batch.id) },
    CONFIRMED:   { label: 'Bắt đầu nấu',      icon: <Flame size={14} />, action: () => onStart(batch.id) },
    IN_PROGRESS: { label: 'Hoàn thành batch',  icon: <Check size={14} />, action: () => onDone(batch.id) },
  };

  if (batch.status === 'DONE') return null;
  const { label, icon, action } = config[batch.status as Exclude<KitchenBatchStatus, 'DONE'>];

  return (
    <button
      disabled={loading}
      onClick={action}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-kds-gold text-black font-bold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-gold/50 focus:ring-offset-1 focus:ring-offset-kds-card"
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        : icon
      }
      {label}
    </button>
  );
};

const BatchStatusBadge: React.FC<{ status: KitchenBatchStatus }> = ({ status }) => {
  const styleMap: Record<KitchenBatchStatus, string> = {
    SUGGESTED:   'bg-violet-500/15 text-violet-400 border border-violet-500/30',
    ACCEPTED:    'bg-kds-gold/15 text-kds-gold border border-kds-gold/30',
    CONFIRMED:   'bg-kds-blueBg text-kds-blueText border border-kds-blueText/30',
    IN_PROGRESS: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    DONE:        'bg-kds-greenBg text-kds-greenText border border-kds-greenText/30',
  };
  const labelMap: Record<KitchenBatchStatus, string> = {
    SUGGESTED:   'Gợi ý',
    ACCEPTED:    'Chấp nhận',
    CONFIRMED:   'Đã xác nhận',
    IN_PROGRESS: 'Đang nấu',
    DONE:        'Xong',
  };
  return (
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${styleMap[status]}`}>
      {labelMap[status]}
    </span>
  );
};
