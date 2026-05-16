import { coreInstance } from "./client";
import {
  ApiResponse,
  KitchenBatchResponse,
  KitchenBatchStatus,
  KitchenTaskResponse,
  KitchenTaskStatus,
} from "@/types";

// ─── Kitchen API ─────────────────────────────────────────────────────────────
// All endpoints under /kitchen/** are accessible by KITCHEN and MANAGER roles.

export const kitchenAPI = {
  // Tasks
  listTasks: (status?: KitchenTaskStatus) =>
    coreInstance.get<ApiResponse<KitchenTaskResponse[]>>("/kitchen/tasks", {
      params: status ? { status } : undefined,
    }),
  /** Paginated DONE/CANCELLED history — used by "Đã xong" tab. */
  listCompletedTasksPaged: (params: { page?: number; size?: number }) =>
    coreInstance.get<ApiResponse<{
      content: KitchenTaskResponse[];
      page: number;
      size: number;
      totalElements: number;
      totalPages: number;
    }>>("/kitchen/tasks/paged", {
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    }),
  startTask: (taskId: number) =>
    coreInstance.put<ApiResponse<KitchenTaskResponse>>(`/kitchen/tasks/${taskId}/start`),
  doneTask: (taskId: number) =>
    coreInstance.put<ApiResponse<KitchenTaskResponse>>(`/kitchen/tasks/${taskId}/done`),
  cancelTask: (taskId: number) =>
    coreInstance.put<ApiResponse<KitchenTaskResponse>>(`/kitchen/tasks/${taskId}/cancel`),

  // Batches
  listBatches: (status?: KitchenBatchStatus) =>
    coreInstance.get<ApiResponse<KitchenBatchResponse[]>>("/kitchen/batches", {
      params: status ? { status } : undefined,
    }),
  suggestBatches: () =>
    coreInstance.post<ApiResponse<KitchenBatchResponse[]>>("/kitchen/batches/suggest"),
  acceptBatch: (batchId: number) =>
    coreInstance.put<ApiResponse<KitchenBatchResponse>>(`/kitchen/batches/${batchId}/accept`),
  confirmBatch: (batchId: number) =>
    coreInstance.put<ApiResponse<KitchenBatchResponse>>(`/kitchen/batches/${batchId}/confirm`),
  startBatch: (batchId: number) =>
    coreInstance.put<ApiResponse<KitchenBatchResponse>>(`/kitchen/batches/${batchId}/start`),
  doneBatch: (batchId: number) =>
    coreInstance.put<ApiResponse<KitchenBatchResponse>>(`/kitchen/batches/${batchId}/done`),
};

// ─── Auth API ────────────────────────────────────────────────────────────────
// /auth/login is permitAll — no role required.

export const authAPI = {
  login: (username: string, password: string) =>
    coreInstance.post<ApiResponse<{ accessToken: string; staff: { id: number; role: string } }>>(
      "/auth/login",
      { username, password }
    ),
  logout: () => coreInstance.post<ApiResponse<unknown>>("/auth/logout"),
};
