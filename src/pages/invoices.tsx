import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchInvoicesList } from "@/lib/dashboardApi";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoicesList().then((data) => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout>
      <div style={{ padding: "10px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: 0 }}>Invoices</h1>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>Billing invoices from backend database.</p>
          </div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "6px 14px", borderRadius: "999px" }}>
            Total Invoices: {invoices.length}
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
            <p style={{ color: "#64748b", textAlign: "center", padding: "20px" }}>Loading invoices from backend...</p>
          ) : invoices.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #f1f5f9", background: "#fafafa" }}>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Invoice #</th>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Amount</th>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Due Date</th>
                  <th style={{ padding: "12px", color: "#2563eb", fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#0f172a" }}>{inv.invoiceNumber || `INV-#${inv.id}`}</td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#16a34a" }}>₹ {Number(inv.totalAmount || inv.amount || 0).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: "#475569" }}>{inv.dueDate || "N/A"}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 }}>
                        {inv.status || "Paid"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "32px", color: "#94a3b8" }}>
              No invoice records stored in database.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
