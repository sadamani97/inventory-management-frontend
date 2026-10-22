import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "@/styles/pages/alerts.module.css";
import { AlertItem, fetchAlertsList, formatRelativeTime } from "@/lib/dashboardApi";

export default function AlertDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const [alert, setAlert] = useState<AlertItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    fetchAlertsList()
      .then((items) => {
        if (!isMounted) return;
        const found = items.find((item) => String(item.id) === String(id));
        setAlert(found ?? null);
      })
      .catch(() => {
        if (isMounted) setAlert(null);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className={styles.detailsPageWrap}>
        <div className={styles.detailsCard}>
          <p className={styles.detailsLoading}>Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className={styles.detailsPageWrap}>
        <div className={styles.detailsCard}>
          <h1 className={styles.detailsTitle}>Alert not found</h1>
          <button type="button" className={styles.backButton} onClick={() => router.push("/alerts")}>
            Back to Alerts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.detailsPageWrap}>
      <div className={styles.detailsCard}>
        <div className={styles.detailsHeaderRow}>
          <div>
            <p className={styles.detailsLabel}>Alert Details</p>
            <h1 className={styles.detailsTitle}>{alert.alertType || "Alert"}</h1>
          </div>
          <button type="button" className={styles.backButton} onClick={() => router.push("/alerts")}>
            Back
          </button>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Type</span>
            <strong>{alert.alertType || "Alert"}</strong>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Severity</span>
            <span className={`${styles.severityBadge} ${styles[getSeverityClass(alert.severity)]}`}>
              {alert.severity || "Medium"}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Status</span>
            <span className={`${styles.statusBadge} ${styles[getStatusClass(alert.status || alert.alertType || "Active")]}`}>
              {alert.status || alert.alertType || "Active"}
            </span>
          </div>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Time</span>
            <strong>{formatRelativeTime(alert.createdAt)}</strong>
          </div>
          <div className={styles.detailItemWide}>
            <span className={styles.detailLabel}>Related Item</span>
            <strong>{alert.productName || alert.relatedItem || alert.productId || "N/A"}</strong>
          </div>
          <div className={styles.detailItemWide}>
            <span className={styles.detailLabel}>Description</span>
            <strong>{alert.message || alert.description || "No description available"}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

function getStatusClass(status?: string): string {
  const clean = (status || "").toLowerCase();
  if (clean.includes("out of stock") || clean.includes("low stock") || clean === "active") return "statusActive";
  if (clean.includes("in transit")) return "statusInTransit";
  if (clean.includes("pending")) return "statusPending";
  if (clean === "delivered" || clean.includes("completed")) return "statusDelivered";
  if (clean.includes("delayed")) return "statusDelayed";
  if (clean.includes("cancelled") || clean.includes("canceled")) return "statusCancelled";
  return "statusDefault";
}

function getSeverityClass(severity?: string): string {
  const clean = (severity || "").toLowerCase();
  if (clean === "critical") return "severityCritical";
  if (clean === "high") return "severityHigh";
  if (clean === "medium") return "severityMedium";
  if (clean === "low") return "severityLow";
  return "severityDefault";
}
