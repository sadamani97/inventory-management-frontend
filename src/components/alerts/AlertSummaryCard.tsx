import React from "react";
import MetricCard, { MetricCardTone } from "@/components/common/MetricCard";

interface AlertSummaryCardProps {
  title: string;
  value: number | string;
  icon: string;
  iconTone?: "blue" | "red" | "amber" | "indigo";
  subtitle?: string;
  loading?: boolean;
}

export default function AlertSummaryCard({
  title,
  value,
  icon,
  iconTone = "blue",
  subtitle,
  loading = false,
}: AlertSummaryCardProps) {
  return (
    <MetricCard
      title={title}
      value={value}
      subtitle={subtitle}
      icon={icon}
      tone={iconTone as MetricCardTone}
      loading={loading}
    />
  );
}
