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
  productId?: number;
  productName?: string;
  createdAt?: string;
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
    const [products, pos, sos] = await Promise.all([
      fetchProductsList().catch(() => []),
      fetchPurchaseOrdersList().catch(() => []),
      fetchSalesOrdersList().catch(() => []),
    ]);

    const items: (ActivityItem & { timestamp: number })[] = [];

    if (pos && pos.length > 0) {
      pos.forEach((po: PurchaseOrderItem, idx: number) => {
        const isDelivered = po.status?.toLowerCase() === "completed" || po.status?.toLowerCase() === "delivered";
        const poDate = new Date(po.createdAt || po.orderDate || new Date());
        
        let totalQty = 0;
        if (po.items && Array.isArray(po.items)) {
          totalQty = po.items.reduce((acc: number, it: { quantity?: number }) => acc + (Number(it.quantity) || 0), 0);
        }
        
        items.push({
          id: `po-${po.id || idx}`,
          activity: "Vendor Delivery",
          product: po.vendorName || "Vendor Order",
          sku: po.poNumber || `PO-${idx}`,
          qty: `+${totalQty || 200}`,
          status: isDelivered ? "Delivered" : "Added",
          time: formatRelativeTime(poDate),
          timestamp: poDate.getTime()
        });
      });
    }

    if (sos && sos.length > 0) {
      sos.forEach((so: SalesOrderItem, idx: number) => {
        const isDraft = so.status?.toLowerCase() === "draft";
        if (!isDraft) {
          const soDate = new Date(so.createdAt || so.orderDate || new Date());
          
          let totalQty = 0;
          if (so.items && Array.isArray(so.items)) {
            totalQty = so.items.reduce((acc: number, it: { quantity?: number }) => acc + (Number(it.quantity) || 0), 0);
          }

          items.push({
            id: `so-${so.id || idx}`,
            activity: "Stock Out",
            product: so.customerName || so.customerType || "Customer Order",
            sku: so.soNumber || so.orderNumber || `SO-${idx}`,
            qty: `-${totalQty || 32}`,
            status: "Completed",
            time: formatRelativeTime(soDate),
            timestamp: soDate.getTime()
          });
        }
      });
    }

    if (products && products.length > 0) {
      products.forEach((prod: ProductItem, idx: number) => {
        const qty = Number(prod.quantity || 0);
        const limit = Number(prod.lowStockLimit || 10);
        
        const prodDate = new Date(prod.updatedAt || prod.createdAt || new Date());
        
        if (qty <= 0) {
          items.push({
            id: `prod-out-${prod.id || idx}`,
            activity: "Low Stock Alert",
            product: prod.productName || "Product",
            sku: prod.sku || `SKU-${idx}`,
            qty: `0 Left`,
            status: "Warning",
            time: formatRelativeTime(prodDate),
            timestamp: prodDate.getTime()
          });
        } else if (qty <= limit) {
          items.push({
            id: `prod-warn-${prod.id || idx}`,
            activity: "Low Stock Alert",
            product: prod.productName || "Product",
            sku: prod.sku || `SKU-${idx}`,
            qty: `${qty} Left`,
            status: "Warning",
            time: formatRelativeTime(prodDate),
            timestamp: prodDate.getTime()
          });
        }
        
        const prodAddDate = new Date(prod.createdAt || new Date());
        items.push({
          id: `prod-add-${prod.id || idx}`,
          activity: "New Product Added",
          product: prod.productName || "Product",
          sku: prod.sku || `SKU-${idx}`,
          qty: `+${qty}`,
          status: "Added",
          time: formatRelativeTime(prodAddDate),
          timestamp: prodAddDate.getTime()
        });
      });
    }

    items.sort((a, b) => b.timestamp - a.timestamp);
    
    return items.map(it => ({
      id: it.id,
      activity: it.activity,
      product: it.product,
      sku: it.sku,
      qty: it.qty,
      status: it.status,
      time: it.time
    })).slice(0, 50);
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
