import React from "react";
import styles from "./StatusBadge.module.css";

export type StatusBadgeVariant = "solid" | "outline";

export interface StatusBadgeProps {
  label: string;
  variant?: StatusBadgeVariant;
  className?: string;
}

function getSolidClass(label: string): string {
  const clean = label.toLowerCase();
  if (clean.includes("out of stock") || clean.includes("low stock") || clean === "active") return styles.statusActive;
  if (clean.includes("in transit") || clean.includes("review")) return styles.statusInTransit;
  if (clean.includes("pending") || clean.includes("due") || clean.includes("draft")) return styles.statusPending;
  if (clean === "delivered" || clean.includes("completed") || clean.includes("paid")) return styles.statusDelivered;
  if (clean.includes("delayed") || clean.includes("overdue")) return styles.statusDelayed;
  if (clean.includes("cancelled") || clean.includes("canceled")) return styles.statusCancelled;
  return styles.statusDefault;
}

function getOutlineClass(label: string): string {
  const clean = label.toLowerCase();
  if (clean.includes("overdue")) return styles.statusOutlineOverdue;
  if (clean.includes("review")) return styles.statusOutlineReview;
  if (clean.includes("paid") || clean.includes("complete") || clean.includes("delivered")) return styles.statusOutlinePaid;
  if (clean.includes("high") || clean.includes("due") || clean.includes("pending") || clean.includes("draft")) {
    return styles.statusOutlinePending;
  }
  return styles.statusOutlinePending;
}

export default function StatusBadge({ label, variant = "outline", className = "" }: StatusBadgeProps) {
  const toneClass = variant === "solid" ? getSolidClass(label) : getOutlineClass(label);
  const badgeClass = variant === "solid" ? styles.statusBadge : styles.statusOutlineBadge;

  return <span className={`${badgeClass} ${toneClass} ${className}`.trim()}>{label}</span>;
}
