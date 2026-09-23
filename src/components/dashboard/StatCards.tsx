import { useEffect, useState } from "react";
import Image from "next/image";
import styles from "./StatCards.module.css";
import { fetchProductStats, ProductStatsResponse } from "@/lib/dashboardApi";
import { FiBox, FiCheckCircle, FiAlertCircle, FiXCircle } from "react-icons/fi";

export default function StatCards() {
  const [stats, setStats] = useState<ProductStatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetchProductStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalProd = stats ? stats.totalProducts : 0;
  const addedMonth = stats ? stats.addedThisMonth : 0;
  const activeStk = stats ? stats.activeStock : 0;
  const restocked = stats ? stats.unitsRestockedThisMonth : 0;
  const lowStk = stats ? stats.lowStock : 0;
  const outStk = stats ? stats.outOfStock : 0;

  const cards = [
    {
      title: "Total Products",
      value: loading ? "..." : `${totalProd}`,
      icon: "/Frontend/Dashboard_product.png",
      fallbackIcon: FiBox,
      iconClass: styles.iconBlue,
      footer: (
        <div className={styles.cardFooter}>
          <span className={styles.subtextGreen}>Added this month</span>
          <span className={styles.badgeGreen}>+{addedMonth}</span>
        </div>
      ),
    },
    {
      title: "Active Stock",
      value: loading ? "..." : `${activeStk}`,
      icon: "/Frontend/Active Stock logo.png",
      fallbackIcon: FiCheckCircle,
      iconClass: styles.iconGreen,
      footer: (
        <div className={styles.cardFooter}>
          <span className={styles.subtextGreen}>Units Restocked</span>
          <span className={styles.badgeGreen}>+{restocked.toLocaleString()}</span>
        </div>
      ),
    },
    {
      title: "Low Stock",
      value: loading ? "..." : `${lowStk}`,
      icon: "/Frontend/Low Stock.png",
      fallbackIcon: FiAlertCircle,
      iconClass: styles.iconAmber,
      footer: (
        <div className={styles.cardFooter}>
          <span className={styles.subtextAmber}>
            {lowStk > 0 ? `${lowStk} Need Restocking soon` : "Stock levels optimal"}
          </span>
        </div>
      ),
    },
    {
      title: "Out of stock",
      value: loading ? "..." : `${outStk}`,
      icon: "/Frontend/lowStock.png",
      fallbackIcon: FiXCircle,
      iconClass: styles.iconRed,
      footer: (
        <div className={styles.cardFooter}>
          <span className={styles.subtextMuted}>
            {outStk > 0 ? `${outStk} Currently unavailable` : "No items out of stock"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.cardsGrid}>
      {cards.map((card, idx) => {
        const Fallback = card.fallbackIcon;
        return (
          <div key={idx} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{card.title}</h3>
              <div className={`${styles.cardIconBox} ${card.iconClass}`}>
                {card.icon ? (
                  <Image
                    src={card.icon}
                    alt={card.title}
                    width={22}
                    height={22}
                    style={{ objectFit: "contain" }}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <Fallback />
                )}
              </div>
            </div>
            <p className={styles.cardValue}>{card.value}</p>
            {card.footer}
          </div>
        );
      })}
    </div>
  );
}
