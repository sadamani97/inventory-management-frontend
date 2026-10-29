import React from "react";
import MetricCard from "@/components/common/MetricCard";
import styles from "@/styles/pages/alerts.module.css";

interface AlertSummaryCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconTone?: "blue" | "red" | "amber" | "indigo";
  subtitle?: string;
}

export default function AlertSummaryCard({
  title,
  value,
  icon,
  iconTone = "blue",
  subtitle,
}: AlertSummaryCardProps) {
  const iconClassName = {
    blue: styles.summaryIconBlue,
    red: styles.summaryIconRed,
    amber: styles.summaryIconAmber,
    indigo: styles.summaryIconIndigo,
  }[iconTone];

  return (
    <MetricCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={icon}
      tone={iconTone === "blue" ? "blue" : iconTone === "red" ? "red" : iconTone === "amber" ? "amber" : "indigo"}
    />
  );
}
