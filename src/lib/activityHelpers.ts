export interface ActivityItem {
  id: string;
  activity: InventoryActivityType;
  product: string;
  sku: string;
  qty: string;
  quantityValue?: number;
  productId?: string | number;
  status: InventoryActivityStatus;
  time: string;
  createdAt?: string;
}

export type InventoryActivityType =
  | "Stock In"
  | "Stock Out"
  | "New Product Added"
  | "Ordered Products"
  | "Low Stock"
  | "Out of Stock";

export type InventoryActivityStatus = "Completed" | "Added" | "Warning";

export const EMPTY_CELL = "—";

/**
 * Returns strictly clean product name retrieved from database or empty fallback.
 */
export function cleanProductName(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_CELL;
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const name = rec?.productName ?? rec?.name ?? rec?.title;
    if (typeof name === "string" && name.trim()) return name.trim();
    return EMPTY_CELL;
  }
  const text = String(value).trim();
  if (!text || text === "[object Object]" || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return EMPTY_CELL;
  }
  return text;
}

/**
 * Returns strictly clean SKU matching the inventory item or empty fallback.
 */
export function cleanProductSku(value: unknown): string {
  if (value === null || value === undefined) return EMPTY_CELL;
  if (typeof value === "object") {
    const rec = value as Record<string, unknown>;
    const sku = rec?.sku ?? rec?.productSku ?? rec?.itemSku;
    if (typeof sku === "string" && sku.trim()) return sku.trim();
    return EMPTY_CELL;
  }
  const text = String(value).trim();
  if (!text || text === "[object Object]" || text.toLowerCase() === "undefined" || text.toLowerCase() === "null") {
    return EMPTY_CELL;
  }
  return text;
}

/**
 * Normalizes any incoming event string into one of the 6 canonical badges:
 * Stock In, Stock Out, New Product Added, Ordered Products, Low Stock, Out of Stock
 */
export function normalizeInventoryActivityType(value: unknown): InventoryActivityType {
  const raw = String(value ?? "").trim();
  if (!raw) return "Stock In";

  const lower = raw.toLowerCase();
  if (lower.includes("stock in") || lower.includes("vendor delivery") || lower.includes("delivery received")) {
    return "Stock In";
  }
  if (lower.includes("stock out") || lower.includes("sales") || lower.includes("sold")) {
    return "Stock Out";
  }
  if (lower.includes("new product") || lower.includes("product added") || lower.includes("product in stock")) {
    return "New Product Added";
  }
  if (lower.includes("ordered") || lower.includes("purchase order")) {
    return "Ordered Products";
  }
  if (lower.includes("out of stock") || lower.includes("outofstock")) {
    return "Out of Stock";
  }
  if (lower.includes("low stock") || lower.includes("low-stock")) {
    return "Low Stock";
  }
  return "Stock In";
}

/**
 * Parses numeric quantity value from string or number.
 */
export function parseQuantityValue(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const numeric = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : undefined;
}

/**
 * Formats quantity movement delta per product specifications:
 * - Stock In / Vendor Delivery: +200
 * - Stock Out / Sales: -5
 * - Low Stock / Remaining: 8 left
 * - Out of Stock: 0
 */
export function formatActivityQuantity(activityType: string, rawValue: unknown): string {
  const normType = normalizeInventoryActivityType(activityType);
  const amount = parseQuantityValue(rawValue);

  if (normType === "Out of Stock") {
    return "0";
  }

  if (normType === "Low Stock") {
    if (amount === undefined) return EMPTY_CELL;
    return `${Math.max(0, Math.round(amount))} left`;
  }

  if (amount === undefined) return EMPTY_CELL;

  if (normType === "Stock In" || normType === "Ordered Products" || normType === "New Product Added") {
    return `+${Math.round(Math.abs(amount))}`;
  }

  if (normType === "Stock Out") {
    return `-${Math.round(Math.abs(amount))}`;
  }

  return `${amount}`;
}

/**
 * Maps activity type to UI badge state:
 * - Completed: Stock In, Stock Out, Vendor Delivery, Ordered Products
 * - Added: New Product Added
 * - Warning: Low Stock, Out of Stock
 */
export function selectActivityStatus(activityType: string, backendStatus?: string): InventoryActivityStatus {
  const normType = normalizeInventoryActivityType(activityType);
  if (normType === "Low Stock" || normType === "Out of Stock") {
    return "Warning";
  }
  if (normType === "New Product Added") {
    return "Added";
  }
  if (normType === "Stock In" || normType === "Stock Out" || normType === "Ordered Products") {
    return "Completed";
  }

  const normalized = String(backendStatus ?? "").trim().toLowerCase();
  if (normalized === "warning" || normalized === "alert") return "Warning";
  if (normalized === "added") return "Added";
  return "Completed";
}

/**
 * Date comparison helper to check whether a timestamp occurred on the current calendar date (today).
 */
export function isToday(dateValue?: string | Date, now: Date = new Date()): boolean {
  if (!dateValue) return false;
  const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/**
 * Date comparison helper for two calendar dates.
 */
export function isSameCalendarDate(value?: string | Date, compareTo: Date = new Date()): boolean {
  if (!value) return false;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === compareTo.getFullYear() &&
    d.getMonth() === compareTo.getMonth() &&
    d.getDate() === compareTo.getDate()
  );
}

/**
 * Formats a Date object to YYYY-MM-DD query parameter.
 */
