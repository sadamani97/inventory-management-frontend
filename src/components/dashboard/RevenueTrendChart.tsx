import React, { useEffect, useState, useMemo } from "react";
import styles from "./RevenueTrendChart.module.css";
import { fetchSalesOrdersList, fetchReportKpis } from "@/lib/dashboardApi";
import { FiChevronDown } from "react-icons/fi";

interface ChartPoint {
  month: string;
  revenueLakh: number;
  revenueFormatted: string;
}

const BASELINE_POINTS: ChartPoint[] = [
  { month: "Jan", revenueLakh: 13, revenueFormatted: "₹13L" },
  { month: "Feb", revenueLakh: 11, revenueFormatted: "₹11L" },
  { month: "Mar", revenueLakh: 16, revenueFormatted: "₹16L" },
  { month: "May", revenueLakh: 15, revenueFormatted: "₹15L" },
  { month: "Jun", revenueLakh: 23, revenueFormatted: "₹23L" },
  { month: "Jul", revenueLakh: 17, revenueFormatted: "₹17L" },
  { month: "Aug", revenueLakh: 18, revenueFormatted: "₹18L" },
  { month: "Sep", revenueLakh: 23, revenueFormatted: "₹23L" },
  { month: "Oct", revenueLakh: 17, revenueFormatted: "₹17L" },
  { month: "Nov", revenueLakh: 13, revenueFormatted: "₹13L" },
  { month: "Dec", revenueLakh: 18, revenueFormatted: "₹18L" },
];

