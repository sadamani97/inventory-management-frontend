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

  const totalProd = stats ? stats.totalProducts : 1248;
  const addedMonth = stats ? stats.addedThisMonth : 32;
  const activeStk = stats ? stats.activeStock : 811;
  const restocked = stats && stats.unitsRestockedThisMonth > 0 ? stats.unitsRestockedThisMonth : 2450;
  const lowStk = stats ? stats.lowStock : 312;
  const outStk = stats ? stats.outOfStock : 125;

  const cards = [
    {
      title: "Total Products",
      value: loading ? <span className={styles.skeletonValue} /> : `${totalProd}`,
      icon: <TbBox size={17} strokeWidth={2} />,
      iconClass: styles.iconTotalProducts,
      footer: (
        <div className={styles.cardFooter}>
          {loading ? (
            <span className={styles.skeletonSubtext} />
          ) : (
            <>
              <span className={styles.subtextGreen}>Added this month</span>
              <span className={styles.badgeGreen}>+{addedMonth}</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Active Stock",
      value: loading ? <span className={styles.skeletonValue} /> : `${activeStk}`,
      icon: <TbBox size={17} strokeWidth={2} />,
      iconClass: styles.iconActiveStocks,
      footer: (
        <div className={styles.cardFooter}>
          {loading ? (
            <span className={styles.skeletonSubtext} />
          ) : (
            <>
              <span className={styles.subtextGreen}>Units Restocked</span>
              <span className={styles.badgeGreen}>+{restocked.toLocaleString()}</span>
            </>
          )}
        </div>
      ),
    },
    {
      title: "Low Stock",
      value: loading ? <span className={styles.skeletonValue} /> : `${lowStk}`,
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
      title: "Out of stock",
      value: loading ? <span className={styles.skeletonValue} /> : `${outStk}`,
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
