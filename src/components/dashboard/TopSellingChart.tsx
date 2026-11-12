import React, { useEffect, useMemo, useState } from "react";
import styles from "./TopSellingChart.module.css";
import { fetchCategoryQuantities, type CategoryQuantityItem } from "@/lib/dashboardApi";

export interface CategoryChartItem {
  name: string;
  value: number;
}

export interface TopSellingChartProps {
  selectedDate?: Date | string;
  className?: string;
  title?: string;
}

export const formatCategoryLabel = (value: string): string => {
  if (!value) return "";
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const getRoundedMaxScale = (maxValue: number): number => {
  if (!Number.isFinite(maxValue) || maxValue <= 0) return 1000;
  if (maxValue <= 100) return 100;
  if (maxValue <= 500) return 500;
  if (maxValue <= 1000) return 1000;
  return Math.ceil(maxValue / 1000) * 1000;
};

export const buildTicks = (maxScale: number): number[] => {
  return [
    Math.round(maxScale),
    Math.round(maxScale * 0.8),
    Math.round(maxScale * 0.6),
    Math.round(maxScale * 0.4),
    Math.round(maxScale * 0.2),
    0,
  ];
};

export const formatTickLabel = (tick: number): string => {
  if (tick >= 1000) {
    const inK = tick / 1000;
    return Number.isInteger(inK) ? `${inK}k+` : `${inK.toFixed(1)}k+`;
  }
  return `${Math.round(tick)}`;
};

export default function TopSellingChart({
  selectedDate,
  className,
  title = "Top Selling Products",
}: TopSellingChartProps) {
  const [chartData, setChartData] = useState<CategoryChartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const parsedDate = useMemo(() => {
    if (!selectedDate) return new Date();
    const d = new Date(selectedDate);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        const targetMonth = parsedDate.getMonth();
        const targetYear = parsedDate.getFullYear();

        const rawData: CategoryQuantityItem[] = await fetchCategoryQuantities({
          month: targetMonth,
          year: targetYear,
          date: parsedDate,
        });

        if (!isMounted) return;

        // Aggregate by category name in case of casing differences or multiple entries
        const aggregatedMap: Record<string, number> = {};
        (rawData || []).forEach((item) => {
          const rawName = item?.name || "General";
          const formatted = formatCategoryLabel(rawName);
          const qty = Number(item?.quantity ?? item?.count ?? 0);
          if (qty > 0) {
            aggregatedMap[formatted] = (aggregatedMap[formatted] || 0) + qty;
          }
        });

        // Convert to CategoryChartItem array and sort descending by total quantity sold
        const sortedItems: CategoryChartItem[] = Object.entries(aggregatedMap)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setChartData(sortedItems);
      } catch (err) {
        console.error("Error loading top selling products data:", err);
        if (isMounted) {
          setChartData([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    const handleUpdate = () => {
      loadData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("inventory-updated", handleUpdate);
      window.addEventListener("sales-order-updated", handleUpdate);
    }

    return () => {
      isMounted = false;
      if (typeof window !== "undefined") {
        window.removeEventListener("inventory-updated", handleUpdate);
        window.removeEventListener("sales-order-updated", handleUpdate);
      }
    };
  }, [parsedDate]);

  // Dynamic scale & grid ticks based on highest sales quantity
  const maxScale = useMemo(() => {
    const highest = Math.max(...chartData.map((item) => item.value), 0);
    return getRoundedMaxScale(highest);
  }, [chartData]);

  const yTicks = useMemo(() => buildTicks(maxScale), [maxScale]);

  return (
    <div
      className={`${styles.chartCard} ${className ?? ""}`.trim()}
      role="region"
      aria-label="Top Selling Products Chart"
    >
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>{title}</h3>
      </div>

      <div className={styles.chartBody}>
        {loading ? (
          <div className={styles.skeletonContainer} aria-label="Loading chart data">
            <div className={styles.skeletonColumn}>
              <div className={`${styles.skeletonBar} ${styles.skeletonBar1}`} />
              <div className={styles.skeletonLabel} />
            </div>
            <div className={styles.skeletonColumn}>
              <div className={`${styles.skeletonBar} ${styles.skeletonBar2}`} />
              <div className={styles.skeletonLabel} />
            </div>
            <div className={styles.skeletonColumn}>
              <div className={`${styles.skeletonBar} ${styles.skeletonBar3}`} />
              <div className={styles.skeletonLabel} />
            </div>
            <div className={styles.skeletonColumn}>
              <div className={`${styles.skeletonBar} ${styles.skeletonBar4}`} />
              <div className={styles.skeletonLabel} />
            </div>
            <div className={styles.skeletonColumn}>
              <div className={`${styles.skeletonBar} ${styles.skeletonBar5}`} />
              <div className={styles.skeletonLabel} />
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateTitle}>No sales data for this month</div>
            <div className={styles.emptyStateSubtitle}>
              Try selecting another month in the date picker.
            </div>
          </div>
        ) : (
          <>
            {/* Sticky/Pinned Left Y-Axis */}
            <div className={styles.yAxisSticky} aria-label="Quantity sold axis">
              <div className={styles.yTicksWrapper}>
                {yTicks.map((tick) => (
                  <div key={`y-tick-${tick}`} className={styles.yTickLabel}>
                    {formatTickLabel(tick)}
                  </div>
                ))}
              </div>
              <div className={styles.yAxisSpacer} />
            </div>

            {/* Right Plot Area with Pinned Background and Horizontally Scrollable Bars */}
            <div className={styles.scrollAreaWrapper}>
              {/* Pinned horizontal grid lines & baseline */}
              <div className={styles.pinnedGridBackground} aria-hidden="true">
                <svg className={styles.pinnedGridSvg} viewBox="0 0 100 100" preserveAspectRatio="none">
                  {yTicks.map((tick) => {
                    const yPos = maxScale > 0 ? 100 - (tick / maxScale) * 100 : 100;
                    return (
                      <line
                        key={`grid-${tick}`}
                        x1="0"
                        y1={yPos}
                        x2="100"
                        y2={yPos}
                        className={styles.gridLineSvg}
                      />
                    );
                  })}
                </svg>
                <div className={styles.pinnedBaseline} />
              </div>

              {/* Horizontally scrollable bars & x-axis container */}
              <div
                className={styles.scrollContainer}
                tabIndex={0}
                aria-label="Category bars scroll area"
              >
                <div className={styles.barsTrack}>
                  {chartData.map((item, index) => {
                    const rawHeight = maxScale > 0 ? (item.value / maxScale) * 100 : 0;
                    const heightPercent = item.value > 0 ? Math.max(rawHeight, 4) : 0;
                    const isHovered = hoveredIndex === index;

                    return (
                      <div
                        key={`${item.name}-${index}`}
                        className={styles.barColumn}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      >
                        <div className={styles.barSlot}>
                          {isHovered && (
                            <div className={styles.tooltip} role="tooltip">
                              <span className={styles.tooltipValue}>
                                {item.value.toLocaleString("en-IN")}
                              </span>
                            </div>
                          )}

                          <svg
                            className={styles.barSvg}
                            viewBox="0 0 42 100"
                            preserveAspectRatio="none"
                            aria-label={`${item.name}: ${item.value} sold`}
                          >
                            <title>{`${item.name}: ${item.value} units sold`}</title>
                            <rect
                              x="0"
                              y={100 - heightPercent}
                              width="42"
                              height={heightPercent}
                              rx="4"
                              ry="2"
                              className={`${styles.barRect} ${isHovered ? styles.barHovered : ""}`}
                            />
                          </svg>
                        </div>

                        <span
                          className={styles.xLabel}
                          title={item.name}
                        >
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
