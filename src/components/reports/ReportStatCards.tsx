import React from "react";
import Image from "next/image";
import styles from "@/styles/pages/reports.module.css";
import { ReportKpiData } from "@/lib/reportApi";

interface ReportStatCardsProps {
  data: ReportKpiData | null;
  loading: boolean;
}

export default function ReportStatCards({ data, loading }: ReportStatCardsProps) {
  const formatCompactCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${Number(value).toLocaleString()}`;
  };

  const cards = [
    {
      title: "Inventory Value",
      value: data ? formatCompactCurrency(data.inventoryValue) : "₹0",
      icon: "/Inventory value.png",
      footerText: "Worth",
      footerType: "muted" as const,
      iconClass: styles.statCardIconBlue,
    },
    {
      title: "Today's Revenue",
      value: data ? formatCompactCurrency(data.todaysRevenue) : "₹0",
      icon: "/todays revenue.png",
      footerText: "Earned",
      footerType: "green" as const,
      iconClass: styles.statCardIconGreen,
    },
    {
      title: "Today's total orders",
      value: data ? `${data.todaysTotalOrders}` : "0",
      icon: "/total salse order.png",
      footerText: "Orders",
      footerType: "green" as const,
      iconClass: styles.statCardIconPurple,
    },
    {
      title: "Today's Sales",
      value: data ? `${data.todaysSales}` : "0",
      icon: "/salselogo.png",
      footerText: "items sold",
      footerType: "green" as const,
      iconClass: styles.statCardIconGreen,
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map((card, idx) => (
        <div key={idx} className={styles.statCard}>
          <div className={styles.statCardHeader}>
            <h3 className={styles.statCardTitle}>{card.title}</h3>
            <div className={`${styles.statCardIconBox} ${card.iconClass}`}>
              <Image
                src={card.icon}
                alt={card.title}
                width={40}
                height={40}
                style={{ objectFit: "cover", borderRadius: 12 }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          </div>
          <p className={styles.statCardValue}>
            {loading ? (
              <span className={`${styles.skeleton} ${styles.skeletonValue}`} />
            ) : (
              card.value
            )}
          </p>
          <div className={styles.statCardFooter}>
            {loading ? (
              <span className={`${styles.skeleton}`} style={{ width: 120, height: 14 }} />
            ) : (
              <span
                className={
                  card.footerType === "green"
                    ? styles.statCardFooterGreen
                    : styles.statCardFooterMuted
                }
              >
                {card.footerText}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
