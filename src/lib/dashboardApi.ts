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
  brand?: BrandItem;
  unit?: UnitItem;
}

export interface CreateProductPayload {
  productName: string;
  sku: string;
  barcode?: string;
  categoryId: number;
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
    if (response.data && response.data.success && response.data.data) {
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
    if (response.data && response.data.success && response.data.data) {
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

export async function fetchRecentActivities(): Promise<ActivityItem[]> {
  try {
    const response = await api.get("/api/reports/product-performance");
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map((item: Record<string, unknown>, index: number) => ({
        id: String(item.id || index + 1),
        activity: Number(item.sold ?? 0) > 0 ? "Stock Out" : "Stock In",
        product: String(item.productName || "Product"),
        sku: String(item.sku || `SKU-${index + 1}`),
        qty: Number(item.sold ?? 0) > 0 ? `-${item.sold}` : `+${item.currentStock || 0}`,
        status:
          item.status === "Critical"
            ? "Warning"
            : item.status === "Fast Moving"
            ? "Completed"
            : "Added",
        time: formatRelativeTime(item.createdAt as string),
      }));
    }
  } catch (err) {
    console.warn("Backend /api/reports/product-performance failed", err);
  }
  return [];
}

export async function fetchProductsList(): Promise<ProductItem[]> {
  try {
    const response = await api.get("/api/products");
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
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
    if (response.data && response.data.success && response.data.data) {
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
    return response.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string; error?: unknown } }; message?: string };
    const errorMessage = axiosErr.response?.data?.message || axiosErr.message || "Failed to create product";
    const errorDetail = axiosErr.response?.data?.error;
    return { success: false, message: errorMessage, error: errorDetail };
  }
}

export async function updateProduct(
  id: number | string,
  payload: Partial<CreateProductPayload>
): Promise<{ success: boolean; message?: string; data?: ProductItem; error?: unknown }> {
  try {
    const response = await api.put(`/api/products/${id}`, payload);
    return response.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string; error?: unknown } }; message?: string };
    const errorMessage = axiosErr.response?.data?.message || axiosErr.message || "Failed to update product";
    const errorDetail = axiosErr.response?.data?.error;
    return { success: false, message: errorMessage, error: errorDetail };
  }
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  try {
    const response = await api.get("/api/Categories");
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) return response.data;
  } catch (err) {
    console.warn("Backend /api/Categories failed", err);
  }
  return [];
}

export async function createCategory(categoryName: string): Promise<{ success: boolean; data?: CategoryItem; message?: string }> {
  try {
    const response = await api.post("/api/Categories", { categoryName });
    return response.data;
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    return { success: false, message: axiosErr.response?.data?.message || axiosErr.message || "Failed to create category" };
  }
}

export async function fetchBrands(): Promise<BrandItem[]> {
  try {
    const response = await api.get("/api/brands");
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) return response.data;
  } catch (err) {
    console.warn("Backend /api/brands failed", err);
  }
  return [];
}

export async function fetchUnits(): Promise<UnitItem[]> {
  try {
    const response = await api.get("/api/units");
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) return response.data;
  } catch (err) {
    console.warn("Backend /api/units failed", err);
  }
  return [];
}

export async function fetchAlertsList(): Promise<AlertItem[]> {
  try {
    const response = await api.get("/api/alerts");
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
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
    if (response.data && response.data.success) {
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
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
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
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
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
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
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
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
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
    if (response.data && response.data.success) {
      return response.data.data;
    }
  } catch (err) {
    console.warn("Backend /api/reports/kpi-summary failed", err);
  }
  return null;
}
