import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import StatCards from "@/components/dashboard/StatCards";
import RevenueTrendChart from "@/components/dashboard/RevenueTrendChart";
import TopSellingChart from "@/components/dashboard/TopSellingChart";
import RecentActivitiesTable from "@/components/dashboard/RecentActivitiesTable";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import CreatePOModal from "@/components/dashboard/CreatePOModal";
import styles from "@/styles/pages/dashboard.module.css";
import { FiPlus } from "react-icons/fi";

export default function DashboardPage() {
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.headerRight}>
          <CustomDatePicker value={selectedDate} onChange={setSelectedDate} />
          <button className={styles.createPoBtn} onClick={() => setIsPOModalOpen(true)}>
            <FiPlus /> Create Purchase Order
          </button>
        </div>
      </div>

      <StatCards />

      <div className={styles.chartsGrid}>
        <RevenueTrendChart />
        <TopSellingChart />
      </div>

      <RecentActivitiesTable selectedDate={selectedDate} />

      <CreatePOModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        onSuccess={() => {
          // Optional: trigger refresh for dashboard data
        }}
      />
    </DashboardLayout>
  );
}
