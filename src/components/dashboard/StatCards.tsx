import React, { useEffect, useState } from "react";
import styles from "./StatCards.module.css";
import { fetchProductStats, ProductStatsResponse } from "@/lib/dashboardApi";
import { TbBox, TbAlertSquareRounded, TbCoins } from "react-icons/tb";

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

  const totalProd = stats?.totalProducts ?? 0;
  const addedMonth = stats?.addedThisMonth ?? 0;
  const activeStk = stats?.activeStock ?? 0;
  const restocked = stats?.unitsRestockedThisMonth ?? 0;
  const lowStk = stats?.lowStock ?? 0;
  const outStk = stats?.outOfStock ?? 0;

  const cards = [
    {
      title: "Total Products",
      value: loading ? <span className={styles.skeletonValue} /> : `${totalProd.toLocaleString("en-IN")}`,
      icon: <TbBox size={17} strokeWidth={2} />,
      iconClass: styles.iconTotalProducts,
      footer: (
        <div className={styles.cardFooter}>
          {loading ? (
            <span className={styles.skeletonSubtext} />
          ) : (
            <>
              <span className={styles.subtextGreen}>Added this month</span>
              <span className={styles.badgeGreen}>+{addedMonth.toLocaleString("en-IN")}</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Active Stock",
      value: loading ? <span className={styles.skeletonValue} /> : `${activeStk.toLocaleString("en-IN")}`,
      icon: <TbBox size={17} strokeWidth={2} />,
      iconClass: styles.iconActiveStocks,
      footer: (
        <div className={styles.cardFooter}>
          {loading ? (
            <span className={styles.skeletonSubtext} />
          ) : (
            <>
              <span className={styles.subtextGreen}>Units Restocked</span>
              <span className={styles.badgeGreen}>+{restocked.toLocaleString("en-IN")}</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Low Stock",
      value: loading ? <span className={styles.skeletonValue} /> : `${lowStk.toLocaleString("en-IN")}`,
      icon: <TbAlertSquareRounded size={17} strokeWidth={2} />,
      iconClass: styles.iconLowStock,
      footer: (
        <div className={styles.cardFooter}>
          {loading ? (
            <span className={styles.skeletonSubtext} />
          ) : (
            <span className={styles.subtextMuted}>Need Restocking soon</span>
          )}
        </div>
      ),
    },
    {
      title: "Out of Stock",
      value: loading ? <span className={styles.skeletonValue} /> : `${outStk.toLocaleString("en-IN")}`,
      icon: <TbCoins size={17} strokeWidth={2} />,
      iconClass: styles.iconOutOfStock,
      footer: (
        <div className={styles.cardFooter}>
          {loading ? (
            <span className={styles.skeletonSubtext} />
          ) : (
            <span className={styles.subtextMuted}>Currently unavailable</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.cardsGrid}>
      {cards.map((card, idx) => (
        <div key={idx} className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <div className={`${styles.cardIconBox} ${card.iconClass}`}>
              {card.icon}
            </div>
          </div>
          <p className={styles.cardValue}>{card.value}</p>
          {card.footer}
        </div>
      ))}
    </div>
  );
}
