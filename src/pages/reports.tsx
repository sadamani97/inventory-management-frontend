import React, { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ReportStatCards from "@/components/reports/ReportStatCards";
import TotalSalesChart from "@/components/reports/TotalSalesChart";
import SalesPurchaseChart from "@/components/reports/SalesPurchaseChart";
import PerformanceTable from "@/components/reports/PerformanceTable";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import ExportDialog from "@/components/ui/ExportDialog";
import styles from "@/styles/pages/reports.module.css";
import { FiUpload } from "react-icons/fi";
import {
  fetchReportKpiData,
  fetchReportSalesAnalytics,
  fetchSalesVsPurchases,
  fetchProductPerformance,
  ReportKpiData,
  SalesAnalyticsData,
  SalesVsPurchaseItem,
  ProductPerformanceItem,
} from "@/lib/reportApi";

export default function ReportsPage() {
  const [kpiData, setKpiData] = useState<ReportKpiData | null>(null);
  const [salesData, setSalesData] = useState<SalesAnalyticsData | null>(null);
  const [salesVsPurchase, setSalesVsPurchase] = useState<SalesVsPurchaseItem[]>([]);
  const [performanceData, setPerformanceData] = useState<ProductPerformanceItem[]>([]);
  const [performanceTotalItems, setPerformanceTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [perfLoading, setPerfLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [performancePage, setPerformancePage] = useState(1);
  const [performancePageSize, setPerformancePageSize] = useState(5);
  const [performanceStatus, setPerformanceStatus] = useState("");
  const [performanceSearch, setPerformanceSearch] = useState("");

  const [salesRange, setSalesRange] = useState<"Per Day" | "Weekly" | "10 Days">("Weekly");
  const [salesLoading, setSalesLoading] = useState(false);

  const exportRows = [
    ["Inventory Value", kpiData ? `₹ ${Number(kpiData.inventoryValue).toLocaleString()}` : "₹ 0"],
    ["Today's Revenue", kpiData ? `₹ ${Number(kpiData.todaysRevenue).toLocaleString()}` : "₹ 0"],
    ["Today's Total Orders", kpiData ? `${kpiData.todaysTotalOrders} orders` : "0 orders"],
    ["Today's Sales", kpiData ? `${kpiData.todaysSales} items` : "0 items"],
  ];

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      fetchReportKpiData(),
      fetchReportSalesAnalytics({ days: 7, range: "Weekly" }),
      fetchSalesVsPurchases(),
    ]).then(([kpi, analytics, svp]) => {
      if (isMounted) {
        setKpiData(kpi);
        setSalesData(analytics);
        setSalesVsPurchase(svp);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    setPerfLoading(true);

    fetchProductPerformance({
      search: performanceSearch || undefined,
      status: performanceStatus || undefined,
      page: performancePage,
      limit: performancePageSize,
    }).then((result) => {
      if (!isMounted) return;
      setPerformanceData(result.data);
      setPerformanceTotalItems(result.totalItems);
      setPerfLoading(false);
    }).catch(() => {
      if (isMounted) {
        setPerfLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [performancePage, performancePageSize, performanceSearch, performanceStatus]);

  const handleSalesRangeChange = useCallback(async (newRange: "Per Day" | "Weekly" | "10 Days") => {
    setSalesRange(newRange);
    setSalesLoading(true);
    const days = newRange === "Per Day" ? 1 : newRange === "10 Days" ? 10 : 7;
    try {
      const data = await fetchReportSalesAnalytics({ days, range: newRange });
      setSalesData(data);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const handleFilterChange = useCallback((status: string) => {
    setPerformanceStatus(status);
    setPerformancePage(1);
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setPerformanceSearch(search);
    setPerformancePage(1);
  }, []);

  const handlePerformancePageChange = useCallback((page: number) => {
    setPerformancePage(page);
  }, []);

  const handlePerformancePageSizeChange = useCallback((size: number) => {
    setPerformancePageSize(size);
    setPerformancePage(1);
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Reports</h1>
        <div className={styles.headerRight}>
          <CustomDatePicker />
          <button className={styles.downloadBtn} type="button" onClick={() => setIsExportOpen(true)}>
            <FiUpload size={14} />
            Export
          </button>
        </div>
      </div>

      <ReportStatCards data={kpiData} loading={loading} />

      <div className={styles.chartsGrid}>
        <TotalSalesChart
          data={salesData}
          loading={loading || salesLoading}
          range={salesRange}
          onRangeChange={handleSalesRangeChange}
        />
        <SalesPurchaseChart data={salesVsPurchase} loading={loading} />
      </div>

      <PerformanceTable
        data={performanceData}
        loading={perfLoading}
        totalItems={performanceTotalItems}
        currentPage={performancePage}
        pageSize={performancePageSize}
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        onPageChange={handlePerformancePageChange}
        onPageSizeChange={handlePerformancePageSizeChange}
      />

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Reports"
        columns={["Metric", "Value"]}
        data={exportRows}
        filename="reports_summary"
      />
    </DashboardLayout>
  );
}
