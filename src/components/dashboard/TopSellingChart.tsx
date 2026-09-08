import React, { useState } from "react";
import styles from "./TopSellingChart.module.css";

interface ProductCategory {
  name: string;
  count: number;
}

export default function TopSellingChart() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const categories: ProductCategory[] = [
    { name: "Dairy", count: 920 },
    { name: "Grains", count: 750 },
    { name: "Snacks", count: 680 },
    { name: "Grains", count: 590 },
    { name: "Essentials", count: 510 },
  ];

  const maxVal = 1000;
  const chartHeight = 180;
  const chartWidth = 320;
  const paddingLeft = 35;
  const barWidth = 32;

  const getY = (val: number) => {
    const ratio = val / maxVal;
    return chartHeight - ratio * (chartHeight - 20) + 10;
  };

  const yTicks = [1000, 800, 600, 400, 200, 0];

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.title}>Top Selling Products</h3>

      <div className={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`}
          className={styles.svgElement}
          preserveAspectRatio="none"
        >
          {/* Y Axis Grid & Labels */}
          {yTicks.map((tick) => {
            const yPos = getY(tick);
            const label = tick === 1000 ? "1k+" : `${tick}`;
            return (
              <g key={tick}>
                <text x="0" y={yPos + 4} className={styles.yAxisText}>
                  {label}
                </text>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={chartWidth - 10}
                  y2={yPos}
                  className={styles.gridLine}
                />
              </g>
            );
          })}

          {/* Bar Chart Items */}
          {categories.map((cat, i) => {
            const step = (chartWidth - paddingLeft - 20) / categories.length;
            const xPos = paddingLeft + i * step + step / 2 - barWidth / 2;
            const yPos = getY(cat.count);
            const height = chartHeight + 10 - yPos;
            const isHighlighted = i === 0; // First bar has darker blue tone in screenshot

            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <rect
                  x={xPos}
                  y={yPos}
                  width={barWidth}
                  height={Math.max(height, 0)}
                  rx="4"
                  fill={
                    hoveredIdx === i
                      ? "#1d4ed8"
                      : isHighlighted
                      ? "#2563eb"
                      : "#bfdbfe"
                  }
                  className={styles.bar}
                />
                {/* X Category Label */}
                <text
                  x={xPos + barWidth / 2}
                  y={chartHeight + 28}
                  className={styles.xAxisText}
                >
                  {cat.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