export default function RevenueTrendChart() {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(4);
  const [totalRevenueText, setTotalRevenueText] = useState<string>("₹ 23,07,349");
  const [growthPercent] = useState<number>(20);
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<ChartPoint[]>(BASELINE_POINTS);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchSalesOrdersList().catch(() => []),
      fetchReportKpis().catch(() => null),
    ])
      .then(([orders, kpis]) => {
        if (!isMounted) return;

        if (kpis?.totalRevenue && kpis.totalRevenue > 0) {
          setTotalRevenueText(`₹ ${Number(kpis.totalRevenue).toLocaleString("en-IN")}`);
        } else if (orders.length > 0) {
          const sum = orders.reduce((acc, o) => acc + (Number(o.totalAmount) || 0), 0);
          if (sum > 0) {
            setTotalRevenueText(`₹ ${sum.toLocaleString("en-IN")}`);
          }
        }

        if (orders.length > 0) {
          const monthMap: Record<string, number> = {};
          const months = ["Jan", "Feb", "Mar", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          months.forEach((m) => (monthMap[m] = 0));

          orders.forEach((o) => {
            if (o.createdAt) {
              const d = new Date(o.createdAt);
              const mName = d.toLocaleDateString("en-US", { month: "short" });
              if (monthMap[mName] !== undefined) {
                monthMap[mName] += Number(o.totalAmount || 0);
              }
            }
          });

          const hasOrderData = Object.values(monthMap).some((v) => v > 0);
          if (hasOrderData) {
            const updated = BASELINE_POINTS.map((bp) => {
              const val = monthMap[bp.month];
              if (val > 0) {
                const inLakhs = Number((val / 100000).toFixed(1));
                return {
                  month: bp.month,
                  revenueLakh: inLakhs,
                  revenueFormatted: `₹${inLakhs}L`,
                };
              }
              return bp;
            });
            setChartData(updated);
          }
        }

        setLoading(false);
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const svgWidth = 690;
  const svgHeight = 180;
  const paddingLeft = 46;
  const paddingRight = 10;
  const topY = 16;
  const bottomY = 145;

  const yGuides = [
    { label: "₹30L", val: 30, y: topY },
    { label: "₹21L", val: 21, y: topY + (bottomY - topY) * 0.32 },
    { label: "₹13L", val: 13, y: topY + (bottomY - topY) * 0.68 },
    { label: "₹10L", val: 10, y: bottomY },
  ];

  const getY = (valLakh: number): number => {
    const clamped = Math.max(10, Math.min(30, valLakh));
    const ratio = (clamped - 10) / (30 - 10);
    return bottomY - ratio * (bottomY - topY);
  };

  const getX = (idx: number): number => {
    const usableWidth = svgWidth - paddingLeft - paddingRight;
    const step = usableWidth / (chartData.length - 1);
    return paddingLeft + idx * step;
  };

  const points = chartData.map((pt, idx) => ({
    x: getX(idx),
    y: getY(pt.revenueLakh),
  }));

  const pathD = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      return `${acc} L ${curr.x} ${curr.y}`;
    }, "");
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${pathD} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [pathD, points, bottomY]);

  const selectedPt = chartData[selectedMonthIndex] || chartData[4];
  const selectedX = getX(selectedMonthIndex);
  const selectedY = getY(selectedPt.revenueLakh);

  const tooltipWidth = 104;
  const tooltipHeight = 26;
  const tooltipX = selectedX - tooltipWidth - 8;
  const tooltipY = selectedY - tooltipHeight / 2;

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>Revenue Trend</h3>
        <div className={styles.headerControls}>
          <span className={styles.selectedMonthLegend}>
            <span className={styles.legendDashedLine} />
            Selected month
          </span>
          <div className={styles.monthDropdown}>
            <span>Month</span>
            <FiChevronDown />
          </div>
        </div>
      </div>

      <div className={styles.revenueRow}>
        <h2 className={styles.revenueAmount}>
          {loading ? <span className={styles.skeletonAmount} /> : totalRevenueText}
        </h2>
        <span className={styles.growthTextWrapper}>
          <span className={styles.growthGreen}>↑ {growthPercent}%</span>
          <span className={styles.growthMuted}>from last month</span>
        </span>
      </div>

      <div className={styles.chartContainer}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight + 25}`}
          className={styles.svgElement}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="revAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
              <stop offset="90%" stopColor="#2563EB" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {yGuides.map((guide) => (
            <g key={guide.label}>
              <text x="0" y={guide.y + 4} className={styles.yAxisText}>
                {guide.label}
              </text>
              <line
                x1={paddingLeft}
                y1={guide.y}
                x2={svgWidth - paddingRight}
                y2={guide.y}
                className={styles.gridLine}
              />
            </g>
          ))}

          <line
            x1={paddingLeft}
            y1={bottomY}
            x2={svgWidth - paddingRight}
            y2={bottomY}
            className={styles.baseLine}
          />

          <path d={areaD} fill="url(#revAreaGradient)" />

          <path
            d={pathD}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          <line
            x1={selectedX}
            y1={topY}
            x2={selectedX}
            y2={bottomY}
            className={styles.verticalIndicator}
          />

          <circle
            cx={selectedX}
            cy={selectedY}
            r="4.5"
            className={styles.selectedPointDot}
          />

          {chartData.map((cd, idx) => {
            const x = getX(idx);
            const isSelected = idx === selectedMonthIndex;
            return (
              <text
                key={cd.month}
                x={x}
                y={bottomY + 22}
                className={`${styles.xAxisText} ${isSelected ? styles.selectedXAxisText : ""}`}
                onClick={() => setSelectedMonthIndex(idx)}
              >
                {cd.month}
              </text>
            );
          })}

          <g transform={`translate(${tooltipX}, ${tooltipY})`}>
            <rect
              width={tooltipWidth}
              height={tooltipHeight}
              rx="6"
              className={styles.tooltipRect}
            />
            <circle cx="10" cy="13" r="3" className={styles.tooltipDot} />
            <text x="18" y="17" className={styles.tooltipLabel}>Revenue:</text>
            <text x="68" y="17" className={styles.tooltipValue}>{selectedPt.revenueFormatted}</text>
          </g>
        </svg>
      </div>
    </div>
  );
}
