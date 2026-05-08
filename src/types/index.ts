// KDS Web — TypeScript types
// Only includes types relevant to /kitchen/** endpoints (KITCHEN role).
// /menu and /orders are NOT accessible by KITCHEN role — those types are removed.

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

// ─── Kitchen Task ────────────────────────────────────────────────────────────

export type KitchenTaskStatus = "CREATED" | "COOKING" | "DONE" | "CANCELLED";

export interface KitchenTaskResponse {
  id: number;
  orderId: number;
  orderItemId: number;
  tableId: number;
  menuItemId: number | null;
  menuItemName: string | null;
  menuItemImageUrl: string | null;
  quantity: number;
  orderItemNote: string | null;
  orderNote: string | null;
  expectedCookTime: number | null;
  status: KitchenTaskStatus;
  startedAt: string | null;
  completedAt: string | null;
  actualCookSeconds: number | null;
}

// ─── Kitchen Batch (AI-assisted) ─────────────────────────────────────────────

export type KitchenBatchStatus = "SUGGESTED" | "ACCEPTED" | "CONFIRMED" | "IN_PROGRESS" | "DONE";

export interface KitchenBatchResponse {
  id: number;
  menuItemId: number;
  quantity: number;
  status: KitchenBatchStatus;
  source: "AI" | "MANUAL";
  aiConfidence: number | null;
  estimatedSavingMinutes: number | null;
  batchNote: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

// ─── KDS Display Model (derived from KitchenTaskResponse) ────────────────────

/** Display-ready model — derived from KitchenTaskResponse snapshot fields. */
export interface KdsTaskDisplay {
  taskId: number;
  orderId: number;
  orderItemId: number;
  tableId: number;
  menuItemId: number | null;
  /** menuItemName snapshot, or "Món #orderItemId" fallback for pre-migration tasks */
  dishName: string;
  imageUrl: string | null;
  quantity: number;
  itemNote: string | null;
  orderNote: string | null;
  expectedCookTime: number | null;
  status: KitchenTaskStatus;
  startedAt: string | null;
  completedAt: string | null;
  actualCookSeconds: number | null;
}
