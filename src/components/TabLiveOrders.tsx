import React from 'react';
import { KdsTaskDisplay, KitchenTaskStatus } from '@/types';
import { AlertTriangle, Ban, Check, Clock, Flame, Play, UtensilsCrossed } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface OrderGroup {
  orderId: number;
  tableId: number;
  orderNote: string | null;
  tasks: KdsTaskDisplay[];
}

type UrgencyLevel = 'waiting' | 'normal' | 'caution' | 'critical';

// ── Helpers ───────────────────────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

const getTaskUrgency = (task: KdsTaskDisplay, now: Date): UrgencyLevel => {
  if (task.status !== 'COOKING' || !task.startedAt) return 'waiting';
  const elapsed = (now.getTime() - new Date(task.startedAt).getTime()) / 1000;
  const threshold = task.expectedCookTime ?? 600;
  if (elapsed < threshold * 0.6) return 'normal';
  if (elapsed < threshold)       return 'caution';
  return 'critical';
};

const getGroupUrgency = (tasks: KdsTaskDisplay[], now: Date): UrgencyLevel => {
  const levels: UrgencyLevel[] = tasks.map((t) => getTaskUrgency(t, now));
  if (levels.includes('critical')) return 'critical';
  if (levels.includes('caution'))  return 'caution';
  if (levels.includes('normal'))   return 'normal';
  return 'waiting';
};

