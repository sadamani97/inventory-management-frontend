import api from "./api";

export interface ProductStatsResponse {
  totalProducts: number;
  addedThisMonth: number;
  activeStock: number;
  lowStock: number;
  outOfStock: number;
  unitsRestockedThisMonth: number;
}

export interface ActivityItem {
  id: string;
  activity: string;
  product: string;
  sku: string;
  qty: string;
  status: "Completed" | "Warning" | "Added" | "Delivered";
  time: string;
}

export interface SalesAnalyticsResponse {
  totalSales: number;
  percentageGrowth: number;
  chartData: Array<{ date: string; sales: number }>;
}

export interface CategoryItem {
  categoryId?: number;
  id?: number;
  categoryName?: string;
  name?: string;
}

export interface BrandItem {
  brandId?: number;
  id?: number;
  brandName?: string;
  name?: string;
}

export interface UnitItem {
  unitId?: number;
  id?: number;
  unitName: string;
  quantity?: number;
}

export interface VendorItem {
  vendorId?: number | string;
  id: number | string;
  vendorName?: string;
  name?: string;
  vendorType?: string;
  email?: string;
  phone?: string;
}

export interface ProductItem {
  id?: number;
  productName: string;
  sku: string;
  barcode?: string;
  categoryId?: number;
  vendorId?: number;
  brandId?: number;
  purchaseRate?: number;
  sellingPrice?: number;
  quantity?: number;
  lowStockLimit?: number;
  unitId?: number;
  status?: "Active" | "Inactive" | "Archived" | "Draft" | "Out of Stock";
  description?: string;
  imageUrl?: string;
  addVarient?: string;
  createdAt?: string;
  updatedAt?: string;
  category?: CategoryItem;
  vendor?: VendorItem;
  brand?: BrandItem;
  unit?: UnitItem;
}

export interface CreateProductPayload {
  productName: string;
  sku: string;
  barcode?: string;
  categoryId: number;
  vendorId?: number;
  brandId?: number;
  brandName?: string;
  purchaseRate: number;
  sellingPrice: number;
  quantity: number;
  lowStockLimit: number;
  unitId: number;
  status: "Active" | "Inactive" | "Archived" | "Draft" | "Out of Stock";
  description?: string;
  imageUrl?: string;
  addVarient?: string;
}

export interface AlertItem {
  id: number | string;
  alertType?: string;
  severity?: "Low" | "Medium" | "High" | "Critical";
  message?: string;
  productId?: number;
  productName?: string;
  createdAt?: string;
}

