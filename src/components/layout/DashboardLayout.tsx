import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import Header from "./Header";
import styles from "./DashboardLayout.module.css";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setAuthUser } from "@/store/authSlice";
import { getAuthToken, removeAuthToken } from "@/lib/authToken";
import api from "@/lib/api";

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
      const token = getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      if (!user) {
        // Hit backend API to verify session and fetch live authenticated user details
        api.get("/users")
          .then((res) => {
            const users = res?.data?.data;
            if (Array.isArray(users) && users.length > 0) {
              const activeUser = users[0];
              dispatch(
                setAuthUser({
                  user: {
                    firstname: activeUser?.firstname ?? "",
                    lastname: activeUser?.lastname ?? "",
                    email: activeUser?.email ?? "",
                  },
                  token,
                })
              );
            }
          })
          .catch((err) => {
            if (err?.response?.status === 401) {
              removeAuthToken();
              router.replace("/login");
            }
          })
          .finally(() => {
            setCheckingAuth(false);
          });
      } else {
        setCheckingAuth(false);
      }
    }
  }, [router, dispatch, user]);

  if (checkingAuth) {
    return (
      <div className={styles.authLoadingContainer}>
        <p className={styles.authLoadingText}>Checking authentication...</p>
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
