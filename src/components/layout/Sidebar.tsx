import Link from "next/link";
import { useRouter } from "next/router";
import Image from "next/image";
import styles from "./Sidebar.module.css";
import {
  FiGrid,
  FiAlertTriangle,
  FiBarChart2,
  FiBox,
  FiLayers,
  FiUsers,
  FiClipboard,
  FiShoppingBag,
  FiFileText,
  FiSliders,
  FiHelpCircle,
} from "react-icons/fi";

export default function Sidebar() {
  const router = useRouter();
  const currentPath = router.pathname;

  const categories = [
    {
      name: "GENERAL",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: FiGrid },
        { name: "Alerts", href: "/alerts", icon: FiAlertTriangle },
        { name: "Reports", href: "/reports", icon: FiBarChart2 },
      ],
    },
    {
      name: "MANAGEMENT",
      items: [
        { name: "Products", href: "/products", icon: FiBox },
        { name: "Inventory", href: "/inventory", icon: FiLayers },
        { name: "Vendors", href: "/vendors", icon: FiUsers },
        { name: "Purchase Orders", href: "/purchase-orders", icon: FiClipboard },
        { name: "Sales Orders", href: "/sales-orders", icon: FiShoppingBag },
        { name: "Invoices", href: "/invoices", icon: FiFileText },
      ],
    },
    {
      name: "SETTINGS",
      items: [
        { name: "System Settings", href: "/system-settings", icon: FiSliders },
        { name: "Help & Privacy", href: "/help-privacy", icon: FiHelpCircle },
      ],
    },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandHeader}>
        <Link href="/dashboard" className={styles.brandLogo}>
          <Image
            src="/Frontend/DashboardLogo.png"
            alt="Stockflow Logo"
            width={28}
            height={28}
            className={styles.brandLogoImg}
            priority
          />
          <span className={styles.brandText}>Stockflow</span>
        </Link>
      </div>

      <nav className={styles.navigation}>
        {categories.map((cat) => (
          <div key={cat.name} className={styles.categoryGroup}>
            <p className={styles.categoryLabel}>{cat.name}</p>
            {cat.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                >
                  <span className={styles.navIcon}>
                    <Icon />
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className={styles.sidebarFooter}>
        © 2026 Stockflow
      </div>
    </aside>
  );
}
