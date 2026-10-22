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

export interface VendorTypeItem {
  vendorTypeId?: number;
  id?: number;
  typeName: string;
  name?: string;
}

export interface CountryItem {
  countryId?: number;
  id?: number;
  countryName: string;
  countryCode: string;
}

export interface StateItem {
  stateId?: number;
  id?: number;
  stateName: string;
  countryId: number;
}

export interface CityItem {
  cityId?: number;
  id?: number;
  cityName: string;
  stateId: number;
}

export interface AddressItem {
  addressId?: number;
  id?: number;
  addressLine: string;
  cityId: number;
  stateId: number;
  countryId: number;
  pincode: string;
  vendorId?: number;
}

export interface VendorContactItem {
  vendorContactId?: number;
  id?: number;
  name: string;
  email: string;
  mobile: string;
  vendorId?: number;
}

export interface VendorBankDetailsItem {
  vendorBankDetailId?: number;
  id?: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  isPrimary?: boolean;
  upiId?: string;
  vendorId?: number;
}

export interface VendorItem {
  vendorId?: number | string;
  id?: number | string;
  vendorName: string;
  companyName: string;
  vendorTypeId: number;
  website?: string;
  gstin: string;
  status?: "active" | "inactive" | "suspended" | "terminated";
  name?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
  vendorCode?: string;
  panNumber?: string;
  currency?: string;
  creditLimit?: string | number;
  productCategory?: string;
  preferredProducts?: string;
  leadTime?: string;
  gstCertificate?: string;
  agreement?: string;
  vendorLogo?: string;
  isStarred?: boolean;
  vendorType?: VendorTypeItem;
  addresses?: AddressItem[];
  contacts?: VendorContactItem[];
  bankDetails?: VendorBankDetailsItem[];
}

export interface VendorStatsResponse {
  totalVendors: number;
  activeVendors: number;
  newVendors: number;
  activePurchaseOrders: number;
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
  minStock?: number;
  minOrder?: number;
  productId?: number | string;
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
  description?: string;
  productId?: number | string;
  productName?: string;
  relatedItem?: string;
  referenceId?: number | string;
  refId?: number | string;
  vendorName?: string;
  amount?: number;
  status?: string;
  createdAt?: string;
  type?: string;
}

export interface PurchaseOrderItem {
  id: number | string;
  poNumber?: string;
  vendorName?: string;
  vendor?: {
    vendorName?: string;
    companyName?: string;
  };
  totalAmount?: number;
  status?: string;
  productId?: number;
  productName?: string;
  quantity?: number;
  unitCost?: number;
  createdAt?: string;
  expectedDeliveryDate?: string;
  orderDate?: string;
  items?: { quantity?: number }[];
}

export interface SalesOrderItem {
  id: number | string;
  soNumber?: string;
  orderNumber?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  orderDate?: string;
  customerType?: string;
  quantity?: number;
  isDraft?: boolean;
  items?: { quantity?: number }[];
}

export interface SalesOrderStatsResponse {
  totalSalesOrders: number;
  totalOrderValue: number;
  totalOrderValueFormatted: string;
  averageOrderValue: number;
  averageOrderValueFormatted: string;
  activeBuyers: number;
}

export interface InvoiceItem {
  id: number | string;
  invoiceNumber?: string;
  vendorName?: string;
  customerName?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
  vendor?: {
    vendorName?: string;
    companyName?: string;
  };
}

type ApiRecord = Record<string, unknown> | null | undefined;

function getValue(record: ApiRecord, key: string): unknown {
  if (!record || typeof record !== "object") return undefined;
  return (record as Record<string, unknown>)[key];
}

