import React from "react";
import styles from "@/styles/pages/reports.module.css";
import MetricCard from "@/components/common/MetricCard";
import { ASSETS } from "@/constants/assets";
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
      icon: ASSETS.IMAGES.REPORT_INVENTORY_VALUE.src,
      subtitle: "Worth",
      tone: "blue" as const,
    },
    {
      title: "Today's Revenue",
      value: data ? formatCompactCurrency(data.todaysRevenue) : "₹0",
      icon: ASSETS.IMAGES.REPORT_TODAYS_REVENUE.src,
      subtitle: "Earned",
      tone: "green" as const,
    },
    {
      title: "Today's total orders",
      value: data ? `${data.todaysTotalOrders}` : "0",
      icon: ASSETS.IMAGES.REPORT_TOTAL_ORDERS.src,
      subtitle: "Orders",
      tone: "purple" as const,
    },
    {
      title: "Today's Sales",
      value: data ? `${data.todaysSales}` : "0",
      icon: ASSETS.IMAGES.REPORT_TODAYS_SALES.src,
      subtitle: "items sold",
      tone: "amber" as const,
    },
  ];

  return (
    <div className={styles.statsGrid}>
      {cards.map((card, idx) => (
        <MetricCard
          key={idx}
          title={card.title}
          value={loading ? "" : card.value}
          subtitle={loading ? "" : card.subtitle}
          icon={card.icon}
          tone={card.tone}
        />
      ))}
    </div>
  );
}
