import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { AlertTriangle, X } from "lucide-react";
import { Header } from "./components/Header";
import { TabLiveOrders } from "./components/TabLiveOrders";
import { TabAiBatching } from "./components/TabAiBatching";
import { TabCompleted } from "./components/TabCompleted";
import Login from "./components/Login";
import { ACCESS_TOKEN_STORAGE_KEY, AUTH_EXPIRED_EVENT, clearKdsAuthSession } from "./api/client";
import { authAPI, kitchenAPI } from "./api/endpoints";
import { useKdsStore } from "./store/kdsStore";
import { useKitchenSocket } from "./hooks/useKitchenSocket";
import { useAudioNotification } from "./hooks/useAudioNotification";
import { KdsTaskDisplay, KitchenBatchResponse, KitchenTaskResponse } from "./types";

// ─── Polling intervals ────────────────────────────────────────────────────────
// IMPORTANT: Keep intervals HIGH to avoid flooding the backend DB connection pool.
// Each poll = 1 DB query (no concurrent multi-status fetches).
const POLL_TASKS_MS   = 10_000;  // All tasks — single request, filter client-side
const POLL_BATCHES_MS = 15_000;  // All active batches — single request

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'batching' | 'completed'>('live');
  const [now, setNow] = useState<Date>(new Date());
  const [actionLoadingTaskIds, setActionLoadingTaskIds] = useState<number[]>([]);
  const [actionLoadingBatchIds, setActionLoadingBatchIds] = useState<number[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorDismissed, setErrorDismissed] = useState(false);

  // ─── Completed tasks pagination ─────────────────────────────────────────────
  // Loaded only when the "Đã xong" tab is opened. Decoupled from live polling
  // so completed history doesn't bloat every 10s tick.
  const [completedTasksList, setCompletedTasksList] = useState<KitchenTaskResponse[]>([]);
  const [completedPage, setCompletedPage] = useState(0);
  const [completedSize, setCompletedSize] = useState(20);
  const [completedTotalElements, setCompletedTotalElements] = useState(0);
  const [completedTotalPages, setCompletedTotalPages] = useState(0);
  const [completedLoading, setCompletedLoading] = useState(false);
  // Guard: don't start a new poll while previous one is still in-flight
  const isPollingRef = useRef(false);
  // Track previous CREATED task IDs to detect genuinely new arrivals
  const prevCreatedIdsRef = useRef<Set<number>>(new Set());

  const {
    tasks,
    batches,
    isWebSocketConnected,
    loading,
    error,
    setTasks,
    setBatches,
    setLoading,
    setError,
    reset,
  } = useKdsStore();

  // ─── Audio ────────────────────────────────────────────────────────────────
  const { unlock, playNewOrder } = useAudioNotification();

  // ─── Auth ─────────────────────────────────────────────────────────────────

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    () => !!sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)
  );

  const handleLogout = useCallback(() => {
    void (async () => {
      try {
        await authAPI.logout();
      } catch {
        /* continue local sign-out */
      }
      clearKdsAuthSession();
      reset();
      setIsAuthenticated(false);
      setError(null);
      setActiveTab('live');
    })();
  }, [reset, setError]);

  useEffect(() => {
    const onAuthExpired = () => { handleLogout(); };
    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => { window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired); };
  }, [handleLogout]);

  // ─── WebSocket: realtime updates ──────────────────────────────────────────
  useKitchenSocket({ enabled: isAuthenticated });

  // ─── Error helper ─────────────────────────────────────────────────────────

  const handleApiError = useCallback((err: unknown, fallback: string) => {
    const msg = axios.isAxiosError(err)
      ? err.response?.data?.message ?? err.message
      : fallback;
    setError(msg);
    setErrorDismissed(false);
  }, [setError]);

  // ─── Fetch: Tasks ─────────────────────────────────────────────────────────

  const fetchAllTasks = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await kitchenAPI.listTasks();
      setTasks(response.data.data);
      setError(null);
    } catch (err) {
      handleApiError(err, 'Không thể tải danh sách task');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setTasks, setLoading, setError, handleApiError]);

  // ─── Fetch: Completed tasks (paginated) ───────────────────────────────────

  const fetchCompletedTasks = useCallback(
    async (page: number, size: number) => {
      setCompletedLoading(true);
      try {
        const res = await kitchenAPI.listCompletedTasksPaged({ page, size });
        const data = res.data.data;
        setCompletedTasksList(data.content);
        setCompletedPage(data.page);
        setCompletedSize(data.size);
        setCompletedTotalElements(data.totalElements);
        setCompletedTotalPages(data.totalPages);
        setError(null);
      } catch (err) {
        handleApiError(err, 'Không thể tải lịch sử task hoàn thành');
      } finally {
        setCompletedLoading(false);
      }
    },
    [handleApiError, setError]
  );

  // ─── Fetch: Batches ───────────────────────────────────────────────────────

  const fetchAllBatches = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await kitchenAPI.listBatches();
      setBatches(response.data.data);
      setError(null);
    } catch (err) {
      handleApiError(err, 'Không thể tải danh sách batch');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setBatches, setLoading, setError, handleApiError]);

  // ─── Initial full refresh ─────────────────────────────────────────────────

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await fetchAllTasks(true);
      await fetchAllBatches(true);
    } finally {
      setLoading(false);
    }
  }, [fetchAllTasks, fetchAllBatches, setLoading]);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    void refreshAll();
  }, [refreshAll]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshAll();
  }, [isAuthenticated, refreshAll]);

  // ─── Polling ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    let batchPollId: number | undefined;

    const taskPoll = window.setInterval(async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        await fetchAllTasks(true);
      } finally {
        isPollingRef.current = false;
      }
    }, POLL_TASKS_MS);

    const batchPollTimer = window.setTimeout(() => {
      batchPollId = window.setInterval(async () => {
        if (isPollingRef.current) return;
        isPollingRef.current = true;
        try {
          await fetchAllBatches(true);
        } finally {
          isPollingRef.current = false;
        }
      }, POLL_BATCHES_MS);
    }, 5_000);

    return () => {
      window.clearInterval(taskPoll);
      if (batchPollId) window.clearInterval(batchPollId);
      window.clearTimeout(batchPollTimer);
      isPollingRef.current = false;
    };
  }, [fetchAllBatches, fetchAllTasks, isAuthenticated]);

  // ─── Clock ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  // ─── Auto-fetch completed tasks when entering the tab or page-size changes ──

  useEffect(() => {
    if (!isAuthenticated || activeTab !== 'completed') return;
    void fetchCompletedTasks(0, completedSize);
  }, [activeTab, isAuthenticated, completedSize, fetchCompletedTasks]);

  // ─── Audio: detect new CREATED tasks ─────────────────────────────────────
  // Only fires when there are genuinely new tasks (not on initial data load).

  useEffect(() => {
    if (!soundEnabled || !isAuthenticated) return;
    const currentCreatedIds = new Set(
      tasks.filter((t) => t.status === 'CREATED').map((t) => t.id)
    );
    const prev = prevCreatedIdsRef.current;
    // prev.size > 0 guard: skip the initial data load on login
    const hasNewTasks = prev.size > 0 && [...currentCreatedIds].some((id) => !prev.has(id));
    if (hasNewTasks) playNewOrder();
    prevCreatedIdsRef.current = currentCreatedIds;
  }, [tasks, soundEnabled, isAuthenticated, playNewOrder]);

  // ─── Actions: Tasks ───────────────────────────────────────────────────────

  const runTaskAction = useCallback(async (taskId: number, action: 'start' | 'done' | 'cancel') => {
    setActionLoadingTaskIds((prev) => [...prev, taskId]);
    try {
      if (action === 'start')       await kitchenAPI.startTask(taskId);
      else if (action === 'done')   await kitchenAPI.doneTask(taskId);
      else if (action === 'cancel') await kitchenAPI.cancelTask(taskId);
      await fetchAllTasks(true);
      setError(null);
    } catch (err) {
      handleApiError(err, 'Cập nhật task thất bại');
    } finally {
      setActionLoadingTaskIds((prev) => prev.filter((id) => id !== taskId));
    }
  }, [fetchAllTasks, setError, handleApiError]);

  // ─── Actions: Batches ─────────────────────────────────────────────────────

  const runBatchAction = useCallback(
    async (batchId: number, action: 'accept' | 'confirm' | 'start' | 'done') => {
      setActionLoadingBatchIds((prev) => [...prev, batchId]);
      try {
        if (action === 'accept')       await kitchenAPI.acceptBatch(batchId);
        else if (action === 'confirm') await kitchenAPI.confirmBatch(batchId);
        else if (action === 'start')   await kitchenAPI.startBatch(batchId);
        else if (action === 'done')    await kitchenAPI.doneBatch(batchId);
        await fetchAllBatches(true);
        // start/done cascade to the underlying KitchenTasks server-side; refresh
        // tasks so the Live tab reflects COOKING/DONE without waiting on polling.
        if (action === 'start' || action === 'done') {
          await fetchAllTasks(true);
        }
        setError(null);
      } catch (err) {
        // SUGGESTED batches are purged after 90 minutes by a backend cron job.
        // A 404 on accept means this specific batch no longer exists — remove it
        // from local state and inform the user to re-run AI suggest.
        if (action === 'accept' && axios.isAxiosError(err) && err.response?.status === 404) {
          setBatches(batches.filter((b) => b.id !== batchId));
          setError(`Gợi ý batch #${batchId} đã hết hạn (>90 phút) và bị xóa tự động. Nhấn "Lấy gợi ý mới" để cập nhật.`);
          setErrorDismissed(false);
        } else {
          handleApiError(err, 'Cập nhật batch thất bại');
        }
      } finally {
        setActionLoadingBatchIds((prev) => prev.filter((id) => id !== batchId));
      }
    },
    [fetchAllBatches, fetchAllTasks, batches, setBatches, setError, handleApiError]
  );

  const suggestBatch = useCallback(async () => {
    setIsSuggesting(true);
    try {
      // suggestBatches returns the new suggestions directly in its response body
      const res = await kitchenAPI.suggestBatches();
      const suggested = res.data.data ?? [];

      if (suggested.length === 0) {
        // No suggestions from AI — still refresh list to keep in sync
        await fetchAllBatches(true);
        setError('AI không tìm thấy nhóm nào phù hợp để gom trong lúc này.');
        setErrorDismissed(false);
      } else {
        // Merge new suggestions into existing batch list (avoid duplicates by id)
        const existingIds = new Set(batches.map((b) => b.id));
        const fresh = suggested.filter((b: KitchenBatchResponse) => !existingIds.has(b.id));
        setBatches([...batches, ...fresh]);
        setError(null);
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        if (status === 404) {
          setError('Endpoint AI batch chưa có trên server này. Liên hệ backend team.');
        } else if (status === 500) {
          setError('AI service lỗi phía server (500). Thử lại sau hoặc liên hệ backend team.');
        } else {
          handleApiError(err, 'Lấy gợi ý batch thất bại');
        }
        setErrorDismissed(false);
      } else {
        handleApiError(err, 'Lấy gợi ý batch thất bại');
      }
    } finally {
      setIsSuggesting(false);
    }
  }, [fetchAllBatches, setBatches, setError, handleApiError]);

  // ─── Display — derived from store ────────────────────────────────────────

  const taskDisplayList = useMemo<KdsTaskDisplay[]>(() => {
    return tasks
      .map((task): KdsTaskDisplay => ({
        taskId:            task.id,
        orderId:           task.orderId,
        orderItemId:       task.orderItemId,
        tableId:           task.tableId,
        menuItemId:        task.menuItemId,
        dishName:          task.menuItemName ?? `Món #${task.orderItemId}`,
        imageUrl:          task.menuItemImageUrl,
        quantity:          task.quantity,
        itemNote:          task.orderItemNote,
        orderNote:         task.orderNote,
        expectedCookTime:  task.expectedCookTime,
        status:            task.status,
        startedAt:         task.startedAt,
        completedAt:       task.completedAt,
        actualCookSeconds: task.actualCookSeconds,
      }))
      .sort((a, b) => a.taskId - b.taskId);
  }, [tasks]);

  const liveTasks = useMemo(
    () => taskDisplayList.filter((t) => t.status === 'CREATED' || t.status === 'COOKING'),
    [taskDisplayList]
  );
  const completedTasks = useMemo<KdsTaskDisplay[]>(
    () =>
      completedTasksList.map((task) => ({
        taskId:            task.id,
        orderId:           task.orderId,
        orderItemId:       task.orderItemId,
        tableId:           task.tableId,
        menuItemId:        task.menuItemId,
        dishName:          task.menuItemName ?? `Món #${task.orderItemId}`,
        imageUrl:          task.menuItemImageUrl,
        quantity:          task.quantity,
        itemNote:          task.orderItemNote,
        orderNote:         task.orderNote,
        expectedCookTime:  task.expectedCookTime,
        status:            task.status,
        startedAt:         task.startedAt,
        completedAt:       task.completedAt,
        actualCookSeconds: task.actualCookSeconds,
      })),
    [completedTasksList]
  );
  const activeBatches = useMemo<KitchenBatchResponse[]>(
    () => batches.filter((b) => b.status !== 'DONE'),
    [batches]
  );

  const resolveBatchDishName = useCallback(
    (menuItemId: number) => {
      const match = tasks.find((t) => t.menuItemId === menuItemId);
      return match?.menuItemName ?? `Món #${menuItemId}`;
    },
    [tasks]
  );

  const waitingCount  = liveTasks.filter((t) => t.status === 'CREATED').length;
  const cookingCount  = liveTasks.filter((t) => t.status === 'COOKING').length;
  // Count from the polling stream so the header badge stays in sync without
  // needing the user to open the completed tab. Falls back to paged total
  // once the user has navigated there.
  const doneCount = useMemo(
    () => taskDisplayList.filter((t) => t.status === 'DONE' || t.status === 'CANCELLED').length,
    [taskDisplayList]
  );
  const isErrorVisible = !!error && !errorDismissed;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      // Unlock audio on the login screen's first interaction
      <div onClick={unlock} onKeyDown={unlock}>
        <Login onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    // Unlock audio on any interaction within the app
    <div
      className="min-h-screen bg-kds-bg flex flex-col font-sans"
      onClick={unlock}
      onKeyDown={unlock}
    >
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        waitingCount={waitingCount}
        cookingCount={cookingCount}
        doneCount={doneCount}
        batchingCount={activeBatches.length}
        isConnected={isWebSocketConnected && !error}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
        now={now}
      />

      {/* ── Error banner (dismissable) ──────────────────── */}
      {isErrorVisible && (
        <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-kds-redBg border-b border-kds-redText/30 text-kds-redText text-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setErrorDismissed(true)}
            className="shrink-0 p-1 rounded hover:bg-kds-redText/10 transition-colors focus:outline-none focus:ring-1 focus:ring-kds-redText/40"
            title="Đóng thông báo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Loading indicator ──────────────────────────── */}
      {loading && (
        <div className="flex items-center gap-2 px-5 py-2 text-xs text-gray-500 border-b border-kds-border/50 bg-kds-bg">
          <span className="w-3 h-3 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin shrink-0" />
          Đang đồng bộ dữ liệu KDS...
        </div>
      )}

      <main className="flex-1 overflow-auto">
        {activeTab === 'live' && (
          <TabLiveOrders
            tasks={liveTasks}
            now={now}
            actionLoadingTaskIds={actionLoadingTaskIds}
            onStartTask={(taskId)  => { void runTaskAction(taskId, 'start'); }}
            onDoneTask={(taskId)   => { void runTaskAction(taskId, 'done'); }}
            onCancelTask={(taskId) => { void runTaskAction(taskId, 'cancel'); }}
          />
        )}
        {activeTab === 'batching' && (
          <TabAiBatching
            batches={activeBatches}
            resolveDishName={resolveBatchDishName}
            actionLoadingBatchIds={actionLoadingBatchIds}
            isSuggesting={isSuggesting}
            onSuggest={() => { void suggestBatch(); }}
            onAccept={(batchId)  => { void runBatchAction(batchId, 'accept'); }}
            onConfirm={(batchId) => { void runBatchAction(batchId, 'confirm'); }}
            onStart={(batchId)   => { void runBatchAction(batchId, 'start'); }}
            onDone={(batchId)    => { void runBatchAction(batchId, 'done'); }}
          />
        )}
        {activeTab === 'completed' && (
          <TabCompleted
            tasks={completedTasks}
            page={completedPage}
            size={completedSize}
            totalElements={completedTotalElements}
            totalPages={completedTotalPages}
            loading={completedLoading}
            onPageChange={(p) => { void fetchCompletedTasks(p, completedSize); }}
            onSizeChange={(s) => { setCompletedSize(s); }}
          />
        )}
      </main>
    </div>
  );
}
