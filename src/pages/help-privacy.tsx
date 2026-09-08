import DashboardLayout from "@/components/layout/DashboardLayout";

export default function HelpPrivacyPage() {
  return (
    <DashboardLayout>
      <div style={{ padding: "10px 0" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", marginBottom: "8px" }}>Help & Privacy</h1>
        <p style={{ color: "#64748b", fontSize: "14px" }}>Access support documentation, privacy terms, and contact support.</p>
        
        <div style={{
          marginTop: "24px",
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          padding: "32px",
          border: "1px solid #eaecf0",
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginBottom: "16px" }}>Stockflow Support</h2>
          <p style={{ color: "#475569", fontSize: "14px" }}>For documentation, API guides, or security policy, visit the help center.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
