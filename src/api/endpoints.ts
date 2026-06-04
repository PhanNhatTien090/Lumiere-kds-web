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

// ─── Inventory & Menu — for "Báo hết" modal ──────────────────────────────────

export interface KitchenInventoryItem {
  id: number;
  name: string;
  unit: string;
  currentQty: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
}

export interface KitchenMenuItem {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: boolean;
}

interface FullMenuCategoryWithItems {
  id: number;
  name: string;
  items: KitchenMenuItem[];
}

export const inventoryAPI = {
  /** GET /kitchen/inventory — both KITCHEN and MANAGER can read. */
  list: () =>
    coreInstance.get<ApiResponse<KitchenInventoryItem[]>>("/kitchen/inventory"),
  /** PUT /kitchen/inventory/{id}/adjust — báo hết NL = newQuantity:0. */
  adjust: (ingredientId: number, body: { newQuantity: number; note?: string }) =>
    coreInstance.put<ApiResponse<KitchenInventoryItem>>(
      `/kitchen/inventory/${ingredientId}/adjust`,
      body,
    ),
  /**
   * POST /kitchen/inventory/stock/import — nhập kho kèm hạn dùng (tạo lô mới, FEFO).
   * Khai báo hạn dùng theo số ngày sử dụng (shelfLifeDays) hoặc ngày hết hạn (expiryDate).
   */
  importStock: (body: {
    ingredientId: number;
    quantity: number;
    expiryDate?: string; // yyyy-MM-dd
    shelfLifeDays?: number;
    note?: string;
  }) =>
    coreInstance.post<ApiResponse<KitchenInventoryItem>>(
      "/kitchen/inventory/stock/import",
      body,
    ),
};

export const menuAPI = {
  /** GET /menu — categories nested with items (price, available...). */
  listFlat: async (): Promise<KitchenMenuItem[]> => {
    const res = await coreInstance.get<ApiResponse<FullMenuCategoryWithItems[]>>("/menu");
    return (res.data.data ?? []).flatMap((cat) => cat.items ?? []);
  },
};

export const kitchenMenuAPI = {
  /** POST /kitchen/menu-items/{id}/mark-unavailable — bếp tắt món. */
  markUnavailable: (menuItemId: number, reason?: string) =>
    coreInstance.post<ApiResponse<unknown>>(
      `/kitchen/menu-items/${menuItemId}/mark-unavailable`,
      { reason },
    ),
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
  /** POST /auth/change-password — any authenticated staff (incl. KITCHEN). */
  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    coreInstance.post<ApiResponse<unknown>>("/auth/change-password", payload),
};
