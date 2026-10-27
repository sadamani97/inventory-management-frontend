import React, { useState, useEffect } from "react";
import styles from "@/styles/pages/reports.module.css";
import { SalesAnalyticsData } from "@/lib/reportApi";
import { FiTrendingUp } from "react-icons/fi";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";

export type ChartRange = "Per Day" | "Weekly" | "10 Days";

interface TotalSalesChartProps {
  data: SalesAnalyticsData | null;
  loading: boolean;
  range?: ChartRange;
  onRangeChange?: (range: ChartRange) => void;
}

export default function TotalSalesChart({
  data,
  loading,
  range: propRange,
  onRangeChange,
}: TotalSalesChartProps) {
  const [range, setRange] = useState<ChartRange>(propRange || "Weekly");
  const [hoverIndex, setHoverIndex] = useState<number>(-1);

  useEffect(() => {
    if (propRange && propRange !== range) {
      setRange(propRange);
    }
  }, [propRange]);

  const rangeOptions: CustomSelectOption[] = [
    { label: "Per Day", value: "Per Day" },
    { label: "Weekly", value: "Weekly" },
    { label: "10 Days", value: "10 Days" },
  ];

  const handleRangeChange = (val: string) => {
    const newRange = val as ChartRange;
    setRange(newRange);
    setHoverIndex(-1);
    if (onRangeChange) {
      onRangeChange(newRange);
    }
  };

  if (loading) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Total Sales</h3>
          <div className={styles.chartControls}>
            <CustomSelect
              options={rangeOptions}
              value={range}
              onChange={handleRangeChange}
              width="120px"
              height="34px"
            />
          </div>
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonChart}`} />
      </div>
    );
  }

  const rawChartData = data?.chartData || [];
  // Ensure chartData aligns with selected range as defensive fallback
  let chartData = rawChartData;
  if (range === "Per Day" && rawChartData.length > 1) {
    chartData = rawChartData.slice(-1);
  } else if (range === "Weekly" && rawChartData.length > 7) {
    chartData = rawChartData.slice(-7);
  } else if (range === "10 Days" && rawChartData.length > 10) {
    chartData = rawChartData.slice(-10);
  }

  if (chartData.length === 0) {
    return (
      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <h3 className={styles.chartTitle}>Total Sales</h3>
          <div className={styles.chartControls}>
            <CustomSelect
              options={rangeOptions}
              value={range}
              onChange={handleRangeChange}
              width="120px"
              height="34px"
            />
          </div>
        </div>
        <div className={styles.emptyState}>No sales data available for {range.toLowerCase()}.</div>
      </div>
    );
  }

  const totalSales = chartData.reduce((acc, d) => acc + (Number(d.sales) || 0), 0);
  const growth = data?.percentageGrowth ?? 0;

  const periodLabel =
    range === "Per Day"
      ? "today"
      : range === "Weekly"
      ? "past 7 days"
      : "past 10 days";

  const rangeBadgeText =
    range === "Per Day"
      ? "1 Day View"
      : range === "Weekly"
      ? "7 Days View"
      : "10 Days View";

  // Chart dimensions
  const chartWidth = 580;
  const chartHeight = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;
  const drawWidth = chartWidth - paddingLeft - paddingRight;
  const drawHeight = chartHeight - paddingTop - paddingBottom;

  const maxVal = Math.max(...chartData.map((d) => d.sales), 1000);
  const ySteps = [0, Math.round(maxVal * 0.25), Math.round(maxVal * 0.5), Math.round(maxVal * 0.75), maxVal];

  const getX = (index: number) => {
    if (chartData.length <= 1) return paddingLeft + drawWidth / 2;
    return paddingLeft + (index / (chartData.length - 1)) * drawWidth;
  };

  const getY = (val: number) => {
    const ratio = maxVal > 0 ? val / maxVal : 0;
    return paddingTop + drawHeight - ratio * drawHeight;
  };

  const isSingleDay = chartData.length === 1;

  // Build bezier path if more than 1 point
  let pathD = "";
  let areaD = "";
  let points: Array<{ x: number; y: number }> = [];

  if (!isSingleDay) {
    points = chartData.map((d, i) => ({ x: getX(i), y: getY(d.sales) }));
    pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      pathD += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`;
    }
    areaD = `${pathD} L ${points[points.length - 1].x},${paddingTop + drawHeight} L ${points[0].x},${paddingTop + drawHeight} Z`;
  }

  const activeIdx = hoverIndex >= 0 ? hoverIndex : chartData.length - 1;
  const activePoint = chartData[activeIdx];
  const activeX = getX(activeIdx);
  const activeY = getY(activePoint?.sales ?? 0);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>Total Sales</h3>
        <div className={styles.chartControls}>
          <CustomSelect
            options={rangeOptions}
            value={range}
            onChange={handleRangeChange}
            width="120px"
            height="34px"
          />
        </div>
      </div>

      <div className={styles.totalSalesSummary}>
        <h2 className={styles.totalSalesValue}>₹ {totalSales.toLocaleString()}</h2>
        <span className={styles.rangeBadge}>{rangeBadgeText}</span>
        <span className={styles.totalSalesGrowth}>
          <FiTrendingUp size={12} />
          +{growth}%
          <span className={styles.totalSalesPeriod}>{periodLabel}</span>
        </span>
      </div>

      <div className={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className={styles.chartSvg}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="singleDayBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.1" />
            </linearGradient>
          </defs>

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

          {/* Single Day Design */}
          {isSingleDay && (() => {
            const dp = chartData[0];
            const cx = getX(0);
            const cy = getY(dp.sales);
            const baseY = paddingTop + drawHeight;
            const barWidth = 68;
            const barHeight = Math.max(baseY - cy, 4);

            return (
              <g key="single-day-view">
                {/* Vertical Focus Column Bar */}
                <rect
                  x={cx - barWidth / 2}
                  y={cy}
                  width={barWidth}
                  height={barHeight}
                  rx={8}
                  ry={8}
                  fill="url(#singleDayBarGradient)"
                  stroke="#2563eb"
                  strokeWidth="1.5"
                />

                {/* Dashed center vertical line */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={baseY}
                  stroke="#2563eb"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />

                {/* Node circle on top */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={6}
                  fill="#ffffff"
                  stroke="#2563eb"
                  strokeWidth={3}
                />

                {/* Highlight Badge above the bar */}
                <g>
                  <rect
                    x={cx - 52}
                    y={Math.max(cy - 34, 4)}
                    width={104}
                    height={24}
                    rx={6}
                    fill="#1e293b"
                    opacity="0.95"
                  />
                  <text
                    x={cx}
                    y={Math.max(cy - 18, 20)}
                    fill="#ffffff"
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="Manrope, sans-serif"
                    fontWeight="700"
                  >
                    ₹ {dp.sales.toLocaleString()}
                  </text>
                </g>

                {/* X Axis Label */}
                <text
                  x={cx}
                  y={chartHeight - 8}
                  className={`${styles.xAxisLabel} ${styles.xAxisLabelActive}`}
                  fontSize="12"
                  fontWeight="700"
                >
                  Today ({dp.date})
                </text>
              </g>
            );
          })()}

          {/* Multi-day (Weekly & 10 Days) Line and Area Design */}
          {!isSingleDay && (
            <>
              {/* Area fill */}
              <path d={areaD} fill="url(#salesAreaGradient)" />

              {/* Line */}
              <path
                d={pathD}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Dashed vertical indicator */}
              {activePoint && (
                <line
                  x1={activeX}
                  y1={activeY}
                  x2={activeX}
                  y2={paddingTop + drawHeight}
                  stroke="#2563eb"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
              )}

              {/* Data points */}
              {chartData.map((dp, i) => {
                const cx = getX(i);
                const cy = getY(dp.sales);
                const isActive = i === activeIdx;
                const dotRadius = chartData.length > 8 ? (isActive ? 4.5 : 3) : (isActive ? 5 : 3.5);
                const fontSize = chartData.length > 8 ? "9px" : "10px";

                return (
                  <g
                    key={i}
                    onMouseEnter={() => setHoverIndex(i)}
                    onMouseLeave={() => setHoverIndex(-1)}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Hit area */}
                    <circle cx={cx} cy={cy} r="14" fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={dotRadius}
                      fill={isActive ? "#fff" : "#2563eb"}
                      stroke="#2563eb"
                      strokeWidth={isActive ? 3 : 1.5}
                    />
                    <text
                      x={cx}
                      y={chartHeight - 8}
                      className={`${styles.xAxisLabel} ${isActive ? styles.xAxisLabelActive : ""}`}
                      style={{ fontSize }}
                    >
                      {dp.date}
                    </text>
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Tooltip for multi-day */}
        {!isSingleDay && activePoint && hoverIndex >= 0 && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${(activeX / chartWidth) * 100}%`,
              top: `${(activeY / chartHeight) * 100}%`,
            }}
          >
            {activePoint.date}: <span className={styles.tooltipBold}>₹ {activePoint.sales.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}
