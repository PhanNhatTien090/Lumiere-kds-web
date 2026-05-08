export type DishStatus = 'START' | 'COOKING' | 'DONE' | 'RUSH';
export type TableStatus = 'NEW' | 'COOKING' | 'WAITING' | 'COMPLETED';
export interface OrderItem {
    id: string;
    quantity: number;
    name: string;
    note?: string;
    status: DishStatus;
}
export interface TableOrder {
    id: string;
    tableName: string;
    status: TableStatus;
    statusText: string;
    timer: string;
    isUrgent?: boolean;
    items: OrderItem[];
}
export declare const liveOrders: TableOrder[];
export interface BatchItemDetail {
    tableCode: string;
    quantity: number;
    note: string;
    warning?: boolean;
}
export interface BatchOrder {
    id: string;
    titleQuantity: number;
    dishName: string;
    orderCount: number;
    tableCount: number;
    instruction: string;
    details: BatchItemDetail[];
    savedTime: string;
    tablesSummary: string;
}
export declare const batchOrders: BatchOrder[];
export interface CompletedOrder {
    id: string;
    tableName: string;
    summary: string;
    servedTime: string;
    duration: string;
}
export declare const completedOrders: CompletedOrder[];
//# sourceMappingURL=mockData.d.ts.map