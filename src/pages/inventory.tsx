import DashboardLayout from "@/components/layout/DashboardLayout";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "10px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Inventory</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Track warehouse stock levels, adjustments, and reorder triggers.</p>
        
        <div style={{
          marginTop: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "32px",
          border: "1px solid #eaecf0",
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Stock Movements</h2>
          <p style={{ color: "#475569", fontSize: "14px" }}>Active stock items: 811 units restocked recently.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
