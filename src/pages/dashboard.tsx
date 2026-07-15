import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/authSlice";
import Button from "@/components/ui/Button";
import styles from "@/styles/pages/dashboard.module.css";

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const handleLogout = () => {
    dispatch(clearAuth());
  };

  return (
    <div className={styles.pageShell}>
      <div className={styles.pageContainer}>
        <div className={styles.dashboardCard}>
          <div className={styles.dashboardHeader}>
            <p className={styles.eyebrow}>Inventory Management</p>
            <h1 className={styles.dashboardTitle}>Dashboard</h1>
            <p className={styles.heroDesc}>
              {user
                ? `Welcome back, ${user.firstname} ${user.lastname}. Manage stock, view reports, and monitor your inventory from here.`
                : "You are on the dashboard. Login or signup to access inventory features."}
            </p>
            {user ? (
              <p className={styles.userDetails}>
                Signed in as {user.firstname} {user.lastname} ({user.email})
              </p>
            ) : null}
          </div>

          <div className={`${styles.dashboardGrid} ${styles.dashboardGrid2}`}>
            <div className={styles.dashboardItem}>
              <h2>Sales overview</h2>
              <p>Track your sales, orders, and inventory flow from one place.</p>
            </div>
            <div className={styles.dashboardItem}>
              <h2>Product status</h2>
              <p>Monitor stock levels, reorder alerts, and product availability.</p>
            </div>
          </div>

          <div className={styles.dashboardActions}>
            <Button variant="outline" type="button" onClick={handleLogout}>
              Logout
            </Button>
            <Link href="/login" className={`${styles.linkButton} ${styles.linkPrimary}`}>
              Login
            </Link>
            <Link href="/signup" className={`${styles.linkButton} ${styles.linkSecondary}`}>
              Signup
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
