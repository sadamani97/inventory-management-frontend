import { useState } from "react";
import { useAppSelector } from "@/store/hooks";
import styles from "./Header.module.css";
import { FiSearch, FiBell } from "react-icons/fi";

export default function Header() {
  const user = useAppSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");

  const userInitial = user?.firstname ? user.firstname.charAt(0).toUpperCase() : "A";
  const userName = user ? `${user.firstname} ${user.lastname}` : "Alex Johnson";

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
      </div>
    </header>
  );
}
