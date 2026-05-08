import React from 'react';
import { KitchenBatchResponse } from '@/types';
import { BatchCard } from './BatchCard';
import { BrainCircuit, RefreshCw, Sparkles } from 'lucide-react';

interface TabAiBatchingProps {
  batches: KitchenBatchResponse[];
  resolveDishName: (menuItemId: number) => string;
  actionLoadingBatchIds: number[];
  isSuggesting: boolean;
  onSuggest: () => void;
  onAccept: (batchId: number) => void;
  onConfirm: (batchId: number) => void;
  onStart: (batchId: number) => void;
  onDone: (batchId: number) => void;
}

export const TabAiBatching: React.FC<TabAiBatchingProps> = ({
  batches,
  resolveDishName,
  actionLoadingBatchIds,
  isSuggesting,
  onSuggest,
  onAccept,
  onConfirm,
  onStart,
  onDone,
}) => {
  const highConfidenceCount = batches.filter((b) => (b.aiConfidence ?? 0) > 0.7).length;

  return (
    <div className="p-6 space-y-6">

      {/* ── AI Banner ──────────────────────────────────────────── */}
      <div className="bg-kds-card rounded-xl p-5 border border-kds-gold/25 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-lg bg-kds-gold/15 border border-kds-gold/25 flex items-center justify-center shrink-0">
            <BrainCircuit className="text-kds-gold" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-display text-kds-gold leading-tight mb-0.5">AI Smart Batching</h2>
            <p className="text-gray-400 text-sm">
              Gợi ý gom nhóm món: Gợi ý → Chấp nhận → Xác nhận → Đang nấu → Xong
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {highConfidenceCount > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-kds-gold">
              <Sparkles size={14} />
              <span>
                <span className="font-bold">{highConfidenceCount}</span>
                <span className="text-gray-400 ml-1">độ tin cậy &gt; 70%</span>
              </span>
            </div>
          )}
          <button
            onClick={onSuggest}
            disabled={isSuggesting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-kds-gold text-black font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-gold/50 focus:ring-offset-1 focus:ring-offset-kds-bg"
          >
            {isSuggesting
              ? <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : <RefreshCw size={14} />
            }
            {isSuggesting ? 'Đang phân tích...' : 'Lấy gợi ý mới'}
          </button>
        </div>
      </div>

      {/* ── Empty state ────────────────────────────────────────── */}
      {batches.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-kds-card border border-kds-border flex items-center justify-center mb-4">
            <BrainCircuit size={24} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Chưa có gợi ý batch nào</p>
          <p className="text-gray-600 text-sm mt-1">Nhấn "Lấy gợi ý mới" để AI phân tích đơn hàng hiện tại</p>
        </div>
      )}

      {/* ── Batch cards grid ───────────────────────────────────── */}
      {batches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {batches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              dishName={resolveDishName(batch.menuItemId)}
              loading={actionLoadingBatchIds.includes(batch.id)}
              onAccept={onAccept}
              onConfirm={onConfirm}
              onStart={onStart}
              onDone={onDone}
            />
          ))}
        </div>
      )}
    </div>
  );
};
