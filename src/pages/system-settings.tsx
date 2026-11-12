import DashboardLayout from "@/components/layout/DashboardLayout";
import styles from "@/styles/pages/settings.module.css";

export default function SystemSettingsPage() {
  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>System Settings</h1>
        <p className={styles.pageSubtitle}>
          Configure store parameters, team roles, and system preferences.
        </p>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>General Preferences</h2>
          <p className={styles.cardBody}>Stockflow v1.0.0 Configuration Panel.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
