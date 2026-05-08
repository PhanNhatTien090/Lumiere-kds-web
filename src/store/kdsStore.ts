import { create } from "zustand";
import { KitchenBatchResponse, KitchenTaskResponse } from "@/types";

// KITCHEN role only has access to /kitchen/** endpoints.
// /menu and /orders are NOT accessible (403) for KITCHEN role.
// Store only tracks what kitchen endpoints provide.
interface KdsStore {
  tasks: KitchenTaskResponse[];
  batches: KitchenBatchResponse[];
  isWebSocketConnected: boolean;
  loading: boolean;
  error: string | null;
  setTasks: (tasks: KitchenTaskResponse[]) => void;
  setBatches: (batches: KitchenBatchResponse[]) => void;
  upsertTask: (task: KitchenTaskResponse) => void;
  upsertBatch: (batch: KitchenBatchResponse) => void;
  setWebSocketConnected: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useKdsStore = create<KdsStore>((set) => ({
  tasks: [],
  batches: [],
  isWebSocketConnected: false,
  loading: false,
  error: null,
  setTasks: (tasks) => set({ tasks }),
  setBatches: (batches) => set({ batches }),
  upsertTask: (task) =>
    set((state) => ({
      tasks: state.tasks.some((item) => item.id === task.id)
        ? state.tasks.map((item) => (item.id === task.id ? task : item))
        : [...state.tasks, task],
    })),
  upsertBatch: (batch) =>
    set((state) => ({
      batches: state.batches.some((item) => item.id === batch.id)
        ? state.batches.map((item) => (item.id === batch.id ? batch : item))
        : [...state.batches, batch],
    })),
  setWebSocketConnected: (connected) => set({ isWebSocketConnected: connected }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () =>
    set({
      tasks: [],
      batches: [],
      isWebSocketConnected: false,
      loading: false,
      error: null,
    }),
}));
