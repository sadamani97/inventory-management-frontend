import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchAlertsPaginated, fetchAlertSummary, AlertItem } from "@/lib/dashboardApi";
import Pagination from "@/components/ui/Pagination";
import styles from "@/styles/pages/alerts.module.css";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [totalAlertsCount, setTotalAlertsCount] = useState(0);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchAlertSummary()
      .then((sum) => setSummary(sum))
      .finally(() => setInitialLoading(false));
  }, []);

  const loadPaginatedAlerts = useCallback(() => {
    let isMounted = true;
    setTableLoading(true);

    fetchAlertsPaginated({
      page: currentPage,
      limit: pageSize,
    })
      .then((res) => {
        if (!isMounted) return;
        setAlerts(res.data || []);
        setTotalAlertsCount(res.totalItems || 0);
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err);
        if (isMounted) {
          setAlerts([]);
          setTotalAlertsCount(0);
        }
      })
      .finally(() => {
        if (isMounted) setTableLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, pageSize]);

  useEffect(() => {
    return loadPaginatedAlerts();
  }, [loadPaginatedAlerts]);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Alerts
              {tableLoading && <span className={styles.loadingSpinner} />}
            </h1>
            <p className={styles.subtitle}>
              System notifications, stock warnings, and critical purchase alerts from backend.
            </p>
          </div>
        </div>

        {initialLoading ? (
          <div className={styles.summaryGrid}>
            <div className={styles.skeletonSummaryCard} />
            <div className={styles.skeletonSummaryCard} />
            <div className={styles.skeletonSummaryCard} />
          </div>
        ) : summary ? (
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel}>Total Alerts</div>
              <div className={styles.summaryValue}>
                {String(summary.totalAlerts ?? totalAlertsCount)}
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel} style={{ color: "#d97706" }}>
                Low Stock Alerts
              </div>
              <div className={styles.summaryValue} style={{ color: "#d97706" }}>
                {String(summary.lowStockAlerts ?? 0)}
              </div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryLabel} style={{ color: "#dc2626" }}>
                Critical Out of Stock
              </div>
              <div className={styles.summaryValue} style={{ color: "#dc2626" }}>
                {String(summary.outOfStockAlerts ?? 0)}
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            Active System Alerts
            {tableLoading && <span className={styles.loadingSpinner} />}
          </h2>

          {tableLoading ? (
            <div className={styles.alertsList}>
              {Array.from({ length: pageSize > 6 ? 6 : pageSize }).map((_, idx) => (
                <div key={`alert-skel-${idx}`} className={styles.skeletonAlert}>
                  <div className={styles.skeletonBone} style={{ width: "20%" }} />
                  <div className={styles.skeletonBone} style={{ width: "75%" }} />
                </div>
              ))}
            </div>
          ) : alerts.length > 0 ? (
            <div className={styles.alertsList}>
              {alerts.map((a, idx) => {
                const isCritical =
                  a.alertType === "Out of Stock" ||
                  a.severity === "Critical" ||
                  a.severity === "High";
                const isWarning =
                  a.alertType === "Low Stock" || a.severity === "Medium";
                const alertClass = isCritical
                  ? styles.alertCritical
                  : isWarning
                  ? styles.alertWarning
                  : styles.alertInfo;

                return (
                  <div key={String(a.id || idx)} className={`${styles.alertItem} ${alertClass}`}>
                    <strong>{String(a.alertType || "Alert")}:</strong>{" "}
                    {String(
                      a.message ||
                        (a.productId ? `Product ID ${a.productId} alert.` : "System alert.")
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>No active alerts in backend database.</div>
          )}

          <div style={{ marginTop: "20px" }}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalAlertsCount}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