function getFirstDefinedValue(...values: unknown[]): unknown {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function getTextValue(...values: unknown[]): string | undefined {
  const value = getFirstDefinedValue(...values);
  if (value === undefined) return undefined;
  return String(value);
}

function getNumberValue(...values: unknown[]): number | undefined {
  const value = getFirstDefinedValue(...values);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getNestedValue(record: ApiRecord, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = getValue(record, key);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

export function normalizeAlertItem(raw: ApiRecord): AlertItem {
  const productRecord = raw && typeof raw === "object" ? (raw as Record<string, unknown>).product as ApiRecord : undefined;
  const vendorRecord = raw && typeof raw === "object" ? (raw as Record<string, unknown>).vendor as ApiRecord : undefined;

  const alertType = getTextValue(
    getNestedValue(raw, "alertType", "type", "alert_type", "alertName", "category", "kind", "name", "title"),
    getNestedValue(productRecord, "productName", "name")
  ) || "Alert";

  const productName = getTextValue(
    getNestedValue(raw, "productName", "product_name", "relatedItem", "related_item", "itemName", "item_name"),
    getNestedValue(productRecord, "productName", "name"),
    getNestedValue(raw, "name")
  );

  const message = getTextValue(
    getNestedValue(raw, "message", "description", "details", "summary", "note", "reason", "comments")
  );

  const referenceId = getTextValue(
    getNestedValue(raw, "referenceId", "refId", "ref_id", "productId", "product_id", "id", "alertId", "invoiceNumber", "poNumber")
  );

  const status = getTextValue(
    getNestedValue(raw, "status", "alertStatus", "state", "currentStatus", "actionStatus")
  );

  return {
    id: getFirstDefinedValue(getNestedValue(raw, "id", "alertId", "_id"), referenceId, `alert-${Date.now()}`) as string | number,
    alertType,
    severity: (getTextValue(
      getNestedValue(raw, "severity", "level", "priority", "alertLevel")
    ) || "Medium") as AlertItem["severity"],
    message,
    description: message,
    productId: (() => {
      const value = getNumberValue(getNestedValue(raw, "productId", "product_id", "referenceId", "refId"));
      if (value !== undefined) return value;
      const fallback = Number(referenceId ?? 0);
      return Number.isFinite(fallback) ? fallback : undefined;
    })(),
    productName,
    relatedItem: productName,
    referenceId: referenceId,
    refId: referenceId,
    vendorName: getTextValue(getNestedValue(raw, "vendorName", "supplierName"), getNestedValue(vendorRecord, "vendorName", "companyName"), getNestedValue(raw, "customerName")),
    amount: getNumberValue(getNestedValue(raw, "amount", "totalAmount", "value", "invoiceAmount")),
    status,
    createdAt: getTextValue(getNestedValue(raw, "createdAt", "timestamp", "time", "date", "updatedAt")),
    type: alertType,
  };
}

export function normalizeInvoiceItem(raw: ApiRecord): InvoiceItem {
  const vendorRecord = raw && typeof raw === "object" ? (raw as Record<string, unknown>).vendor as ApiRecord : undefined;
  const invoiceNumber = getTextValue(
    getNestedValue(raw, "invoiceNumber", "invoice_number", "invoiceId", "invoice_id", "id"),
    "INV"
  ) || "INV";
  const vendorName = getTextValue(
    getNestedValue(raw, "vendorName", "supplierName", "companyName"),
    getNestedValue(vendorRecord, "vendorName", "companyName"),
    getNestedValue(raw, "customerName")
  ) || "Vendor";

  return {
    id: getFirstDefinedValue(getNestedValue(raw, "id", "invoiceId", "_id"), invoiceNumber) as string | number,
    invoiceNumber,
    vendorName,
    customerName: vendorName,
    totalAmount: getNumberValue(getNestedValue(raw, "totalAmount", "amount", "value", "invoiceAmount")) ?? 0,
    status: getTextValue(getNestedValue(raw, "status", "paymentStatus", "invoiceStatus")) || "Pending",
    createdAt: getTextValue(getNestedValue(raw, "createdAt", "invoiceDate", "date", "dueDate")),
    vendor: (vendorRecord as { vendorName?: string; companyName?: string }) || { vendorName, companyName: vendorName },
  };
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
  if (!dateStr) return "Just now";

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Just now";

  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();

  if (diffInMs <= 0) return "Just now";

  const diffInMinutes = Math.floor(diffInMs / 60000);
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;

  const diffInHours = Math.floor(diffInMs / 3600000);
  if (diffInHours < 24) return "Today";

  const diffInDays = Math.floor(diffInMs / 86400000);
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays < 7) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
  if (diffInDays < 14) return "Last week";
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) === 1 ? "" : "s"} ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface PaginatedResult<T> {
  data: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchRecentActivitiesPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<ActivityItem>> {
  try {
    const response = await api.get("/api/reports/recent-activities", { params });
    if (response?.data?.success) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        data: rows.map((it: Record<string, unknown>) => ({
          ...(it as Record<string, unknown>),
          time: formatRelativeTime(getTextValue(it.time, it.createdAt) || getTextValue(it.createdAt)),
        })),
        totalItems: response.data.totalItems ?? rows.length,
        page: response.data.page ?? (params.page || 1),
        limit: response.data.limit ?? (params.limit || 10),
        totalPages: response.data.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to load recent activity data from backend:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
}

export async function fetchRecentActivities(): Promise<ActivityItem[]> {
  const res = await fetchRecentActivitiesPaginated({ page: 1, limit: 10 });
  return res.data;
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

export async function fetchProductsPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  categoryName?: string;
}): Promise<PaginatedResult<ProductItem>> {
  try {
    const response = await api.get("/api/products", { params });
    if (response?.data?.success) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        data: rows,
        totalItems: response.data.totalItems ?? rows.length,
        page: response.data.page ?? (params.page || 1),
        limit: response.data.limit ?? (params.limit || 10),
        totalPages: response.data.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to fetch paginated products:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
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

export async function fetchAlertsPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  severity?: string;
}): Promise<PaginatedResult<AlertItem>> {
  try {
    const response = await api.get("/api/alerts", { params });
    const payload = response?.data?.data ?? response?.data ?? {};
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.alerts)
          ? payload.alerts
          : Array.isArray(payload?.rows)
            ? payload.rows
            : [];

    if (response?.data?.success || rows.length > 0 || payload && Object.keys(payload).length > 0) {
      return {
        data: rows.map((item: unknown) => normalizeAlertItem(item as ApiRecord)),
        totalItems: response?.data?.totalItems ?? payload?.totalItems ?? rows.length,
        page: response?.data?.page ?? payload?.page ?? (params.page || 1),
        limit: response?.data?.limit ?? payload?.limit ?? (params.limit || 10),
        totalPages: response?.data?.totalPages ?? payload?.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to fetch paginated alerts:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
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
    const payload = response?.data?.data ?? response?.data ?? null;
    if (response?.data?.success || payload) {
      return payload && typeof payload === "object" ? payload : null;
    }
  } catch {
    toast.error("Failed to fetch alert summary.");
  }
  return null;
}

export async function fetchVendorsPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  starredOnly?: boolean;
}): Promise<PaginatedResult<VendorItem>> {
  try {
    const response = await api.get("/api/vendors", { params });
    if (response?.data?.success) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        data: rows,
        totalItems: response.data.totalItems ?? rows.length,
        page: response.data.page ?? (params.page || 1),
        limit: response.data.limit ?? (params.limit || 10),
        totalPages: response.data.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to fetch paginated vendors:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
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

export async function fetchPurchaseOrdersPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<PurchaseOrderItem>> {
  try {
    const response = await api.get("/api/purchase-orders", { params });
    if (response?.data?.success) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        data: rows,
        totalItems: response.data.totalItems ?? rows.length,
        page: response.data.page ?? (params.page || 1),
        limit: response.data.limit ?? (params.limit || 10),
        totalPages: response.data.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to fetch paginated purchase orders:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
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

export interface CreatePurchaseOrderPayload {
  poNumber: string;
  vendorId: number;
  vendorName?: string;
  deliveryAddressId: number;
  orderDate: string;
  expectedDeliveryDate: string;
  paymentTerms: string;
  shipmentMethod: string;
  notes?: string;
  status?: string;
  subtotal?: number;
  taxPercentage?: number;
  taxAmount?: number;
  totalAmount?: number;
  items?: {
    productId: number;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload): Promise<{ success: boolean; message?: string; data?: PurchaseOrderItem }> {
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

export interface CreateSalesOrderPayload {
  orderNumber: string;
  customerType: string;
  customerName?: string;
  phone?: string;
  status: string;
  paymentMode: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  items?: {
    productId: number;
    productName?: string;
    quantity: number;
    unitPrice: number;
  }[];
}

export async function createSalesOrder(payload: CreateSalesOrderPayload): Promise<{ success: boolean; message?: string; data?: SalesOrderItem }> {
  try {
    const response = await api.post("/api/sales-orders", payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create sales order";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function updateSalesOrder(id: number | string, payload: Partial<CreateSalesOrderPayload>): Promise<{ success: boolean; message?: string; data?: SalesOrderItem }> {
  try {
    const response = await api.put(`/api/sales-orders/${id}`, payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update sales order";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function deleteSalesOrder(id: number | string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.delete(`/api/sales-orders/${id}`);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to delete sales order";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function fetchSalesOrdersPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<SalesOrderItem>> {
  try {
    const response = await api.get("/api/sales-orders", { params });
    if (response?.data?.success) {
      const rows = Array.isArray(response.data.data) ? response.data.data : [];
      return {
        data: rows,
        totalItems: response.data.totalItems ?? rows.length,
        page: response.data.page ?? (params.page || 1),
        limit: response.data.limit ?? (params.limit || 10),
        totalPages: response.data.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to fetch paginated sales orders:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
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

export async function fetchSalesOrderStats(): Promise<SalesOrderStatsResponse | null> {
  try {
    const response = await api.get("/api/sales-orders/stats");
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch sales order stats.");
  }
  return null;
}

export async function fetchInvoicesPaginated(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<PaginatedResult<InvoiceItem>> {
  try {
    const response = await api.get("/api/invoices", { params });
    const payload = response?.data?.data ?? response?.data ?? {};
    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.invoices)
          ? payload.invoices
          : Array.isArray(payload?.rows)
            ? payload.rows
            : [];

    if (response?.data?.success || rows.length > 0 || payload && Object.keys(payload).length > 0) {
      return {
        data: rows.map((item: unknown) => normalizeInvoiceItem(item as ApiRecord)),
        totalItems: response?.data?.totalItems ?? payload?.totalItems ?? rows.length,
        page: response?.data?.page ?? payload?.page ?? (params.page || 1),
        limit: response?.data?.limit ?? payload?.limit ?? (params.limit || 10),
        totalPages: response?.data?.totalPages ?? payload?.totalPages ?? 1,
      };
    }
  } catch (err) {
    console.error("Failed to fetch paginated invoices:", err);
  }
  return { data: [], totalItems: 0, page: params.page || 1, limit: params.limit || 10, totalPages: 1 };
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

// ==================== VENDOR MODULE API HELPERS ====================

export async function fetchVendorStats(): Promise<VendorStatsResponse> {
  try {
    const response = await api.get("/api/vendors/stats");
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch {
    // Return empty stats silently on error
  }
  return {
    totalVendors: 0,
    activeVendors: 0,
    newVendors: 0,
    activePurchaseOrders: 0,
  };
}

export async function fetchVendorById(id: number | string): Promise<VendorItem | null> {
  try {
    const response = await api.get(`/api/vendors/${id}`);
    if (response?.data?.success && response?.data?.data) {
      return response.data.data;
    }
  } catch {
    toast.error("Failed to fetch vendor details.");
  }
  return null;
}

export async function createVendor(payload: {
  vendorName: string;
  companyName: string;
  vendorTypeId: number;
  website?: string;
  gstin: string;
  status?: string;
}): Promise<{ success: boolean; message?: string; data?: VendorItem }> {
  try {
    const response = await api.post("/api/vendors", payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create vendor";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function updateVendor(
  id: number | string,
  payload: Partial<VendorItem>
): Promise<{ success: boolean; message?: string; data?: VendorItem }> {
  try {
    const response = await api.put(`/api/vendors/${id}`, payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update vendor";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function setVendorStarred(
  id: number | string,
  isStarred: boolean
): Promise<{ success: boolean; message?: string; data?: VendorItem }> {
  try {
    const response = await api.patch(`/api/vendors/${id}/star`, { isStarred });
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update starred vendor";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function deleteVendor(id: number | string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await api.delete(`/api/vendors/${id}`);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to delete vendor";
    toast.error(msg);
    return { success: false, message: msg };
  }
}

export async function fetchVendorTypes(): Promise<VendorTypeItem[]> {
  try {
    const response = await api.get("/api/vendor-types");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch {
    toast.error("Failed to fetch vendor types.");
  }
  return [];
}

export async function createVendorType(typeName: string): Promise<{ success: boolean; data?: VendorTypeItem }> {
  try {
    const response = await api.post("/api/vendor-types", { typeName });
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create vendor type";
    toast.error(msg);
    return { success: false };
  }
}

export async function fetchCountries(): Promise<CountryItem[]> {
  try {
    const response = await api.get("/api/countries");
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch {
    toast.error("Failed to fetch countries.");
  }
  return [];
}

export async function fetchStates(countryId?: number): Promise<StateItem[]> {
  try {
    const response = await api.get("/api/states", { params: countryId ? { countryId } : {} });
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch {
    toast.error("Failed to fetch states.");
  }
  return [];
}

export async function fetchCities(stateId?: number): Promise<CityItem[]> {
  try {
    const response = await api.get("/api/cities", { params: stateId ? { stateId } : {} });
    if (response?.data?.success && Array.isArray(response?.data?.data)) {
      return response.data.data;
    }
    if (Array.isArray(response?.data)) return response.data;
  } catch {
    toast.error("Failed to fetch cities.");
  }
  return [];
}

export async function createAddress(payload: AddressItem): Promise<{ success: boolean; data?: AddressItem }> {
  try {
    const response = await api.post("/api/addresses", payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create address";
    toast.error(msg);
    return { success: false };
  }
}

export async function updateAddress(id: number | string, payload: Partial<AddressItem>): Promise<{ success: boolean; data?: AddressItem }> {
  try {
    const response = await api.put(`/api/addresses/${id}`, payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update address";
    toast.error(msg);
    return { success: false };
  }
}

export async function createVendorContact(payload: VendorContactItem): Promise<{ success: boolean; data?: VendorContactItem }> {
  try {
    const response = await api.post("/api/vendor-contacts", payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create vendor contact";
    toast.error(msg);
    return { success: false };
  }
}

export async function updateVendorContact(id: number | string, payload: Partial<VendorContactItem>): Promise<{ success: boolean; data?: VendorContactItem }> {
  try {
    const response = await api.put(`/api/vendor-contacts/${id}`, payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update vendor contact";
    toast.error(msg);
    return { success: false };
  }
}

export async function createVendorBankDetails(payload: VendorBankDetailsItem): Promise<{ success: boolean; data?: VendorBankDetailsItem }> {
  try {
    const response = await api.post("/api/vendor-bank-details", payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to create vendor bank details";
    toast.error(msg);
    return { success: false };
  }
}

export async function updateVendorBankDetails(id: number | string, payload: Partial<VendorBankDetailsItem>): Promise<{ success: boolean; data?: VendorBankDetailsItem }> {
  try {
    const response = await api.put(`/api/vendor-bank-details/${id}`, payload);
    return response?.data || { success: true };
  } catch (err: unknown) {
    const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
    const msg = axiosErr?.response?.data?.message || axiosErr?.message || "Failed to update vendor bank details";
    toast.error(msg);
    return { success: false };
  }
}
