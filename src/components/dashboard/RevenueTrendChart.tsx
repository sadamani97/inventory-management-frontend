import React, { useEffect, useState } from "react";
import styles from "./RevenueTrendChart.module.css";
import { fetchSalesAnalytics, SalesAnalyticsResponse } from "@/lib/dashboardApi";
import { FiTrendingUp } from "react-icons/fi";

interface DataPoint {
  month: string;
  value: number; // in lakhs or currency
  label: string;
}

export default function RevenueTrendChart() {
  const [selectedMonth, setSelectedMonth] = useState("Month");
  const [hoverIndex, setHoverIndex] = useState<number>(0);
  const [analytics, setAnalytics] = useState<SalesAnalyticsResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchSalesAnalytics().then((data) => {
      if (isMounted) {
        setAnalytics(data);
        if (data.chartData.length > 0) {
          setHoverIndex(data.chartData.length - 1);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const defaultPoints: DataPoint[] = [
    { month: "Jan", value: 16, label: "₹ 16L" },
    { month: "Feb", value: 14, label: "₹ 14L" },
    { month: "Mar", value: 19, label: "₹ 19L" },
    { month: "May", value: 18, label: "₹ 18L" },
    { month: "Jun", value: 23, label: "₹ 23L" },
    { month: "Jul", value: 17, label: "₹ 17L" },
    { month: "Aug", value: 19, label: "₹ 19L" },
    { month: "Sep", value: 23, label: "₹ 23L" },
    { month: "Oct", value: 18, label: "₹ 18L" },
    { month: "Nov", value: 15, label: "₹ 15L" },
    { month: "Dec", value: 20, label: "₹ 20L" },
  ];

  let dataPoints = defaultPoints;
  if (analytics && analytics.chartData && analytics.chartData.length > 0) {
    dataPoints = analytics.chartData.map((cd) => ({
      month: cd.date,
      value: cd.sales > 0 ? Number((cd.sales / 100000).toFixed(1)) : 10,
      label: `₹ ${cd.sales.toLocaleString()}`,
    }));
  }

  const totalRevDisplay = analytics
    ? `₹ ${analytics.totalSales.toLocaleString()}`
    : "₹ 23,07,349";

  const growthDisplay = analytics ? `${analytics.percentageGrowth}%` : "20%";

  const minY = 0;
  const maxY = Math.max(...dataPoints.map((d) => d.value), 30);
  const chartHeight = 160;
  const chartWidth = 540;
  const paddingLeft = 35;

  const getX = (index: number) => {
    const step = (chartWidth - paddingLeft - 20) / Math.max(dataPoints.length - 1, 1);
    return paddingLeft + index * step;
  };

  const getY = (val: number) => {
    const ratio = (val - minY) / (maxY - minY || 1);
    return chartHeight - ratio * (chartHeight - 40) + 10;
  };

  const points = dataPoints.map((dp, i) => `${getX(i)},${getY(dp.value)}`);
  const pathD = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point}`;
    const [pX, pY] = a[i - 1].split(",").map(Number);
    const [cX, cY] = point.split(",").map(Number);
    const midX = (pX + cX) / 2;
    return `${acc} C ${midX},${pY} ${midX},${cY} ${cX},${cY}`;
  }, "");

  const areaD = `${pathD} L ${getX(dataPoints.length - 1)},${chartHeight + 10} L ${paddingLeft},${chartHeight + 10} Z`;

  const activeIdx = Math.min(hoverIndex, dataPoints.length - 1);
  const activePoint = dataPoints[activeIdx] || dataPoints[0];
  const activeX = getX(activeIdx);
  const activeY = getY(activePoint ? activePoint.value : 10);

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>Revenue Trend</h3>
        <div className={styles.headerControls}>
          <span className={styles.selectedMonthLabel}>--- Selected month</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className={styles.monthSelect}
          >
            <option value="Month">Month</option>
            <option value="Quarter">Quarter</option>
            <option value="Year">Year</option>
          </select>
        </div>
      </div>

      <div className={styles.revenueRow}>
        <h2 className={styles.revenueAmount}>{totalRevDisplay}</h2>
        <span className={styles.growthBadge}>
          <FiTrendingUp /> + {growthDisplay} <span style={{ color: "#64748b", fontWeight: 400 }}>from last month</span>
        </span>
      </div>

      <div className={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 35}`}
          className={styles.svgElement}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[30, 21, 13, 0].map((yVal) => {
            const yPos = getY(yVal);
            return (
              <g key={yVal}>
                <text x="0" y={yPos + 4} className={styles.yAxisText}>
                  ₹{yVal}L
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

          <path d={areaD} fill="url(#revenueGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {activePoint && (
            <line
              x1={activeX}
              y1={activeY}
              x2={activeX}
              y2={chartHeight + 10}
              stroke="#2563eb"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {dataPoints.map((dp, i) => {
            const cx = getX(i);
            const cy = getY(dp.value);
            const isHovered = i === activeIdx;
            return (
              <g key={i} style={{ cursor: "pointer" }} onMouseEnter={() => setHoverIndex(i)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? "5" : "3.5"}
                  fill={isHovered ? "#ffffff" : "#2563eb"}
                  stroke="#2563eb"
                  strokeWidth={isHovered ? "3" : "1.5"}
                />
                <text
                  x={cx}
                  y={chartHeight + 28}
                  className={`${styles.xAxisText} ${isHovered ? styles.activeXText : ""}`}
                >
                  {dp.month}
                </text>
              </g>
            );
          })}
        </svg>

        {activePoint && (
          <div
            className={styles.tooltipBox}
            style={{
              left: `${(activeX / chartWidth) * 100}%`,
              top: `${(activeY / (chartHeight + 35)) * 100}%`,
            }}
          >
            Revenue: <span style={{ color: "#2563eb" }}>{activePoint.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
