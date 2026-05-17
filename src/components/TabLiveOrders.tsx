import React from 'react';
import { KdsTaskDisplay, KitchenTaskStatus } from '@/types';
import { Ban, Check, Play, UtensilsCrossed } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderGroup {
  orderId: number;
  tableId: number;
  orderNote: string | null;
  tasks: KdsTaskDisplay[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Main component ─────────────────────────────────────────────────────────────

interface TabLiveOrdersProps {
  tasks: KdsTaskDisplay[];
  now: Date;
  actionLoadingTaskIds: number[];
  onStartTask: (taskId: number) => void;
  onDoneTask: (taskId: number) => void;
  onCancelTask: (taskId: number) => void;
}

export const TabLiveOrders: React.FC<TabLiveOrdersProps> = ({
  tasks, now, actionLoadingTaskIds, onStartTask, onDoneTask, onCancelTask,
}) => {
  // Group tasks by orderId — tasks are already sorted by taskId (oldest first)
  const groups = React.useMemo<OrderGroup[]>(() => {
    const map = new Map<number, OrderGroup>();
    for (const task of tasks) {
      const g = map.get(task.orderId);
      if (g) {
        g.tasks.push(task);
      } else {
        map.set(task.orderId, {
          orderId:   task.orderId,
          tableId:   task.tableId,
          orderNote: task.orderNote,
          tasks:     [task],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.orderId - b.orderId);
  }, [tasks]);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-6">
        <div className="w-16 h-16 rounded-full bg-kds-card border border-kds-border flex items-center justify-center mb-4">
          <UtensilsCrossed size={28} className="text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">Không có đơn nào đang chờ</p>
        <p className="text-gray-600 text-sm mt-1">Các đơn mới sẽ hiển thị ở đây</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-max">
      {groups.map((g) => (
        <OrderGroupCard
          key={g.orderId}
          group={g}
          now={now}
          actionLoadingTaskIds={actionLoadingTaskIds}
          onStart={onStartTask}
          onDone={onDoneTask}
          onCancel={onCancelTask}
        />
      ))}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const OrderGroupCard: React.FC<{
  group: OrderGroup;
  now: Date;
  actionLoadingTaskIds: number[];
  onStart: (taskId: number) => void;
  onDone: (taskId: number) => void;
  onCancel: (taskId: number) => void;
}> = ({ group, now, actionLoadingTaskIds, onStart, onDone, onCancel }) => {
  const waitingCount = group.tasks.filter((t) => t.status === 'CREATED').length;
  const cookingCount = group.tasks.filter((t) => t.status === 'COOKING').length;

  return (
    <div className="bg-kds-card rounded-xl border border-kds-border overflow-hidden flex flex-col">
      {/* ── Order header ─────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-black/20 border-b border-kds-border">
        <span className="text-xs font-mono text-gray-500 shrink-0">#{group.orderId}</span>
        <span className="text-sm font-bold text-white shrink-0">Bàn {group.tableId}</span>
        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          {waitingCount > 0 && (
            <span className="text-[10px] bg-kds-gold/15 text-kds-gold border border-kds-gold/30 px-1.5 py-0.5 rounded-full font-bold">
              {waitingCount} chờ
            </span>
          )}
          {cookingCount > 0 && (
            <span className="text-[10px] bg-kds-blueBg text-kds-blueText border border-kds-blueText/30 px-1.5 py-0.5 rounded-full font-bold">
              {cookingCount} nấu
            </span>
          )}
        </div>
      </div>

      {/* ── Order-level note (once, not repeated per task) ── */}
      {group.orderNote && (
        <div className="px-3 py-1.5 bg-amber-950/10 border-b border-amber-500/15 text-[11px] text-amber-300/80">
          🗒 {group.orderNote}
        </div>
      )}

      {/* ── Task rows ────────────────────────────────────── */}
      <div className="divide-y divide-kds-border/40">
        {group.tasks.map((task) => (
          <TaskRow
            key={task.taskId}
            task={task}
            now={now}
            loading={actionLoadingTaskIds.includes(task.taskId)}
            onStart={onStart}
            onDone={onDone}
            onCancel={onCancel}
          />
        ))}
      </div>
    </div>
  );
};

const TaskRow: React.FC<{
  task: KdsTaskDisplay;
  now: Date;
  loading: boolean;
  onStart: (id: number) => void;
  onDone: (id: number) => void;
  onCancel: (id: number) => void;
}> = ({ task, now, loading, onStart, onDone, onCancel }) => {
  const elapsedSeconds = task.startedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(task.startedAt).getTime()) / 1000))
    : 0;

  return (
    <div className="flex flex-col gap-1.5 px-3 py-2">
      {/* Dish row */}
      <div className="flex items-start gap-2">
        {task.imageUrl ? (
          <img
            src={task.imageUrl}
            alt={task.dishName}
            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-kds-border"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-black/30 border border-kds-border flex items-center justify-center shrink-0 text-gray-600 font-display select-none text-sm">
            {task.dishName.charAt(0)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-white truncate">{task.dishName}</span>
            {task.quantity > 1 && (
              <span className="text-kds-gold text-xs font-bold shrink-0">×{task.quantity}</span>
            )}
          </div>
          {task.itemNote && (
            <p className="text-[11px] text-amber-300/70 truncate mt-0.5">📝 {task.itemNote}</p>
          )}
        </div>

        <TaskStatusBadge status={task.status} />
      </div>

      {/* Meta + actions row */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono tabular-nums text-gray-500 shrink-0">
          {task.status === 'COOKING' && task.startedAt
            ? formatDuration(elapsedSeconds)
            : task.expectedCookTime
            ? `~${Math.round(task.expectedCookTime / 60)}m`
            : ''}
        </span>
        <TaskActionButton task={task} loading={loading} onStart={onStart} onDone={onDone} onCancel={onCancel} />
      </div>
    </div>
  );
};

const TaskStatusBadge: React.FC<{ status: KitchenTaskStatus }> = ({ status }) => {
  const styleMap: Record<KitchenTaskStatus, string> = {
    CREATED:   'bg-kds-gold/15 text-kds-gold border border-kds-gold/30',
    COOKING:   'bg-kds-blueBg text-kds-blueText border border-kds-blueText/30',
    DONE:      'bg-kds-greenBg text-kds-greenText border border-kds-greenText/30',
    CANCELLED: 'bg-kds-redBg text-kds-redText border border-kds-redText/30',
  };
  const labelMap: Record<KitchenTaskStatus, string> = {
    CREATED:   'CHỜ',
    COOKING:   'NẤU',
    DONE:      'XONG',
    CANCELLED: 'HỦY',
  };
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styleMap[status]}`}>
      {labelMap[status]}
    </span>
  );
};

const TaskActionButton: React.FC<{
  task: KdsTaskDisplay;
  loading: boolean;
  onStart: (id: number) => void;
  onDone: (id: number) => void;
  onCancel: (id: number) => void;
}> = ({ task, loading, onStart, onDone, onCancel }) => {
  if (task.status === 'CREATED') {
    return (
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          disabled={loading}
          onClick={() => onCancel(task.taskId)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText text-[11px] font-bold hover:bg-red-900/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-redText/40"
          title="Hủy món"
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-kds-redText/30 border-t-kds-redText rounded-full animate-spin" />
            : <Ban size={11} />
          }
        </button>
        <button
          disabled={loading}
          onClick={() => onStart(task.taskId)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-kds-gold text-black text-[11px] font-bold hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-gold/50"
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            : <Play size={11} className="fill-current" />
          }
          Bắt đầu
        </button>
      </div>
    );
  }

  if (task.status === 'COOKING') {
    return (
      <div className="shrink-0 flex items-center gap-1.5">
        <button
          disabled={loading}
          onClick={() => onCancel(task.taskId)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText text-[11px] font-bold hover:bg-red-900/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-redText/40"
          title="Hủy món"
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-kds-redText/30 border-t-kds-redText rounded-full animate-spin" />
            : <Ban size={11} />
          }
        </button>
        <button
          disabled={loading}
          onClick={() => onDone(task.taskId)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-kds-greenBg border border-kds-greenText/50 text-kds-greenText text-[11px] font-bold hover:bg-green-900/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-greenText/40"
        >
          {loading
            ? <span className="w-3 h-3 border-2 border-kds-greenText/30 border-t-kds-greenText rounded-full animate-spin" />
            : <Check size={11} />
          }
          Xong
        </button>
      </div>
    );
  }

  return null;
};
