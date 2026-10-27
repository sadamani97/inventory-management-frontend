import React from "react";
import Image from "next/image";
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
    <div className={styles.summaryCard}>
      <div className={styles.summaryCardHeader}>
        <div className={styles.summaryTitle}>{title}</div>
        <div className={`${styles.summaryIconWrap} ${iconClassName}`}>
          <Image src={icon} alt={title} width={20} height={20} />
        </div>
      </div>

      <div className={styles.summaryValueRow}>
        <span className={styles.summaryValue}>{value}</span>
        {subtitle ? <span className={styles.summarySubtitle}>{subtitle}</span> : null}
      </div>
    </div>
  );
}