export interface PurchaseOrderItem {
  id: number | string;
  poNumber?: string;
  vendorName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface SalesOrderItem {
  id: number | string;
  soNumber?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface InvoiceItem {
  id: number | string;
  invoiceNumber?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export interface ReportKpis {
  totalRevenue?: number;
  totalOrders?: number;
  averageOrderValue?: number;
}

export async function fetchProductStats(): Promise<ProductStatsResponse> {
  try {
    const response = await api.get("/api/products/stats");
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch (err) {
    console.warn("Backend /api/products/stats failed", err);
  }
  return {
    totalProducts: 0,
    addedThisMonth: 0,
    activeStock: 0,
    lowStock: 0,
    outOfStock: 0,
    unitsRestockedThisMonth: 0,
  };
}

export async function fetchSalesAnalytics(): Promise<SalesAnalyticsResponse> {
  try {
    const response = await api.get("/api/reports/sales-analytics");
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch (err) {
    console.warn("Backend /api/reports/sales-analytics failed", err);
  }
  return {
    totalSales: 0,
    percentageGrowth: 0,
    chartData: [],
  };
}

export function formatRelativeTime(dateStr?: string | Date): string {
  if (!dateStr) return "Recently";
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? "s" : ""} ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function recordReorderActivity(prod: ProductItem, reorderQty: number) {
  if (typeof window === "undefined") return;
  try {
    const existing: ActivityItem[] = JSON.parse(localStorage.getItem("reorder_activities") || "[]");
    const newActivity: ActivityItem = {
      id: `reorder-${Date.now()}`,
      activity: "Reordered Stock",
      product: String(prod.productName || "Product"),
      sku: String(prod.sku || "-"),
      qty: `+${reorderQty}`,
      status: "Added",
      time: "Just now",
    };
    localStorage.setItem("reorder_activities", JSON.stringify([newActivity, ...existing]));
  } catch (err) {
    console.warn("Failed to record reorder activity", err);
  }
}

export async function fetchRecentActivities(): Promise<ActivityItem[]> {
  let localActivities: ActivityItem[] = [];
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("reorder_activities");
      if (stored) localActivities = JSON.parse(stored);
    } catch (err) {
      console.warn("Failed to parse local reorder activities", err);
    }
  }

  try {
    const response = await api.get("/api/reports/product-performance");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      const apiItems = response.data.data.map((item: Record<string, unknown>, index: number) => ({
        id: String(item?.id || index + 1),
        activity: Number(item?.sold ?? 0) > 0 ? "Stock Out" : "Stock In",
        product: String(item?.productName || "Product"),
        sku: String(item?.sku || `SKU-${index + 1}`),
        qty: Number(item?.sold ?? 0) > 0 ? `-${item.sold}` : `+${item?.currentStock || 0}`,
        status:
          item?.status === "Critical"
            ? "Warning"
            : item?.status === "Fast Moving"
            ? "Completed"
            : "Added",
        time: formatRelativeTime(item?.createdAt as string),
      }));
      return [...localActivities, ...apiItems];
    }
  } catch (err) {
    console.warn("Backend /api/reports/product-performance failed", err);
  }
  return localActivities;
}

export interface StockFlowItem {
  day: string;
  stockAdded: number;
  stockSold: number;
}

export async function fetchStockFlowChartData(daysCount: number = 10): Promise<StockFlowItem[]> {
  try {
    const [response, prods, purchaseOrders, salesOrders] = await Promise.all([
      api.get("/api/reports/sales-vs-purchases").catch(() => null),
      fetchProductsList().catch(() => []),
      fetchPurchaseOrdersList().catch(() => []),
      fetchSalesOrdersList().catch(() => []),
    ]);

    const now = new Date();
    const dateMap: Record<string, { stockAdded: number; stockSold: number }> = {};

    // Initialize dateMap for the requested number of days (5, 10, 30 days)
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateMap[dayKey] = { stockAdded: 0, stockSold: 0 };
    }

    // 1. Populate from backend report endpoint if available
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      response.data.data.forEach((item: { date: string; purchase?: number; sales?: number }) => {
        if (dateMap[item.date]) {
          dateMap[item.date].stockAdded += Number(item.purchase || 0);
          dateMap[item.date].stockSold += Number(item.sales || 0);
        }
      });
    }

    // 2. Add stock from backend Purchase Orders
    if (purchaseOrders && purchaseOrders.length > 0) {
      purchaseOrders.forEach((po) => {
        if (po.createdAt) {
          const poDate = new Date(po.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (dateMap[poDate]) {
            dateMap[poDate].stockAdded += Number(po.totalAmount || 0);
          }
        }
      });
    }

    // 3. Add stock from backend Sales Orders
    if (salesOrders && salesOrders.length > 0) {
      salesOrders.forEach((so) => {
        if (so.createdAt) {
          const soDate = new Date(so.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (dateMap[soDate]) {
            dateMap[soDate].stockSold += Number(so.totalAmount || 0);
          }
        }
      });
    }

    // 4. Add stock from backend Products list in DB
    if (prods && prods.length > 0) {
      prods.forEach((prod) => {
        const prodDate = prod.createdAt || prod.updatedAt;
        const qty = Number(prod.quantity || 0);
        if (prodDate) {
          const dayKey = new Date(prodDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (dateMap[dayKey]) {
            dateMap[dayKey].stockAdded += qty;
          } else {
            // Assign to today if outside range
            const todayKey = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
            if (dateMap[todayKey]) dateMap[todayKey].stockAdded += qty;
          }
        } else {
          const todayKey = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          if (dateMap[todayKey]) dateMap[todayKey].stockAdded += qty;
        }
      });
    }

    const flowItems: StockFlowItem[] = Object.keys(dateMap).map((day) => ({
      day,
      stockAdded: dateMap[day].stockAdded,
      stockSold: dateMap[day].stockSold,
    }));

    return flowItems;
  } catch (err) {
    console.warn("Backend fetchStockFlowChartData failed", err);
  }
  return [];
}

export async function fetchProductsList(): Promise<ProductItem[]> {
  try {
    const response = await api.get("/api/products");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend /api/products failed", err);
  }
  return [];
}

export async function fetchProductById(id: number | string): Promise<ProductItem | null> {
  try {
    const response = await api.get(`/api/products/${id}`);
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch (err) {
    console.warn(`Backend /api/products/${id} failed`, err);
  }
  return null;
}

export async function createProduct(
  payload: CreateProductPayload
): Promise<{ success: boolean; message?: string; data?: ProductItem; error?: unknown }> {
  try {
    const response = await api.post("/api/products", payload);
    return response?.data || { success: false, message: "No data returned" };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string; error?: unknown } }; message?: string };
    const errorMessage = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create product";
    const errorDetail = axiosErr?.response?.data?.error;
    return { success: false, message: errorMessage, error: errorDetail };
  }
}

export async function updateProduct(
  id: number | string,
  payload: Partial<CreateProductPayload>
): Promise<{ success: boolean; message?: string; data?: ProductItem; error?: unknown }> {
  try {
    const response = await api.put(`/api/products/${id}`, payload);
    return response?.data || { success: false, message: "No data returned" };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string; error?: unknown } }; message?: string };
    const errorMessage = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update product";
    const errorDetail = axiosErr?.response?.data?.error;
    return { success: false, message: errorMessage, error: errorDetail };
  }
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const response = await api.get("/api/Categories");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch (err) {
    console.warn("Backend /api/Categories failed", err);
  }
  return [];
}

