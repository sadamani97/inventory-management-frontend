import { useEffect, useState, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AlertSummaryCard from "@/components/alerts/AlertSummaryCard";
import AlertsTable from "@/components/alerts/AlertsTable";
import CompactAlertTable from "@/components/alerts/CompactAlertTable";
import StatusBadge from "@/components/alerts/StatusBadge";
import { ASSETS } from "@/constants/assets";
import {
  fetchAlertsPaginated,
  fetchAlertSummary,
  fetchInvoicesPaginated,
  fetchPurchaseOrdersList,
  fetchSalesOrdersList,
  normalizeInvoiceItem,
  AlertItem,
  InvoiceItem,
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/alerts.module.css";

const formatTimeLabel = (value?: string): string => {
  if (!value) return "Today";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const diffMinutes = Math.max(0, Math.round((Date.now() - parsed.getTime()) / 60000));
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  if (diffMinutes < 1440) return `${Math.round(diffMinutes / 60)} hours ago`;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isSameDay = (value?: string, targetDate: Date = new Date()): boolean => {
  if (!value) return true;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return true;

  return (
    parsed.getFullYear() === targetDate.getFullYear() &&
    parsed.getMonth() === targetDate.getMonth() &&
    parsed.getDate() === targetDate.getDate()
  );
};

const formatInvoiceId = (item: InvoiceItem): string => {
  const raw = String(item.invoiceNumber || item.id || "").trim();
  if (!raw) return "—";
  if (/^inv/i.test(raw) || /^so/i.test(raw) || /^po/i.test(raw)) return raw;
  if (/^\d+$/.test(raw)) return `INV-${raw.padStart(4, "0")}`;
  return raw;
};

const formatInvoiceAmount = (value?: number): string => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN")}`;
};

const getInvoiceVendor = (item: InvoiceItem): string =>
  item.vendorName || item.vendor?.vendorName || item.vendor?.companyName || item.customerName || "—";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [invoiceLoading, setInvoiceLoading] = useState(true);
  const [criticalFilter, setCriticalFilter] = useState("All");
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState("All");
  const [totalAlertsCount, setTotalAlertsCount] = useState(0);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  const normalizeSearchValue = (value: string) => value.trim().replace(/\s+/g, " ");

  useEffect(() => {
    fetchAlertSummary()
      .then((sum) => setSummary(sum))
      .finally(() => setInitialLoading(false));

    const loadInvoiceAlerts = async () => {
      setInvoiceLoading(true);
      try {
        const invoiceResult = await fetchInvoicesPaginated({ page: 1, limit: 50 });
        let rows = invoiceResult.data || [];

        if (!rows.length) {
          const [salesOrders, purchaseOrders] = await Promise.all([
            fetchSalesOrdersList(),
            fetchPurchaseOrdersList(),
          ]);

          rows = [
            ...salesOrders.map((order) =>
              normalizeInvoiceItem({
                id: order.id,
                invoiceNumber: order.orderNumber || order.soNumber,
                customerName: order.customerName || order.customerType,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt || order.orderDate,
              })
            ),
            ...purchaseOrders.map((order) =>
              normalizeInvoiceItem({
                id: order.id,
                invoiceNumber: order.poNumber,
                vendorName: order.vendorName || order.vendor?.vendorName || order.vendor?.companyName,
                vendor: order.vendor,
                totalAmount: order.totalAmount,
                status: order.status,
                createdAt: order.createdAt || order.orderDate,
              })
            ),
          ];
        }

        setInvoices(rows);
      } catch (err) {
        console.error("Failed to load invoice alerts:", err);
        setInvoices([]);
      } finally {
        setInvoiceLoading(false);
      }
    };

    loadInvoiceAlerts();
  }, []);

  const loadPaginatedAlerts = useCallback(() => {
    setTableLoading(true);

    const safeSearch = normalizeSearchValue(searchTerm);
    const safeStatus = statusFilter && statusFilter !== "All" ? statusFilter.trim() : undefined;
    const safeSeverity = severityFilter && severityFilter !== "All" ? severityFilter.trim() : undefined;

    fetchAlertsPaginated({
      page: currentPage,
      limit: pageSize,
      search: safeSearch || undefined,
      status: safeStatus,
      severity: safeSeverity,
    })
      .then((res) => {
        setAlerts(res.data || []);
        setTotalAlertsCount(res.totalItems || res.data?.length || 0);
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err);
        setAlerts([]);
        setTotalAlertsCount(0);
      })
      .finally(() => {
        setTableLoading(false);
      });
  }, [currentPage, pageSize, searchTerm, statusFilter, severityFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPaginatedAlerts();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadPaginatedAlerts]);

  const toNumericValue = (value: unknown, fallback = 0): number => {
    if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  const summaryCards = [
    {
      title: "Active Alerts",
      value: toNumericValue(summary?.totalAlerts, totalAlertsCount),
      icon: ASSETS.IMAGES.ALERT_ACTIVE.src,
      iconTone: "blue" as const,
      subtitle: "Today",
    },
    {
      title: "Critical Alerts",
      value: toNumericValue(summary?.criticalAlerts, toNumericValue(summary?.outOfStockAlerts, 0)),
      icon: ASSETS.IMAGES.ALERT_CRITICAL.src,
      iconTone: "red" as const,
      subtitle: "Action needed",
    },
    {
      title: "Low Stock Alerts",
      value: toNumericValue(summary?.lowStockAlerts, 0),
      icon: ASSETS.IMAGES.ALERT_LOW_STOCK.src,
      iconTone: "amber" as const,
      subtitle: "Below safety stock",
    },
    {
      title: "Pending Deliveries",
      value: toNumericValue(summary?.pendingDeliveries, toNumericValue(summary?.pendingAlerts, 0)),
      icon: ASSETS.IMAGES.ALERT_PENDING_DELIVERY.src,
      iconTone: "indigo" as const,
      subtitle: "Open",
    },
  ];

  const todayAlerts = alerts.filter((item) => isSameDay(item.createdAt));

  const criticalRows = todayAlerts.filter(
    (item) =>
      item.severity === "Critical" ||
      item.alertType?.toLowerCase().includes("out of stock") ||
      item.alertType?.toLowerCase().includes("low stock") ||
      item.message?.toLowerCase().includes("critical")
  );

  const compactRows = criticalRows.length > 0 ? criticalRows : alerts.slice(0, 5);
  const visibleCriticalRows = useMemo(() => {
    if (criticalFilter === "All") return compactRows;
    return compactRows.filter((item) => (item.alertType || "Alert") === criticalFilter);
  }, [compactRows, criticalFilter]);

  const criticalFilterOptions = useMemo(() => {
    const types = Array.from(new Set(compactRows.map((item) => item.alertType || "Alert")));
    return [
      { label: "All Alerts", value: "All" },
      ...types.map((type) => ({ label: type, value: type })),
    ];
  }, [compactRows]);

  const invoiceStatusOptions = useMemo(() => {
    const statuses = Array.from(
      new Set(invoices.map((item) => item.status).filter((status): status is string => Boolean(status)))
    );
    return [
      { label: "All Status", value: "All" },
      ...statuses.map((status) => ({ label: status, value: status })),
    ];
  }, [invoices]);

  const visibleInvoices = useMemo(() => {
    if (invoiceStatusFilter === "All") return invoices;
    return invoices.filter(
      (item) => (item.status || "").toLowerCase() === invoiceStatusFilter.toLowerCase()
    );
  }, [invoices, invoiceStatusFilter]);

  const normalizedSearch = normalizeSearchValue(searchTerm).toLowerCase();
  const filteredAlerts = alerts.filter((item) => {
    if (!normalizedSearch) return true;

    const haystack = [
      item.alertType,
      item.message,
      item.description,
      item.productName,
      item.relatedItem,
      item.referenceId,
      item.status,
      item.vendorName,
      item.severity,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  const totalVisibleAlerts = filteredAlerts.length;
  const displayAlerts = filteredAlerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Alerts</h1>
          </div>
        </div>

        {initialLoading ? (
          <div className={styles.summaryGrid}>
            {[...Array(4)].map((_, index) => (
              <div key={index} className={styles.skeletonSummaryCard} />
            ))}
          </div>
        ) : (
          <div className={styles.summaryGrid}>
            {summaryCards.map((card) => (
              <AlertSummaryCard
                key={card.title}
                title={card.title}
                value={card.value}
                icon={card.icon}
                iconTone={card.iconTone}
                subtitle={card.subtitle}
              />
            ))}
          </div>
        )}

        <div className={styles.compactRow}>
          <CompactAlertTable
            title="Critical Alert"
            loading={tableLoading && compactRows.length === 0}
            emptyMessage="No data for today"
            filter={{
              value: criticalFilter,
              options: criticalFilterOptions,
              onChange: setCriticalFilter,
            }}
            columns={[
              { key: "alerts", header: "Alerts", render: (item) => item.alertType || "Alert" },
              {
                key: "refId",
                header: "Ref ID",
                render: (item) => item.referenceId ?? item.productId ?? item.refId ?? item.id ?? "—",
              },
              {
                key: "description",
                header: "Description",
                render: (item) => item.message || item.description || item.productName || "—",
              },
              {
                key: "time",
                header: "Time",
                render: (item) => <span className={styles.compactTime}>{formatTimeLabel(item.createdAt)}</span>,
              },
            ]}
            rows={visibleCriticalRows}
            getRowKey={(item, index) => `${item.id ?? index}-critical`}
          />

          <CompactAlertTable
            title="Invoice Alert"
            loading={invoiceLoading}
            emptyMessage="No invoice records found"
            filter={{
              value: invoiceStatusFilter,
              options: invoiceStatusOptions,
              onChange: setInvoiceStatusFilter,
            }}
            columns={[
              { key: "invoiceId", header: "Invoice ID", render: (item) => formatInvoiceId(item) },
              { key: "vendor", header: "Vendor", render: (item) => getInvoiceVendor(item) },
              { key: "amount", header: "Amount", render: (item) => formatInvoiceAmount(item.totalAmount) },
              {
                key: "status",
                header: "Status",
                render: (item) => <StatusBadge label={item.status || "Pending"} variant="outline" />,
              },
            ]}
            rows={visibleInvoices}
            getRowKey={(item, index) => `${item.id ?? index}-invoice`}
          />
        </div>

        <AlertsTable
          data={displayAlerts}
          loading={tableLoading}
          totalItems={Math.max(totalVisibleAlerts, 0)}
          currentPage={currentPage}
          pageSize={pageSize}
          onSearchChange={(value) => {
            setSearchTerm(normalizeSearchValue(value));
            setCurrentPage(1);
          }}
          onStatusChange={(value) => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          onSeverityChange={(value) => {
            setSeverityFilter(value);
            setCurrentPage(1);
          }}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
