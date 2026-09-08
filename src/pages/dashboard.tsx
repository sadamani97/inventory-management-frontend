import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCards from "@/components/dashboard/StatCards";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import TopSellingChart from "@/components/dashboard/TopSellingChart";
import RecentActivitiesTable from "@/components/dashboard/RecentActivitiesTable";
import styles from "@/styles/pages/dashboard.module.css";
import { FiCalendar, FiPlus } from "react-icons/fi";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.headerRight}>
          <div className={styles.datePill}>
            <span>June 11, 2026</span>
            <FiCalendar style={{ color: "#64748b" }} />
          </div>
          <button className={styles.createPoBtn}>
            <FiPlus /> Create Purchase Order
          </button>
        </div>
      </div>

      <StatCards />

      <div className={styles.chartsGrid}>
        <RevenueTrendChart />
        <TopSellingChart />
      </div>

      <RecentActivitiesTable />
    </DashboardLayout>
  );
}
