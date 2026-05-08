export interface AuthResponse {
    accessToken: string;
    tokenType: string;
}
export interface LoginRequest {
    username: string;
    password: string;
}
export interface OrderResponse {
    id: number;
    orderNumber: string;
    customerName: string;
    totalAmount: number;
    status: OrderStatus;
}
export declare enum OrderStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    PREPARING = "PREPARING",
    READY = "READY",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export interface CreateOrderRequest {
    customerName: string;
    totalAmount: number;
    itemCount: number;
}
export interface CategoryResponse {
    id: number;
    name: string;
    description?: string;
}
export interface MenuItemResponse {
    id: number;
    name: string;
    description?: string;
    price: number;
    available: boolean;
    categoryName: string;
}
export interface PaymentStatus {
    status: "INITIATED" | "AUTHORIZED" | "CAPTURED" | "FAILED" | "REFUNDED";
}
export interface RecommendationRequest {
    customer_id: string;
    context?: Record<string, string>;
}
export interface RecommendationResponse {
    customer_id: string;
    recommendations: string[];
    confidence: number;
}
export interface AnomalyDetectionRequest {
    metric_name: string;
    values: number[];
}
export interface AnomalyDetectionResponse {
    metric_name: string;
    anomaly_score: number;
    is_anomaly: boolean;
}
//# sourceMappingURL=index.d.ts.map