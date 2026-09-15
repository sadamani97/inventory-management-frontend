import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./DashboardLayout.module.css";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuthUser } from "@/store/authSlice";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token) {
        router.replace("/login");
      } else {
        if (!user && storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            dispatch(
              setAuthUser({
                user: {
                  firstname: parsed.firstname || "",
                  lastname: parsed.lastname || "",
                  email: parsed.email || "",
                },
                token,
              })
            );
          } catch (e) {
            console.error("Error restoring user state:", e);
          }
        }
        setCheckingAuth(false);
      }
    }
  }, [router, dispatch, user]);

  if (checkingAuth) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#f8fafc" }}>
        <p style={{ color: "#64748b", fontWeight: 500 }}>Checking authentication...</p>
      </div>
    );
  }

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
