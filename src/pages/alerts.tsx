import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AlertSummaryCard from "@/components/alerts/AlertSummaryCard";
import AlertsTable from "@/components/alerts/AlertsTable";
import { APP_IMAGES } from "@/constants/images";
import { fetchAlertsPaginated, fetchAlertSummary, fetchInvoicesPaginated, AlertItem, InvoiceItem } from "@/lib/dashboardApi";
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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totalAlertsCount, setTotalAlertsCount] = useState(0);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");

  useEffect(() => {
    fetchAlertSummary()
      .then((sum) => setSummary(sum))
      .finally(() => setInitialLoading(false));

    fetchInvoicesPaginated({ page: 1, limit: 5 })
      .then((res) => setInvoices(res.data || []))
      .catch((err) => {
        console.error("Failed to load invoice alerts:", err);
        setInvoices([]);
      });
  }, []);

  const loadPaginatedAlerts = useCallback(() => {
    setTableLoading(true);

    fetchAlertsPaginated({
      page: 1,
      limit: 1000,
      search: searchTerm || undefined,
      status: statusFilter || undefined,
      severity: severityFilter || undefined,
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
  }, [searchTerm, statusFilter, severityFilter]);

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
      icon: APP_IMAGES.ACTIVE_STOCK_LOGO.src,
      iconTone: "blue" as const,
      subtitle: "Today",
    },
    {
      title: "Critical Alerts",
      value: toNumericValue(summary?.criticalAlerts, toNumericValue(summary?.outOfStockAlerts, 0)),
      icon: APP_IMAGES.LOW_STOCK_LOGO.src,
      iconTone: "red" as const,
      subtitle: "Action needed",
    },
    {
      title: "Low Stock Alerts",
      value: toNumericValue(summary?.lowStockAlerts, 0),
      icon: APP_IMAGES.LOW_STOCK_LOGO.src,
      iconTone: "amber" as const,
      subtitle: "Below safety stock",
    },
    {
      title: "Pending Deliveries",
      value: toNumericValue(summary?.pendingDeliveries, toNumericValue(summary?.pendingAlerts, 0)),
      icon: APP_IMAGES.DASHBOARD_LOGO.src,
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

  const invoiceRows = todayAlerts.filter(
    (item) =>
      item.alertType?.toLowerCase().includes("invoice") ||
      item.alertType?.toLowerCase().includes("payment") ||
      item.alertType?.toLowerCase().includes("delivery") ||
      item.alertType?.toLowerCase().includes("purchase order") ||
      item.message?.toLowerCase().includes("invoice") ||
      item.message?.toLowerCase().includes("purchase order")
  );

  const compactRows = criticalRows.length > 0 ? criticalRows : alerts.slice(0, 5);
  const invoiceList = invoiceRows.length > 0 ? invoiceRows : invoices.slice(0, 5);
  const displayAlerts = alerts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
          <div className={styles.compactTablePanel}>
            <div className={styles.compactTableHeader}>Critical Alert</div>
            <table className={styles.compactTable}>
              <thead>
                <tr>
                  <th>Alerts</th>
                  <th>RefID</th>
                  <th>Description</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {compactRows.length > 0 ? (
                  compactRows.slice(0, 5).map((item, idx) => (
                    <tr key={`${item.id ?? idx}-critical`}>
                      <td>{item.alertType || "Alert"}</td>
                      <td>{item.referenceId ?? item.productId ?? item.refId ?? item.id ?? "-"}</td>
                      <td>{item.message || item.description || item.productName || "System notification"}</td>
                      <td>{formatTimeLabel(item.createdAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyStateRow}>No data for today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.compactTablePanel}>
            <div className={styles.compactTableHeader}>Invoice Alert</div>
            <table className={styles.compactTable}>
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoiceList.length > 0 ? (
                  invoiceList.slice(0, 5).map((item, idx) => {
                    const record = item as unknown as Record<string, unknown>;
                    const invoiceId = record.invoiceNumber ?? record.invoiceId ?? item.id ?? "INV-000";
                    const vendorName =
                      record.vendorName ??
                      ((record.vendor as Record<string, unknown> | undefined)?.vendorName) ??
                      ((record.vendor as Record<string, unknown> | undefined)?.companyName) ??
                      record.customerName ??
                      "Vendor";
                    const amount = Number(record.totalAmount ?? record.amount ?? 0);

                    return (
                      <tr key={`${item.id ?? idx}-invoice`}>
                        <td>{String(invoiceId)}</td>
                        <td>{String(vendorName)}</td>
                        <td>₹{Number.isFinite(amount) ? amount.toLocaleString("en-IN") : "0"}</td>
                        <td>
                          <span className={styles.miniStatus}>{item.status || "Pending"}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.emptyStateRow}>No invoice alerts for today</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AlertsTable
          data={displayAlerts}
          loading={tableLoading}
          totalItems={totalAlertsCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onSearchChange={(value) => {
            setSearchTerm(value);
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
