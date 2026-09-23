import { useState } from "react";
import { useRouter } from "next/router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearAuth } from "@/store/authSlice";
import styles from "./Header.module.css";
import { FiSearch, FiBell, FiLogOut } from "react-icons/fi";

export default function Header() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");

  const userInitial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : "A";
  const userName = user ? `${user.firstname} ${user.lastname}`.trim() : "Alex Johnson";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch(clearAuth());
    router.push("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.searchContainer}>
        <FiSearch className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <span className={styles.shortcutBadge}>⌘ F</span>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.notificationBtn} aria-label="Notifications">
          <FiBell />
          <span className={styles.bellBadge}>2</span>
        </button>

        <div className={styles.profileContainer}>
          <div className={styles.avatar}>
            {userInitial}
          </div>
          <div className={styles.profileInfo}>
            <p className={styles.profileName}>{userName}</p>
            <p className={styles.profileRole}>Inventory Manager</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className={styles.notificationBtn}
          title="Logout"
          aria-label="Logout"
          style={{ marginLeft: 8 }}
        >
          <FiLogOut />
        </button>
      </div>
    </header>
  );
}
