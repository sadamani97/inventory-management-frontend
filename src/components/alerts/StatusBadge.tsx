import styles from "@/styles/pages/alerts.module.css";

type StatusBadgeProps = {
  label: string;
  variant?: "solid" | "outline";
};

function getSolidClass(label: string): string {
  const clean = label.toLowerCase();
  if (clean.includes("out of stock") || clean.includes("low stock") || clean === "active") return styles.statusActive;
  if (clean.includes("in transit") || clean.includes("review")) return styles.statusInTransit;
  if (clean.includes("pending") || clean.includes("due")) return styles.statusPending;
  if (clean === "delivered" || clean.includes("completed") || clean.includes("paid")) return styles.statusDelivered;
  if (clean.includes("delayed") || clean.includes("overdue")) return styles.statusDelayed;
  if (clean.includes("cancelled") || clean.includes("canceled")) return styles.statusCancelled;
  return styles.statusDefault;
}

function getOutlineClass(label: string): string {
  const clean = label.toLowerCase();
  if (clean.includes("overdue")) return styles.statusOutlineOverdue;
  if (clean.includes("review")) return styles.statusOutlineReview;
  if (clean.includes("paid") || clean.includes("complete")) return styles.statusOutlinePaid;
  if (clean.includes("high") || clean.includes("due") || clean.includes("pending") || clean.includes("draft")) {
    return styles.statusOutlinePending;
  }
  return styles.statusOutlinePending;
}

export default function StatusBadge({ label, variant = "outline" }: StatusBadgeProps) {
  const toneClass = variant === "solid" ? getSolidClass(label) : getOutlineClass(label);
  const badgeClass = variant === "solid" ? styles.statusBadge : styles.statusOutlineBadge;

  return <span className={`${badgeClass} ${toneClass}`}>{label}</span>;
}
