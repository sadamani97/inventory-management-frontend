import React, { useEffect, useState, useMemo } from "react";
import styles from "./TopSellingChart.module.css";
import { fetchCategoryQuantities, CategoryQuantityItem } from "@/lib/dashboardApi";

// Default categories if database has no category records yet
const DEFAULT_CATEGORIES: CategoryQuantityItem[] = [
  { name: "Dairy", count: 920, quantity: 920 },
  { name: "Grains", count: 750, quantity: 750 },
  { name: "Snacks", count: 680, quantity: 680 },
  { name: "Beverages", count: 590, quantity: 590 },
  { name: "Essentials", count: 510, quantity: 510 },
];

export default function TopSellingChart() {
  const [categories, setCategories] = useState<CategoryQuantityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchCategoryQuantities()
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setCategories(data.slice(0, 5));
        } else {
          setCategories(DEFAULT_CATEGORIES);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading category quantities from backend:", err);
        if (isMounted) {
          setCategories(DEFAULT_CATEGORIES);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  const maxVal = useMemo(() => {
    const highest = Math.max(...displayCategories.map((c) => c.count || 0), 100);
    return Math.ceil(highest / 200) * 200;
  }, [displayCategories]);

  const svgWidth = 360;
  const svgHeight = 180;
  const paddingLeft = 36;
  const paddingRight = 10;
  const topY = 16;
  const bottomY = 150;
  const barWidth = 32;

  const getY = (val: number) => {
    const ratio = Math.max(0, Math.min(1, val / maxVal));
    return bottomY - ratio * (bottomY - topY);
  };

  const yTicks = [
    maxVal,
    Math.round(maxVal * 0.8),
    Math.round(maxVal * 0.6),
    Math.round(maxVal * 0.4),
    Math.round(maxVal * 0.2),
    0,
  ];

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>Top Selling Products</h3>
      </div>

      <div className={styles.chartContainer}>
        {loading ? (
          <div className={styles.skeletonContainer}>
            <div className={`${styles.skeletonBar} ${styles.skeletonBar1}`} />
            <div className={`${styles.skeletonBar} ${styles.skeletonBar2}`} />
            <div className={`${styles.skeletonBar} ${styles.skeletonBar3}`} />
            <div className={`${styles.skeletonBar} ${styles.skeletonBar4}`} />
            <div className={`${styles.skeletonBar} ${styles.skeletonBar5}`} />
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight + 25}`}
            className={styles.svgElement}
            preserveAspectRatio="none"
          >
            {/* Horizontal Grid lines & Y Axis Labels */}
            {yTicks.map((tick) => {
              const yPos = getY(tick);
              const label = tick >= 1000 ? `${(tick / 1000).toFixed(0)}k+` : `${tick}`;
              return (
                <g key={tick}>
                  <text x="0" y={yPos + 4} className={styles.yAxisText}>
                    {label}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={svgWidth - paddingRight}
                    y2={yPos}
                    className={styles.gridLine}
                  />
                </g>
              );
            })}

            {/* Baseline */}
            <line
              x1={paddingLeft}
              y1={bottomY}
              x2={svgWidth - paddingRight}
              y2={bottomY}
              className={styles.baseLine}
            />

            {/* Bars for Each Category */}
            {displayCategories.map((cat, idx) => {
              const usableWidth = svgWidth - paddingLeft - paddingRight;
              const step = usableWidth / displayCategories.length;
              const xPos = paddingLeft + idx * step + step / 2 - barWidth / 2;
              const yPos = getY(cat.count);
              const barHeight = Math.max(bottomY - yPos, 4);
              const isFirst = idx === 0;
              const isHovered = hoveredIdx === idx;

              let barClass = isFirst ? styles.barHighlighted : styles.barDefault;
              if (isHovered) {
                barClass = `${barClass} ${styles.barHovered}`;
              }

              return (
                <g
                  key={cat.name + idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <rect
                    x={xPos}
                    y={yPos}
                    width={barWidth}
                    height={barHeight}
                    rx="4"
                    className={barClass}
                  />

                  {/* Quantity Tooltip on hover */}
                  {isHovered && (
                    <g transform={`translate(${xPos + barWidth / 2}, ${yPos - 12})`}>
                      <rect
                        x="-24"
                        y="-12"
                        width="48"
                        height="18"
                        className={styles.tooltipRect}
                      />
                      <text y="1" className={styles.tooltipText}>
                        {cat.count}
                      </text>
                    </g>
                  )}

                  {/* Category Name on X-Axis */}
                  <text
                    x={xPos + barWidth / 2}
                    y={bottomY + 20}
                    className={styles.xAxisText}
                  >
                    {cat.name}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
