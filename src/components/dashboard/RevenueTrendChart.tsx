import React, { useEffect, useMemo, useState } from "react";
import styles from "./RevenueTrendChart.module.css";
import { fetchSalesOrdersList } from "@/lib/dashboardApi";
import { FiChevronDown } from "react-icons/fi";

interface ChartPoint {
  label: string;
  value: number;
  formatted: string;
}

type ViewMode = "month" | "year";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatCompactCurrency = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const getNearestNiceMax = (maxValue: number): number => {
  if (!Number.isFinite(maxValue) || maxValue <= 0) {
    return 10000;
  }

  const magnitude = 10 ** Math.floor(Math.log10(maxValue));
  const normalized = maxValue / magnitude;
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 7.5, 10];
  const nearestStep = steps.find((step) => normalized <= step) ?? steps[steps.length - 1];

  return nearestStep * magnitude;
};

export default function RevenueTrendChart() {
  const currentYear = new Date().getFullYear();
  const yearOptions = useMemo(
    () => Array.from({ length: 10 }, (_, idx) => currentYear - (9 - idx)),
    [currentYear]
  );

  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedFocusIndex, setSelectedFocusIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [yearlyRevenueMap, setYearlyRevenueMap] = useState<Record<number, number>>({});
  const [monthlyRevenueMap, setMonthlyRevenueMap] = useState<Record<number, Record<number, number>>>({});

  useEffect(() => {
    let isMounted = true;

    fetchSalesOrdersList()
      .then((orders) => {
        if (!isMounted) return;

        const yearTotals: Record<number, number> = {};
        const monthTotals: Record<number, Record<number, number>> = {};

        yearOptions.forEach((year) => {
          yearTotals[year] = 0;
          monthTotals[year] = Array.from({ length: 12 }, () => 0);
        });

        orders.forEach((order) => {
          const createdAt = order.createdAt || order.orderDate;
          if (!createdAt) return;

          const date = new Date(createdAt);
          if (!Number.isFinite(date.getTime())) return;

          const year = date.getFullYear();
          if (!(year in yearTotals)) {
            yearTotals[year] = 0;
            monthTotals[year] = Array.from({ length: 12 }, () => 0);
          }

          const monthIndex = date.getMonth();
          const revenue = Number(order.totalAmount || 0);
          if (revenue > 0) {
            yearTotals[year] += revenue;
            monthTotals[year][monthIndex] += revenue;
          }
        });

        setYearlyRevenueMap(yearTotals);
        setMonthlyRevenueMap(monthTotals);
        setLoading(false);
      })
      .catch(() => {
        if (isMounted) {
          setYearlyRevenueMap({});
          setMonthlyRevenueMap({});
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [yearOptions]);

  const monthlyChartData = useMemo<ChartPoint[]>(
    () =>
      MONTH_NAMES.map((month, index) => {
        const value = monthlyRevenueMap[selectedYear]?.[index] ?? 0;
        return {
          label: month,
          value,
          formatted: formatCompactCurrency(value),
        };
      }),
    [monthlyRevenueMap, selectedYear]
  );

  const yearlyChartData = useMemo<ChartPoint[]>(
    () =>
      yearOptions.map((year) => ({
        label: String(year),
        value: yearlyRevenueMap[year] ?? 0,
        formatted: formatCompactCurrency(yearlyRevenueMap[year] ?? 0),
      })),
    [yearOptions, yearlyRevenueMap]
  );

  const chartData = viewMode === "month" ? monthlyChartData : yearlyChartData;
  const selectedIndex = viewMode === "month" ? selectedMonthIndex : Math.max(0, yearOptions.indexOf(selectedYear));
  const focusIndex = hoveredIndex ?? selectedFocusIndex;
  const activePoint = chartData[selectedIndex] ?? chartData[0] ?? { label: "", value: 0, formatted: "₹0" };
  const focusPoint = focusIndex !== null ? chartData[focusIndex] ?? activePoint : activePoint;
  const hasRevenue = chartData.some((item) => item.value > 0);
  const displayRevenueText = loading ? "" : `₹ ${Number(activePoint.value).toLocaleString("en-IN")}`;
  const previousPointValue = chartData[Math.max(0, selectedIndex - 1)]?.value ?? 0;
  const growthPercent = hasRevenue && chartData.length > 1 ? Math.max(0, Math.round(((activePoint.value - previousPointValue) / Math.max(1, previousPointValue)) * 100)) : 0;

  const svgWidth = 668;
  const svgHeight = 180;
  const paddingLeft = 42;
  const paddingRight = 10;
  const topY = 16;
  const bottomY = 145;

  const maxChartValue = getNearestNiceMax(Math.max(...chartData.map((point) => point.value), 10000));
  const yAxisTicks = Array.from({ length: 5 }, (_, index) => {
    const tickValue = maxChartValue * (1 - index / 4);
    return {
      value: tickValue,
      y: topY + ((bottomY - topY) * index) / 4,
    };
  });

  const yGuides = yAxisTicks.map((tick) => ({
    label: tick.value === 0 ? "₹0" : formatCompactCurrency(tick.value),
    y: tick.y,
  }));

  const getY = (value: number): number => {
    const safeValue = Math.max(0, value);
    const ratio = maxChartValue > 0 ? safeValue / maxChartValue : 0;
    return bottomY - ratio * (bottomY - topY);
  };

  const getX = (idx: number): number => {
    if (chartData.length <= 1) return paddingLeft;
    const usableWidth = svgWidth - paddingLeft - paddingRight;
    const step = usableWidth / (chartData.length - 1);
    return paddingLeft + idx * step;
  };

  const points = chartData.map((point, index) => ({
    x: getX(index),
    y: getY(point.value),
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

  const selectedPoint = focusPoint;
  const selectedX = focusIndex !== null ? getX(focusIndex) : null;
  const selectedY = selectedX !== null ? getY(selectedPoint.value) : null;
  const tooltipWidth = 92;
  const tooltipHeight = 18;
  const tooltipPaddingX = 6;
  const tooltipPaddingY = 2;
  const tooltipX = selectedX !== null ? Math.min(Math.max(selectedX - tooltipWidth - 8, 16), svgWidth - tooltipWidth - 16) : 0;
  const tooltipY = selectedY !== null ? Math.max(selectedY - tooltipHeight / 2, 12) : 0;
  const showTooltip = hoveredIndex !== null || selectedFocusIndex !== null;
  const selectedDropdownLabel =
    viewMode === "month" ? `${MONTH_NAMES[selectedMonthIndex]} ${selectedYear}` : `Year ${selectedYear}`;

  const handleChartSelection = (idx: number) => {
    setSelectedFocusIndex(idx);
    setHoveredIndex(null);

    if (viewMode === "month") {
      setSelectedMonthIndex(idx);
      return;
    }

    const yearValue = yearOptions[idx];
    if (yearValue) {
      setSelectedYear(yearValue);
    }
  };

  return (
    <div className={styles.chartCard}>
      <div className={styles.chartHeader}>
        <h3 className={styles.title}>Revenue Trend</h3>
        <div className={styles.headerControls}>
          <span className={styles.selectedMonthLegend}>
            <span className={styles.legendDashedLine} />
            {viewMode === "month" ? "Selected month" : "Selected year"}
          </span>

          <div className={styles.dropdownContainer}>
            <button
              type="button"
              className={styles.monthDropdown}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <span>{selectedDropdownLabel}</span>
              <FiChevronDown className={styles.chevronIcon} />
            </button>

            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownSection}>View</div>
                <button
                  type="button"
                  className={`${styles.dropdownOption} ${viewMode === "month" ? styles.dropdownOptionActive : ""}`}
                  onClick={() => {
                    setViewMode("month");
                    setDropdownOpen(false);
                  }}
                >
                  Month
                </button>
                <button
                  type="button"
                  className={`${styles.dropdownOption} ${viewMode === "year" ? styles.dropdownOptionActive : ""}`}
                  onClick={() => {
                    setViewMode("year");
                    setDropdownOpen(false);
                  }}
                >
                  Year
                </button>

                <div className={styles.dropdownDivider} />

                {viewMode === "month" ? (
                  MONTH_NAMES.map((month, index) => (
                    <button
                      key={month}
                      type="button"
                      className={`${styles.dropdownOption} ${selectedMonthIndex === index ? styles.dropdownOptionActive : ""}`}
                      onClick={() => {
                        setSelectedMonthIndex(index);
                        setSelectedFocusIndex(index);
                        setDropdownOpen(false);
                      }}
                    >
                      {month}
                    </button>
                  ))
                ) : (
                  yearOptions.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={`${styles.dropdownOption} ${selectedYear === year ? styles.dropdownOptionActive : ""}`}
                      onClick={() => {
                        setSelectedYear(year);
                        setSelectedFocusIndex(yearOptions.indexOf(year));
                        setDropdownOpen(false);
                      }}
                    >
                      {year}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.revenueRow}>
        <h2 className={styles.revenueAmount}>
          {loading ? <span className={styles.skeletonAmount} /> : displayRevenueText}
        </h2>
        <span className={styles.growthTextWrapper}>
          <span className={styles.growthGreen}>↑ {growthPercent}%</span>
          <span className={styles.growthMuted}>from last {viewMode === "month" ? "month" : "year"}</span>
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

          {chartData.map((point, idx) => {
            const x = getX(idx);
            const isActive = idx === (hoveredIndex ?? selectedFocusIndex ?? -1);
            return (
              <g key={`${point.label}-${idx}`}>
                {isActive && showTooltip && (
                  <line
                    x1={x}
                    y1={topY}
                    x2={x}
                    y2={bottomY}
                    className={styles.verticalIndicator}
                  />
                )}
                {isActive && (
                  <circle
                    cx={x}
                    cy={getY(point.value)}
                    r={5}
                    className={styles.selectedPointDot}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => handleChartSelection(idx)}
                  />
                )}
                <text
                  key={`${point.label}-axis-${idx}`}
                  x={x}
                  y={bottomY + 22}
                  className={`${styles.xAxisText} ${isActive && showTooltip ? styles.selectedXAxisText : ""}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => handleChartSelection(idx)}
                >
                  {point.label}
                </text>
              </g>
            );
          })}

          {showTooltip && selectedX !== null && selectedY !== null && (
            <g transform={`translate(${tooltipX}, ${tooltipY})`} className={styles.tooltipWrap}>
              <rect width={tooltipWidth} height={tooltipHeight} rx="4" className={styles.tooltipRect} />
              <text x={tooltipPaddingX} y={tooltipHeight - tooltipPaddingY - 2} className={styles.tooltipLabel}>{selectedPoint.label}:</text>
              <text x={tooltipWidth - 45} y={tooltipHeight - tooltipPaddingY - 2} className={styles.tooltipValue}>{selectedPoint.formatted}</text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
