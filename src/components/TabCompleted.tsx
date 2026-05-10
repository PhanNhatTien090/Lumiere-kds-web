import React from 'react';
import { KdsTaskDisplay } from '@/types';
import { Check, X, Clock, Archive, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface TabCompletedProps {
  tasks: KdsTaskDisplay[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

export const TabCompleted: React.FC<TabCompletedProps> = ({
  tasks,
  page,
  size,
  totalElements,
  totalPages,
  loading,
  onPageChange,
  onSizeChange,
}) => {
  const doneTasks      = tasks.filter((t) => t.status === 'DONE');
  const cancelledTasks = tasks.filter((t) => t.status === 'CANCELLED');
  const showingFrom = totalElements === 0 ? 0 : page * size + 1;
  const showingTo = Math.min((page + 1) * size, totalElements);

  if (totalElements === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-kds-card border border-kds-border flex items-center justify-center mb-4">
          <Archive size={28} className="text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">Chưa có task hoàn thành</p>
        <p className="text-gray-600 text-sm mt-1">Các task đã xong hoặc đã hủy sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-3 max-w-5xl mx-auto">
      {/* Summary bar */}
      <div className="flex items-center justify-between gap-4 text-sm text-gray-500 pb-3 border-b border-kds-border">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-kds-greenText" />
            <span>{doneTasks.length} hoàn thành</span>
          </span>
          {cancelledTasks.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-kds-redText" />
              <span>{cancelledTasks.length} đã hủy</span>
            </span>
          )}
        </div>
        <span className="text-xs text-gray-600">
          {totalElements > 0
            ? `Hiển thị ${showingFrom}–${showingTo} / ${totalElements}`
            : null}
        </span>
      </div>

      {/* Loading hint */}
      {loading && (
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="w-3 h-3 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
          Đang tải...
        </div>
      )}

      {/* Task list */}
      {tasks.map((task) => (
        <CompletedRow key={task.taskId} task={task} />
      ))}

      {/* Pagination controls */}
      {totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-kds-border">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Số dòng / trang:</span>
            <select
              value={size}
              disabled={loading}
              onChange={(e) => onSizeChange(Number(e.target.value))}
              className="bg-kds-card border border-kds-border rounded px-2 py-1 text-gray-200"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <PageBtn disabled={loading || page === 0} onClick={() => onPageChange(0)} title="Trang đầu">
              <ChevronsLeft size={14} />
            </PageBtn>
            <PageBtn disabled={loading || page === 0} onClick={() => onPageChange(page - 1)} title="Trang trước">
              <ChevronLeft size={14} />
            </PageBtn>
            <span className="px-3 text-xs text-gray-300">
              Trang <b className="text-white">{page + 1}</b> / {totalPages}
            </span>
            <PageBtn disabled={loading || page >= totalPages - 1} onClick={() => onPageChange(page + 1)} title="Trang sau">
              <ChevronRight size={14} />
            </PageBtn>
            <PageBtn disabled={loading || page >= totalPages - 1} onClick={() => onPageChange(totalPages - 1)} title="Trang cuối">
              <ChevronsRight size={14} />
            </PageBtn>
          </div>
        </div>
      )}
    </div>
  );
};

const PageBtn: React.FC<{
  disabled: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ disabled, onClick, title, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    title={title}
    className="p-1.5 rounded border border-kds-border bg-kds-card text-gray-300 hover:bg-kds-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
  >
    {children}
  </button>
);

const CompletedRow: React.FC<{ task: KdsTaskDisplay }> = ({ task }) => {
  const isDone      = task.status === 'DONE';
  const completedAt = task.completedAt ? new Date(task.completedAt) : null;

  return (
    <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${
      isDone
        ? 'bg-kds-card border-kds-border'
        : 'bg-kds-redBg/20 border-kds-redText/20'
    }`}>
      {/* Left: icon + info */}
      <div className="flex items-start gap-4 min-w-0">
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
          isDone
            ? 'border-kds-greenText/50 bg-kds-greenBg'
            : 'border-kds-redText/40 bg-kds-redBg/40'
        }`}>
          {isDone
            ? <Check size={18} className="text-kds-greenText" />
            : <X size={18} className="text-kds-redText" />
          }
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-mono text-gray-500 bg-black/20 px-1.5 py-0.5 rounded">
              #{task.taskId}
            </span>
            <h3 className="text-base font-display text-white truncate">{task.dishName}</h3>
            {task.quantity > 1 && (
              <span className="text-kds-gold text-sm font-bold shrink-0">×{task.quantity}</span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              isDone
                ? 'bg-kds-greenBg text-kds-greenText'
                : 'bg-kds-redBg text-kds-redText'
            }`}>
              {isDone ? 'Xong' : 'Đã hủy'}
            </span>
          </div>
          <p className="text-gray-500 text-xs">
            Bàn {task.tableId}
            <span className="mx-1 text-gray-700">•</span>
            Mục #{task.orderItemId}
            {completedAt && (
              <>
                <span className="mx-1 text-gray-700">•</span>
                {isDone ? 'Hoàn thành' : 'Hủy lúc'}{' '}
                {completedAt.toLocaleTimeString('vi-VN', { hour12: false })}
              </>
            )}
          </p>
          {(task.itemNote || task.orderNote) && (
            <div className="mt-1 space-y-0.5">
              {task.itemNote && (
                <p className="text-xs text-amber-300/70 truncate">
                  <span className="mr-1">📝</span>{task.itemNote}
                </p>
              )}
              {task.orderNote && (
                <p className="text-xs text-gray-500 truncate">
                  <span className="mr-1">🗒</span>{task.orderNote}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: duration */}
      <div className="shrink-0 text-right">
        {isDone && task.actualCookSeconds !== null ? (
          <div className="flex items-center gap-1.5 text-gray-400">
            <Clock size={12} />
            <span className="font-mono text-sm tabular-nums">
              {formatDuration(task.actualCookSeconds)}
            </span>
          </div>
        ) : (
          <span className="font-mono text-sm text-gray-600">--:--:--</span>
        )}
      </div>
    </div>
  );
};
