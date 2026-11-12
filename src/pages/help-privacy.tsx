import DashboardLayout from "@/components/layout/DashboardLayout";
import styles from "@/styles/pages/settings.module.css";

export default function HelpPrivacyPage() {
  return (
    <DashboardLayout>
      <div className={styles.pageContainer}>
        <h1 className={styles.pageTitle}>Help &amp; Privacy</h1>
        <p className={styles.pageSubtitle}>
          Access support documentation, privacy terms, and contact support.
        </p>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Stockflow Support</h2>
          <p className={styles.cardBody}>
            For documentation, API guides, or security policy, visit the help center.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
