import React from 'react';
import { KdsTaskDisplay } from '@/types';
import { Check, X, Clock, Archive } from 'lucide-react';

interface TabCompletedProps {
  tasks: KdsTaskDisplay[];
}

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

export const TabCompleted: React.FC<TabCompletedProps> = ({ tasks }) => {
  if (tasks.length === 0) {
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

  const doneTasks      = tasks.filter((t) => t.status === 'DONE');
  const cancelledTasks = tasks.filter((t) => t.status === 'CANCELLED');

  return (
    <div className="p-6 space-y-3 max-w-5xl mx-auto">
      {/* Summary bar */}
      <div className="flex items-center gap-4 text-sm text-gray-500 pb-3 border-b border-kds-border">
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

      {/* Task list */}
      {tasks.map((task) => (
        <CompletedRow key={task.taskId} task={task} />
      ))}
    </div>
  );
};

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