export async function createCategory(categoryName: string): Promise<{ success: boolean; data?: CategoryItem; message?: string }> {
  try {
    const response = await api.post("/api/Categories", { categoryName });
    return response?.data || { success: false, message: "No response data" };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    return { success: false, message: axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create category" };
  }
}

export async function fetchBrands(): Promise<BrandItem[]> {
  try {
    const response = await api.get("/api/brands");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch (err) {
    console.warn("Backend /api/brands failed", err);
  }
  return [];
}

export async function fetchUnits(): Promise<UnitItem[]> {
  try {
    const response = await api.get("/api/units");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch (err) {
    console.warn("Backend /api/units failed", err);
  }
  return [];
}

export async function fetchAlertsList(): Promise<AlertItem[]> {
  try {
    const response = await api.get("/api/alerts");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend /api/alerts failed", err);
  }
  return [];
}

export async function fetchAlertSummary(): Promise<Record<string, unknown> | null> {
  try {
    const response = await api.get("/api/alerts/summary");
    if (response?.data?.success) {
      return response.data.data;
    }
  } catch (err) {
    console.warn("Backend /api/alerts/summary failed", err);
  }
  return null;
}

export async function fetchVendorsList(): Promise<VendorItem[]> {
  try {
    const response = await api.get("/api/vendors");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend /api/vendors failed", err);
  }
  return [];
}

export async function fetchPurchaseOrdersList(): Promise<PurchaseOrderItem[]> {
  try {
    const response = await api.get("/api/purchase-orders");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend /api/purchase-orders failed", err);
  }
  return [];
}

export async function fetchSalesOrdersList(): Promise<SalesOrderItem[]> {
  try {
    const response = await api.get("/api/sales-orders");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend /api/sales-orders failed", err);
  }
  return [];
}

export async function fetchInvoicesList(): Promise<InvoiceItem[]> {
  try {
    const response = await api.get("/api/invoices");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) {
      return response.data;
    }
  } catch (err) {
    console.warn("Backend /api/invoices failed", err);
  }
  return [];
}

export async function fetchReportKpis(): Promise<ReportKpis | null> {
  try {
    const response = await api.get("/api/reports/kpi-summary");
    if (response?.data?.success) {
      return response.data.data;
    }
  } catch (err) {
    console.warn("Backend /api/reports/kpi-summary failed", err);
  }
  return null;
}
