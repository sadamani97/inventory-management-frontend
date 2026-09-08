import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./DashboardLayout.module.css";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className={styles.layoutWrapper}>
      <Sidebar />
      <div className={styles.mainContent}>
        <Header />
        <main className={styles.pageBody}>{children}</main>
      </div>
    </div>
  );
}
