import api from "./api";
import { toast } from "react-toastify";

// ==================== REPORT KPI TYPES ====================

export interface ReportKpiData {
  inventoryValue: number;
  todaysRevenue: number;
  todaysTotalOrders: number;
  todaysSales: number;
}

export interface SalesAnalyticsData {
  totalSales: number;
  percentageGrowth: number;
  chartData: Array<{ date: string; sales: number }>;
}

export interface SalesVsPurchaseItem {
  date: string;
  purchase: number;
  sales: number;
}

export interface ProductPerformanceItem {
  id: number;
  productName: string;
  sku: string;
  sold: number;
  currentStock: number;
  revenue: number;
  status: "Fast Moving" | "Healthy" | "Low Stock" | "Critical";
  createdAt: string;
}

export interface ProductPerformanceResponse {
  data: ProductPerformanceItem[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== FETCH FUNCTIONS ====================

export async function fetchReportKpiData(): Promise<ReportKpiData> {
  try {
    const response = await api.get("/api/reports/kpi-summary");
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch report KPI data.");
  }
  return {
    inventoryValue: 0,
    todaysRevenue: 0,
    todaysTotalOrders: 0,
    todaysSales: 0,
  };
}

export async function fetchReportSalesAnalytics(params?: {
  days?: number;
  range?: string;
}): Promise<SalesAnalyticsData> {
  try {
    const response = await api.get("/api/reports/sales-analytics", { params });
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch sales analytics.");
  }
  return {
    totalSales: 0,
    percentageGrowth: 0,
    chartData: [],
  };
}

export async function fetchSalesVsPurchases(): Promise<SalesVsPurchaseItem[]> {
  try {
    const response = await api.get("/api/reports/sales-vs-purchases");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch sales vs purchases data.");
  }
  return [];
}

export async function fetchProductPerformance(params?: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<ProductPerformanceResponse> {
  try {
    const response = await api.get("/api/reports/product-performance", { params });
    const payload = response?.data?.data;

    if (response?.data?.success) {
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      const safeItemsLength = Array.isArray(items) ? items.length : 0;
      const resolvedTotalItems = Number(response?.data?.totalItems ?? payload?.totalItems ?? safeItemsLength ?? 0);
      const resolvedPage = Number(response?.data?.page ?? payload?.page ?? params?.page ?? 1);
      const resolvedLimit = Number(response?.data?.limit ?? payload?.limit ?? params?.limit ?? safeItemsLength ?? 10);
      const resolvedTotalPages = Number(
        response?.data?.totalPages ?? payload?.totalPages ?? Math.max(1, Math.ceil(resolvedTotalItems / (resolvedLimit || 1))) ?? 1,
      );

      return {
        data: items,
        totalItems: Number.isFinite(resolvedTotalItems) ? resolvedTotalItems : safeItemsLength,
        page: Number.isFinite(resolvedPage) ? resolvedPage : 1,
        limit: Number.isFinite(resolvedLimit) ? resolvedLimit : safeItemsLength || 10,
        totalPages: Number.isFinite(resolvedTotalPages) ? resolvedTotalPages : 1,
      };
    }
  } catch {
    toast.error("Failed to fetch product performance data.");
  }

  return {
    data: [],
    totalItems: 0,
    page: params?.page ?? 1,
    limit: params?.limit ?? 10,
    totalPages: 1,
  };
}
