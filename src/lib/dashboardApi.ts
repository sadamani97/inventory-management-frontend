import api from "./api";
import { toast } from "react-toastify";

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
  productId?: number;
  productName?: string;
  quantity?: number;
  unitCost?: number;
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
  } catch {
    toast.error("Failed to fetch product stats from backend.");
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
  } catch {
    toast.error("Failed to fetch sales analytics from backend.");
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

  if (diffInSeconds < 60) return `${diffInSeconds} min${diffInSeconds > 1 ? "s" : ""} ago`;
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
    const [perfRes, poRes] = await Promise.all([
      api.get("/api/reports/product-performance").catch(() => null),
      api.get("/api/purchase-orders").catch(() => null),
    ]);

    const items: ActivityItem[] = [];

    if (poRes?.data?.success && Array.isArray(poRes?.data?.data)) {
      poRes.data.data.forEach((po: Record<string, unknown>, idx: number) => {
        items.push({
          id: `po-${po.id || idx}`,
          activity: "Reordered Stock",
          product: String(po.productName || po.vendorName || "Product Order"),
          sku: String(po.sku || "PO-ORD"),
          qty: po.quantity ? `+${po.quantity}` : `₹${po.totalAmount || 0}`,
          status: "Added",
          time: formatRelativeTime(po.createdAt as string),
        });
      });
    }

    if (perfRes?.data?.success && Array.isArray(perfRes?.data?.data)) {
      perfRes.data.data.forEach((item: Record<string, unknown>, index: number) => {
        items.push({
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
        });
      });
    }

    return items;
  } catch {
    toast.error("Failed to load recent activity data.");
  }
  return [];
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
      const todayKey = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      prods.forEach((prod) => {
        const prodDate = prod.createdAt || prod.updatedAt;
        const qty = Number(prod.quantity || 0);
        const dayKey = prodDate
          ? new Date(prodDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : todayKey;

        const targetKey = dateMap[dayKey] ? dayKey : todayKey;
        if (dateMap[targetKey]) {
          dateMap[targetKey].stockAdded += qty;
        }
      });
    }

    const flowItems: StockFlowItem[] = Object.keys(dateMap).map((day) => ({
      day,
      stockAdded: dateMap[day].stockAdded,
      stockSold: dateMap[day].stockSold,
    }));

    return flowItems;
  } catch {
    toast.error("Failed to load stock flow chart data.");
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
  } catch {
    toast.error("Failed to fetch products list from backend.");
  }
  return [];
}

export async function fetchProductById(id: number | string): Promise<ProductItem | null> {
  try {
    const response = await api.get(`/api/products/${id}`);
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch {
    toast.error(`Failed to fetch product details for ID: ${id}`);
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
    toast.error(errorMessage);
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
    toast.error(errorMessage);
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
  } catch {
    toast.error("Failed to fetch categories.");
  }
  return [];
}

export async function createCategory(categoryName: string): Promise<{ success: boolean; data?: CategoryItem; message?: string }> {
  try {
    const response = await api.post("/api/Categories", { categoryName });
    return response?.data || { success: false, message: "No response data" };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create category";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function fetchBrands(): Promise<BrandItem[]> {
  try {
    const response = await api.get("/api/brands");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch {
    toast.error("Failed to fetch brands.");
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
  } catch {
    toast.error("Failed to fetch units.");
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
  } catch {
    toast.error("Failed to fetch alerts list.");
  }
  return [];
}

export async function fetchAlertSummary(): Promise<Record<string, unknown> | null> {
  try {
    const response = await api.get("/api/alerts/summary");
    if (response?.data?.success) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch alert summary.");
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
  } catch {
    toast.error("Failed to fetch vendors list.");
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
  } catch {
    toast.error("Failed to fetch purchase orders.");
  }
  return [];
}

export async function createPurchaseOrder(payload: {
  vendorName: string;
  totalAmount: number;
  status?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  unitCost?: number;
}): Promise<{ success: boolean; message?: string; data?: PurchaseOrderItem }> {
  try {
    const response = await api.post("/api/purchase-orders", payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create purchase order";
    toast.error(msg);
    return { success: false, message: msg };
  }
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
  } catch {
    toast.error("Failed to fetch sales orders.");
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
  } catch {
    toast.error("Failed to fetch invoices.");
  }
  return [];
}

export async function fetchReportKpis(): Promise<ReportKpis | null> {
  try {
    const response = await api.get("/api/reports/kpi-summary");
    if (response?.data?.success) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch report KPI summary.");
  }
  return null;
}
