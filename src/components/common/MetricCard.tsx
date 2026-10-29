import Image from "next/image";
import styles from "./MetricCard.module.css";

export type MetricCardTone = "blue" | "green" | "purple" | "red" | "amber" | "indigo";

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: string;
  tone?: MetricCardTone;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  tone = "blue",
}: MetricCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={`${styles.iconWrap} ${styles[tone]}`}>
          <Image src={icon} alt={title} width={30} height={30} className={styles.icon} />
        </span>
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>{value}</span>
        {subtitle ? <span className={styles.subtitle}>{subtitle}</span> : null}
      </div>
    </div>
  );
}