export function toDateQueryParam(date: Date): string {
  const year = date?.getFullYear?.();
  const month = String((date?.getMonth?.() ?? 0) + 1).padStart(2, "0");
  const day = String(date?.getDate?.() ?? 1).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Conditional Relative vs. Absolute Timestamp:
 * - If activity occurred TODAY: relative time (e.g., just now, 5 minutes ago, 2 hours ago).
 * - If activity occurred on a PREVIOUS date: exact absolute time/timestamp (e.g., 04:30 PM).
 */
export function formatActivityTimestamp(dateStr?: string | Date, now: Date = new Date()): string {
  if (!dateStr) return EMPTY_CELL;
  const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
  if (Number.isNaN(date.getTime())) return EMPTY_CELL;

  if (isToday(date, now)) {
    const diffMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.max(0, Math.floor(diffMs / 60000));
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
  }

  // Previous date: format as absolute 12-hour timestamp (e.g. 04:30 PM)
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function resolveDisplayText(value: unknown): string {
  return cleanProductName(value);
}

/**
 * CSS Class selectors for badges
 */
export function getActivityTypeClassName(activity: string, styles: Record<string, string>): string {
  const normType = normalizeInventoryActivityType(activity);
  switch (normType) {
    case "Stock In":
      return styles.typeStockIn ?? "";
    case "Stock Out":
      return styles.typeStockOut ?? "";
    case "New Product Added":
      return styles.typeAdded ?? "";
    case "Ordered Products":
      return styles.typeOrdered ?? "";
    case "Low Stock":
      return styles.typeLowStock ?? styles.typeWarning ?? "";
    case "Out of Stock":
      return styles.typeOutOfStock ?? styles.typeWarning ?? "";
    default:
      return styles.typeDefault ?? "";
  }
}

export function getActivityStatusClassName(
  status: ActivityItem["status"] | InventoryActivityStatus | string,
  styles: Record<string, string>
): string {
  const normalized = String(status ?? "").trim().toLowerCase();
  if (normalized === "warning" || normalized === "alert") return styles.statusWarning ?? "";
  if (normalized === "added") return styles.statusAdded ?? "";
  if (normalized === "completed" || normalized === "complete" || normalized === "delivered") {
    return styles.statusCompleted ?? "";
  }
  return "";
}

export function getQuantityClassName(
  activityType: string,
  qty: string,
  styles: Record<string, string>
): string {
  const normType = normalizeInventoryActivityType(activityType);
  if (normType === "Stock In" || normType === "Ordered Products" || normType === "New Product Added") {
    return styles.qtyPositive ?? "";
  }
  if (normType === "Stock Out") {
    return styles.qtyNegative ?? "";
  }
  if (normType === "Low Stock" || normType === "Out of Stock") {
    return styles.qtyWarning ?? "";
  }
  const value = String(qty ?? "").trim();
  if (value.startsWith("+")) return styles.qtyPositive ?? "";
  if (value.startsWith("-")) return styles.qtyNegative ?? "";
  if (value.endsWith("left") || value === "0") return styles.qtyWarning ?? "";
  return styles.qtyNeutral ?? "";
}

/**
 * Cumulative daily sales delta aggregation:
 * Aggregates all Stock Out events for the same product on each calendar day into a single negative delta.
 * (e.g., 5 sold + 7 sold = -12).
 */
export function aggregateDailyStockOut(items: ActivityItem[], selectedDate?: Date): ActivityItem[] {
  if (!Array.isArray(items) || items.length === 0) return [];

  const targetDate = selectedDate ?? new Date();

  // Filter items matching the selectedDate if provided
  const dateFiltered = selectedDate
    ? items.filter((item) => {
        const timestamp = item?.createdAt ?? item?.time;
        if (!timestamp) return true;
        return isSameCalendarDate(timestamp, selectedDate);
      })
    : items;

  const stockOutGroups = new Map<string, ActivityItem[]>();
  const otherItems: ActivityItem[] = [];

  dateFiltered.forEach((item) => {
    const isStockOut = normalizeInventoryActivityType(item?.activity) === "Stock Out";
    const timestamp = item?.createdAt ?? item?.time;
    const itemDate = timestamp ? new Date(timestamp) : targetDate;
    const validDate = !Number.isNaN(itemDate.getTime()) ? itemDate : targetDate;

    if (isStockOut) {
      const dateKey = toDateQueryParam(validDate);
      const productKey = (item?.productId || item?.sku || item?.product || "item").toString().toLowerCase().trim();
      const groupKey = `${dateKey}::${productKey}`;

      const list = stockOutGroups.get(groupKey) ?? [];
      list.push(item);
      stockOutGroups.set(groupKey, list);
    } else {
      otherItems.push(item);
    }
  });

  const aggregatedSales: ActivityItem[] = [];

  stockOutGroups.forEach((group) => {
    // Latest event in group provides latest timestamp
    const latest = group.reduce((curr, next) => {
      const tCurr = new Date(curr?.createdAt ?? curr?.time ?? 0).getTime();
      const tNext = new Date(next?.createdAt ?? next?.time ?? 0).getTime();
      return tNext >= tCurr ? next : curr;
    });

    const totalSold = group.reduce((sum, row) => {
      const parsed = row?.quantityValue ?? parseQuantityValue(row?.qty);
      if (parsed === undefined) return sum;
      return sum + Math.abs(parsed);
    }, 0);

    aggregatedSales.push({
      ...latest,
      activity: "Stock Out",
      qty: formatActivityQuantity("Stock Out", totalSold),
      quantityValue: totalSold,
      status: "Completed",
    });
  });

  return [...otherItems, ...aggregatedSales].sort((a, b) => {
    const ta = new Date(a?.createdAt ?? a?.time ?? 0).getTime();
    const tb = new Date(b?.createdAt ?? b?.time ?? 0).getTime();
    return tb - ta;
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number): T[] {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, pageSize);
  const start = (safePage - 1) * safeSize;
  return items.slice(start, start + safeSize);
}
