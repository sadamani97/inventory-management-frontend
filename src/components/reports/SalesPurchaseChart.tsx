import React, { useState } from "react";
import styles from "@/styles/pages/reports.module.css";
import { SalesVsPurchaseItem } from "@/lib/reportApi";

interface SalesPurchaseChartProps {
  data: SalesVsPurchaseItem[];
  loading: boolean;
}

export default function SalesPurchaseChart({ data, loading }: SalesPurchaseChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number>(-1);

  if (loading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Sales & Purchase</h3>
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Sales & Purchase</h3>
        </div>
        <div className={styles.emptyState}>No comparison data available.</div>
      </div>
    );
  }

  // Chart dimensions
  const chartWidth = 380;
  const chartHeight = 240;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 10;
  const paddingBottom = 50;
  const drawWidth = chartWidth - paddingLeft - paddingRight;
  const drawHeight = chartHeight - paddingTop - paddingBottom;

  const allValues = data.flatMap((d) => [d.sales, d.purchase]);
  const maxVal = Math.max(...allValues, 1000);
  const ySteps = [0, Math.round(maxVal * 0.33), Math.round(maxVal * 0.66), maxVal];

  const barGroupWidth = drawWidth / data.length;
  const barWidth = Math.min(barGroupWidth * 0.3, 24);
  const barGap = 4;

  const getY = (val: number) => {
    const ratio = val / maxVal;
    return paddingTop + drawHeight - ratio * drawHeight;
  };

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Sales & Purchase</h3>
      </div>

      <div className={styles.barChartLegend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotSales}`} />
          Sales
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendDot} ${styles.legendDotPurchase}`} />
          Purchase
        </div>
      </div>

      <div className={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className={styles.chartSvg}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines + Y axis labels */}
          {ySteps.map((yVal) => {
            const yPos = getY(yVal);
            return (
              <g key={yVal}>
                <text x={paddingLeft - 8} y={yPos + 3} className={styles.yAxisLabel} textAnchor="end">
                  {yVal >= 1000 ? `₹${(yVal / 1000).toFixed(0)}K` : `₹${yVal}`}
                </text>
                <line
                  x1={paddingLeft}
                  y1={yPos}
                  x2={chartWidth - paddingRight}
                  y2={yPos}
                  className={styles.gridLine}
                />
              </g>
            );
          })}

          {/* Bar groups */}
          {data.map((item, i) => {
            const groupCenterX = paddingLeft + (i + 0.5) * barGroupWidth;
            const salesBarX = groupCenterX - barWidth - barGap / 2;
            const purchaseBarX = groupCenterX + barGap / 2;
            const salesBarHeight = (item.sales / maxVal) * drawHeight;
            const purchaseBarHeight = (item.purchase / maxVal) * drawHeight;
            const isHovered = i === hoverIndex;

            return (
              <g
                key={i}
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(-1)}
                style={{ cursor: "pointer" }}
              >
                {/* Sales bar */}
                <rect
                  x={salesBarX}
                  y={paddingTop + drawHeight - salesBarHeight}
                  width={barWidth}
                  height={Math.max(salesBarHeight, 2)}
                  rx={4}
                  ry={4}
                  fill={isHovered ? "#1d4ed8" : "#2563eb"}
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* Purchase bar */}
                <rect
                  x={purchaseBarX}
                  y={paddingTop + drawHeight - purchaseBarHeight}
                  width={barWidth}
                  height={Math.max(purchaseBarHeight, 2)}
                  rx={4}
                  ry={4}
                  fill={isHovered ? "#d97706" : "#f59e0b"}
                  opacity={isHovered ? 1 : 0.85}
                />

                {/* X axis label */}
                <text
                  x={groupCenterX}
                  y={chartHeight - 12}
                  className={`${styles.xAxisLabel} ${isHovered ? styles.xAxisLabelActive : ""}`}
                >
                  {item.date}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip on hover */}
        {hoverIndex >= 0 && data[hoverIndex] && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${((paddingLeft + (hoverIndex + 0.5) * barGroupWidth) / chartWidth) * 100}%`,
              top: `${((getY(Math.max(data[hoverIndex].sales, data[hoverIndex].purchase))) / chartHeight) * 100}%`,
            }}
          >
            Sales: <span className={styles.tooltipBold}>₹{data[hoverIndex].sales.toLocaleString()}</span>
            {" | "}
            Purchase: <span className={styles.tooltipBold}>₹{data[hoverIndex].purchase.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
