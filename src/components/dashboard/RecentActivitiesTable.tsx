import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./RecentActivitiesTable.module.css";
import Table, { TableColumn } from "@/components/ui/Table";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { fetchRecentActivitiesPaginated, type ActivityItem } from "@/lib/dashboardApi";
import {
  aggregateDailyStockOut,
  cleanProductName,
  cleanProductSku,
  formatActivityQuantity,
  formatActivityTimestamp,
  getActivityStatusClassName,
  getActivityTypeClassName,
  getQuantityClassName,
  isSameCalendarDate,
  normalizeInventoryActivityType,
  paginateItems,
  selectActivityStatus,
  toDateQueryParam,
} from "@/lib/activityHelpers";
import { FiSearch } from "react-icons/fi";

const STATUS_OPTIONS = [
  { label: "All Status", value: "All Status" },
  { label: "Completed", value: "Completed" },
  { label: "Warning", value: "Warning" },
  { label: "Added", value: "Added" },
];

interface RecentActivitiesTableProps {
  selectedDate?: Date;
  refreshTrigger?: number;
}

export default function RecentActivitiesTable({
  selectedDate = new Date(),
  refreshTrigger = 0,
}: RecentActivitiesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchActivities = useCallback(() => {
    setLoading(true);

    fetchRecentActivitiesPaginated({
      page: 1,
      limit: 200,
      search: search.trim() || undefined,
      status: statusFilter !== "All Status" ? statusFilter : undefined,
      date: toDateQueryParam(selectedDate),
    })
      .then((result) => {
        const rawRows = result?.data ?? [];

        // Ensure rows match the selected calendar date
        const dateMatchedRows = rawRows.filter((activity) => {
          const timestamp = activity?.createdAt ?? activity?.time;
          if (!timestamp) return true;
          const parsed = new Date(timestamp);
          if (Number.isNaN(parsed.getTime())) return true;
          return isSameCalendarDate(parsed, selectedDate);
        });

        // Compute cumulative sales daily delta per product for the selected date
        const aggregated = aggregateDailyStockOut(dateMatchedRows, selectedDate);

        // Apply client-side status filter if status was selected
        const filtered =
          statusFilter !== "All Status"
            ? aggregated.filter((item) => {
                const s = selectActivityStatus(item.activity, item.status);
                return s.toLowerCase() === statusFilter.toLowerCase();
              })
            : aggregated;

        setTotalItems(filtered.length);
        setActivities(paginateItems(filtered, currentPage, pageSize));
      })
      .catch((error: unknown) => {
        console.error("Error fetching activities from backend API:", error);
        setActivities([]);
        setTotalItems(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentPage, pageSize, search, statusFilter, selectedDate]);

  // Debounced fetch on search / filter / date change
  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchActivities();
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [fetchActivities, refreshTrigger]);

  // Dynamic state/cache updates reflecting inventory changes made in the database
  useEffect(() => {
    const handleDynamicUpdate = () => {
      fetchActivities();
    };

    window.addEventListener("inventory-updated", handleDynamicUpdate);
    window.addEventListener("focus", handleDynamicUpdate);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchActivities();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Periodic background sync (every 25 seconds when visible)
    const intervalTimer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchActivities();
      }
    }, 25000);

    return () => {
      window.removeEventListener("inventory-updated", handleDynamicUpdate);
      window.removeEventListener("focus", handleDynamicUpdate);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalTimer);
    };
  }, [fetchActivities]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const columns: TableColumn<ActivityItem>[] = useMemo(
    () => [
      {
        key: "activity",
        header: "Activity",
        render: (row) => {
          const canonicalActivity = normalizeInventoryActivityType(row?.activity);
          return (
            <span className={`${styles.activityBadge} ${getActivityTypeClassName(canonicalActivity, styles)}`}>
              {canonicalActivity}
            </span>
          );
        },
      },
      {
        key: "product",
        header: "Product",
        render: (row) => (
          <span className={styles.productName}>
            {cleanProductName(row?.product)}
          </span>
        ),
      },
      {
        key: "sku",
        header: "SKU",
        render: (row) => (
          <span className={styles.skuCode}>
            {cleanProductSku(row?.sku)}
          </span>
        ),
      },
      {
        key: "qty",
        header: "Qty",
        render: (row) => {
          const canonicalActivity = normalizeInventoryActivityType(row?.activity);
          const formattedQty = formatActivityQuantity(
            canonicalActivity,
            row?.quantityValue !== undefined ? row.quantityValue : row?.qty
          );
          return (
            <span className={`${styles.qtyVal} ${getQuantityClassName(canonicalActivity, formattedQty, styles)}`}>
              {formattedQty}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        render: (row) => {
          const canonicalActivity = normalizeInventoryActivityType(row?.activity);
          const canonicalStatus = selectActivityStatus(canonicalActivity, row?.status);
          return (
            <span className={`${styles.statusBadge} ${getActivityStatusClassName(canonicalStatus, styles)}`}>
              {canonicalStatus}
            </span>
          );
        },
      },
      {
        key: "time",
        header: "Time",
        render: (row) => (
          <span className={styles.timeText}>
            {formatActivityTimestamp(row?.createdAt ?? row?.time)}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div className={styles.titleWrapper}>
          <h3 className={styles.title}>Recent Activities</h3>
        </div>
        <div className={styles.headerActions}>
          <label className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search Activities"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className={styles.searchInput}
            />
            <FiSearch className={styles.searchIcon} />
          </label>

          <CustomSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            size="sm"
            className={styles.statusSelect}
          />
        </div>
      </div>

      <div className={styles.activityTableContainer}>
        <Table<ActivityItem>
          columns={columns}
          data={activities}
          loading={loading}
          skeletonRows={Math.min(pageSize, 8)}
          emptyMessage="No activities found for this date."
          rowKey={(row, index) => row?.id ?? `${row?.product ?? "activity"}-${index}`}
          className={styles.activityTable}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[5, 10, 15, 20]}
      />
    </div>
  );
}
