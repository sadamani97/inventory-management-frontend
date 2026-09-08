import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchSalesOrdersList } from "@/lib/dashboardApi";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesOrdersList().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Sales Orders</h1>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>Customer sales orders from backend database.</p>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "6px 14px", borderRadius: "999px" }}>
            Total Orders: {orders.length}
          </div>
        </div>

        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "24px",
          border: "1px solid #eaecf0",
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
          overflowX: "auto"
        }}>
          {loading ? (
            <p style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>Loading sales orders from backend...</p>
          ) : orders.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>SO Number</th>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Customer / Ref</th>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Total Amount</th>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((so: any) => (
                  <tr key={so.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{so.soNumber || `SO-#${so.id}`}</td>
                    <td style={{ padding: "12px", color: "#475569" }}>{so.customerName || `Customer #${so.id}`}</td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#16a34a" }}>₹ {Number(so.totalAmount || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                        {so.status || "Completed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
              No sales orders recorded in database.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
