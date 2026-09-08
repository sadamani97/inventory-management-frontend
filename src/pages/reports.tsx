import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchReportKpis, fetchSalesAnalytics } from "@/lib/dashboardApi";

export default function ReportsPage() {
  const [kpi, setKpi] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchReportKpis(), fetchSalesAnalytics()]).then(([k, a]) => {
      setKpi(k);
      setAnalytics(a);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "10px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Reports</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Financial, inventory valuation, and sales analytics reports fetched from backend.</p>
        
        {loading ? (
          <p style={{ color: "#64748b", margin: "20px 0" }}>Loading backend analytics reports...</p>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", margin: "20px 0" }}>
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Inventory Value</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#2563eb" }}>₹ {Number(kpi?.inventoryValue || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Today's Revenue</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#16a34a" }}>₹ {Number(kpi?.todaysRevenue || 0).toLocaleString()}</div>
              </div>
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Today's Orders</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>{kpi?.todaysTotalOrders || 0}</div>
              </div>
              <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #eaecf0" }}>
                <div style={{ color: "#64748b", fontSize: "12px" }}>Total Sales</div>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a" }}>₹ {Number(analytics?.totalSales || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              padding: "24px",
              border: "1px solid #eaecf0",
              boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)"
            }}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Backend Sales Trend Summary</h2>
              {analytics?.chartData && analytics.chartData.length > 0 ? (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                      <th style={{ padding: "10px", color: "#2563eb", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "10px", color: "#2563eb", textAlign: "right" }}>Daily Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.chartData.map((cd: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "10px", fontWeight: 600 }}>{cd.date}</td>
                        <td style={{ padding: "10px", textAlign: "right", fontWeight: 700, color: "#16a34a" }}>₹ {cd.sales.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: "#64748b" }}>No sales transaction data recorded in database yet.</p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
