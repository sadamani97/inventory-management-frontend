import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCards from "@/components/dashboard/StatCards";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import TopSellingChart from "@/components/dashboard/TopSellingChart";
import RecentActivitiesTable from "@/components/dashboard/RecentActivitiesTable";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import styles from "@/styles/pages/dashboard.module.css";
import { FiPlus } from "react-icons/fi";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.headerRight}>
          <CustomDatePicker />
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