const urgencyTimerStyle: Record<UrgencyLevel, string> = {
  waiting:  'text-gray-500',
  normal:   'text-kds-blueText',
  caution:  'text-amber-400',
  critical: 'text-kds-redText font-bold',
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
    return Array.from(map.values());
  }, [tasks]);

  // "Chờ nấu" = all tasks in the group are still CREATED
  // "Đang nấu" = at least one task is COOKING (includes mixed groups)
  const waitingGroups = groups.filter((g) => g.tasks.every((t) => t.status === 'CREATED'));
  const cookingGroups = groups.filter((g) => g.tasks.some((t)  => t.status === 'COOKING'));

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

  const sharedProps = { now, actionLoadingTaskIds, onStart: onStartTask, onDone: onDoneTask, onCancel: onCancelTask };

  return (
    <div className="p-6 space-y-8">
      {waitingGroups.length > 0 && (
        <section>
          <SectionHeader
            icon={<Clock size={15} className="text-kds-gold" />}
            label="Chờ nấu"
            count={waitingGroups.length}
            unit="đơn"
            countColor="bg-kds-gold/20 text-kds-gold border border-kds-gold/30"
          />
          <div className="space-y-3 mt-3">
            {waitingGroups.map((g) => (
              <OrderGroupCard key={g.orderId} group={g} {...sharedProps} />
            ))}
          </div>
        </section>
      )}

      {cookingGroups.length > 0 && (
        <section>
          <SectionHeader
            icon={<Flame size={15} className="text-kds-blueText" />}
            label="Đang nấu"
            count={cookingGroups.length}
            unit="đơn"
            countColor="bg-kds-blueBg text-kds-blueText border border-kds-blueText/30"
          />
          <div className="space-y-3 mt-3">
            {cookingGroups.map((g) => (
              <OrderGroupCard key={g.orderId} group={g} {...sharedProps} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  label: string;
  count: number;
  unit: string;
  countColor: string;
}> = ({ icon, label, count, unit, countColor }) => (
  <div className="flex items-center gap-2 pb-2 border-b border-kds-border">
    {icon}
    <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">{label}</span>
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${countColor}`}>
      {count} {unit}
    </span>
  </div>
);

const OrderGroupCard: React.FC<{
  group: OrderGroup;
  now: Date;
  actionLoadingTaskIds: number[];
  onStart: (taskId: number) => void;
  onDone: (taskId: number) => void;
  onCancel: (taskId: number) => void;
}> = ({ group, now, actionLoadingTaskIds, onStart, onDone, onCancel }) => {
  const groupUrgency = getGroupUrgency(group.tasks, now);
  const waitingCount = group.tasks.filter((t) => t.status === 'CREATED').length;
  const cookingCount = group.tasks.filter((t) => t.status === 'COOKING').length;

  const borderStyle: Record<UrgencyLevel, string> = {
    critical: 'border-kds-redText/50',
    caution:  'border-amber-500/40',
    normal:   'border-kds-border',
    waiting:  'border-kds-border',
  };
  const headerBg: Record<UrgencyLevel, string> = {
    critical: 'bg-red-950/20 border-kds-redText/30',
    caution:  'bg-amber-950/10 border-amber-500/20',
    normal:   'bg-black/20 border-kds-border',
    waiting:  'bg-black/20 border-kds-border',
  };

  return (
    <div className={`bg-kds-card rounded-xl border overflow-hidden ${borderStyle[groupUrgency]}`}>
      {/* ── Order header ─────────────────────────────────── */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 border-b ${headerBg[groupUrgency]}`}>
        <span className="text-xs font-mono text-gray-500 shrink-0">Đơn #{group.orderId}</span>
        <span className="text-sm font-bold text-white shrink-0">Bàn {group.tableId}</span>

        {waitingCount > 0 && (
          <span className="text-[11px] bg-kds-gold/15 text-kds-gold border border-kds-gold/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
            {waitingCount} chờ
          </span>
        )}
        {cookingCount > 0 && (
          <span className="text-[11px] bg-kds-blueBg text-kds-blueText border border-kds-blueText/30 px-1.5 py-0.5 rounded-full font-bold shrink-0">
            {cookingCount} nấu
          </span>
        )}
        {groupUrgency === 'critical' && (
          <AlertTriangle size={13} className="text-kds-redText animate-pulse ml-auto shrink-0" />
        )}
      </div>

      {/* ── Order-level note (once, not repeated per task) ── */}
      {group.orderNote && (
        <div className="px-4 py-1.5 bg-amber-950/10 border-b border-amber-500/15 text-xs text-amber-300/80">
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
  const urgency = getTaskUrgency(task, now);
  const elapsedSeconds = task.startedAt
    ? Math.max(0, Math.floor((now.getTime() - new Date(task.startedAt).getTime()) / 1000))
    : 0;

  const rowBg: Record<UrgencyLevel, string> = {
    critical: 'bg-red-950/10',
    caution:  'bg-amber-950/5',
    normal:   '',
    waiting:  '',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${rowBg[urgency]}`}>
      {/* Thumbnail */}
      {task.imageUrl ? (
        <img
          src={task.imageUrl}
          alt={task.dishName}
          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-kds-border"
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-black/30 border border-kds-border flex items-center justify-center shrink-0 text-gray-600 font-display select-none text-base">
          {task.dishName.charAt(0)}
        </div>
      )}

      {/* Dish info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white truncate">{task.dishName}</span>
          {task.quantity > 1 && (
            <span className="text-kds-gold text-xs font-bold shrink-0">×{task.quantity}</span>
          )}
          {urgency === 'critical' && (
            <AlertTriangle size={11} className="text-kds-redText shrink-0 animate-pulse" />
          )}
        </div>
        {task.itemNote && (
          <p className="text-xs text-amber-300/70 truncate mt-0.5">📝 {task.itemNote}</p>
        )}
      </div>

      {/* Elapsed / expected time */}
      <div className={`shrink-0 text-xs font-mono tabular-nums text-right min-w-[52px] ${urgencyTimerStyle[urgency]}`}>
        {task.status === 'COOKING' && task.startedAt && (
          <>
            {formatDuration(elapsedSeconds)}
            {urgency === 'caution'  && <span className="block text-[10px] text-amber-500 font-sans">⚠ Chậm</span>}
            {urgency === 'critical' && <span className="block text-[10px] text-kds-redText font-sans">‼ Trễ</span>}
          </>
        )}
        {task.status === 'CREATED' && task.expectedCookTime && (
          <span className="text-gray-600">~{Math.round(task.expectedCookTime / 60)}m</span>
        )}
      </div>

      {/* Status badge */}
      <TaskStatusBadge status={task.status} />

      {/* Action button */}
      <TaskActionButton task={task} loading={loading} onStart={onStart} onDone={onDone} onCancel={onCancel} />
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
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText text-xs font-bold hover:bg-red-900/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-redText/40"
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kds-gold text-black text-xs font-bold hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-gold/50"
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
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-kds-redBg border border-kds-redText/40 text-kds-redText text-xs font-bold hover:bg-red-900/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-redText/40"
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
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-kds-greenBg border border-kds-greenText/50 text-kds-greenText text-xs font-bold hover:bg-green-900/30 active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-kds-greenText/40"
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
