import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchAlertsList, fetchAlertSummary } from "@/lib/dashboardApi";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchAlertsList(), fetchAlertSummary()]).then(([list, sum]) => {
      setAlerts(list);
      setSummary(sum);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "10px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Alerts</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>System notifications, stock warnings, and critical purchase alerts from backend.</p>
        
        {summary && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", margin: "20px 0" }}>
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
              <div style={{ color: "#64748b", fontSize: "12px" }}>Total Alerts</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{summary.totalAlerts ?? alerts.length}</div>
            </div>
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
              <div style={{ color: "#d97706", fontSize: "12px" }}>Low Stock Alerts</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#d97706" }}>{summary.lowStockAlerts ?? 0}</div>
            </div>
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
              <div style={{ color: "#dc2626", fontSize: "12px" }}>Critical Out of Stock</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#dc2626" }}>{summary.outOfStockAlerts ?? 0}</div>
            </div>
          </div>
        )}

        <div style={{
          marginTop: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "24px",
          border: "1px solid #eaecf0",
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Active System Alerts</h2>
          {loading ? (
            <p style={{ color: "#64748b" }}>Loading alerts from backend...</p>
          ) : alerts.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {alerts.map((a: any, idx: number) => (
                <div key={a.id || idx} style={{
                  padding: "16px",
                  borderRadius: "10px",
                  backgroundColor: a.alertType === "Out of Stock" || a.type === "Critical" ? "#fef2f2" : "#fffbeb",
                  border: `1px solid ${a.alertType === "Out of Stock" || a.type === "Critical" ? "#fee2e2" : "#fef3c7"}`,
                  color: a.alertType === "Out of Stock" || a.type === "Critical" ? "#b91c1c" : "#b45309"
                }}>
                  <strong>{a.alertType || a.title || "Alert"}:</strong> {a.message || a.description || `Product ID ${a.productId} alert.`}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
              No active alerts in backend database.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
