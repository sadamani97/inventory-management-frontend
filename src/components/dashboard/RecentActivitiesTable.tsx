import React, { useEffect, useState, useMemo } from "react";
import styles from "./RecentActivitiesTable.module.css";
import Table, { TableColumn } from "@/components/ui/Table";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { fetchRecentActivitiesPaginated, ActivityItem, formatActivityTimeLabel } from "@/lib/dashboardApi";
import { FiSearch } from "react-icons/fi";

const STATUS_OPTIONS = [
  { label: "All Status", value: "All Status" },
  { label: "Complete", value: "Completed" },
  { label: "Warning", value: "Warning" },
  { label: "Added", value: "Added" },
  { label: "Delivered", value: "Delivered" },
];

interface RecentActivitiesTableProps {
  selectedDate?: Date;
}

export default function RecentActivitiesTable({ selectedDate = new Date() }: RecentActivitiesTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(() => {
      fetchRecentActivitiesPaginated({
        page: currentPage,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== "All Status" ? statusFilter : undefined,
      })
        .then((res) => {
          if (!isMounted) return;
          const filteredData = res.data.filter((activity) => {
            const eventDate = new Date(activity.createdAt || activity.time);
            if (Number.isNaN(eventDate.getTime())) return false;

            return (
              eventDate.getFullYear() === selectedDate.getFullYear() &&
              eventDate.getMonth() === selectedDate.getMonth() &&
              eventDate.getDate() === selectedDate.getDate()
            );
          });
          setActivities(filteredData);
          setTotalItems(filteredData.length);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching activities from backend:", err);
          if (isMounted) setLoading(false);
        });
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentPage, pageSize, search, statusFilter, selectedDate]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const getStatusClass = (status: ActivityItem["status"] | "Complete" | "Alert") => {
    switch (status) {
      case "Completed":
      case "Complete":
        return styles.statusCompleted;
      case "Warning":
      case "Alert":
        return styles.statusWarning;
      case "Added":
        return styles.statusAdded;
      case "Delivered":
        return styles.statusDelivered;
      default:
        return "";
    }
  };

  const columns: TableColumn<ActivityItem>[] = useMemo(
    () => [
      {
        key: "activity",
        header: "Activity",
        minWidth: 180,
        render: (row) => <span className={styles.activityName}>{row.activity}</span>,
      },
      {
        key: "product",
        header: "Product",
        minWidth: 160,
        render: (row) => <span className={styles.productName}>{row.product}</span>,
      },
      {
        key: "sku",
        header: "SKU",
        minWidth: 120,
        render: (row) => <span className={styles.skuCode}>{row.sku}</span>,
      },
      {
        key: "qty",
        header: "Qty",
        minWidth: 90,
        render: (row) => <span className={styles.qtyVal}>{row.qty || "0"}</span>,
      },
      {
        key: "status",
        header: "Status",
        minWidth: 120,
        render: (row) => {
          const normalizedStatus = row.status === "Completed" ? "Complete" : row.status;
          return (
            <span className={`${styles.statusBadge} ${getStatusClass(normalizedStatus as ActivityItem["status"] | "Complete" | "Alert")}`}>
              {normalizedStatus}
            </span>
          );
        },
      },
      {
        key: "time",
        header: "Time",
        minWidth: 120,
        render: (row) => <span className={styles.timeText}>{formatActivityTimeLabel(row.createdAt || row.time)}</span>,
      },
    ],
    []
  );

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div className={styles.titleWrapper}>
          <h3 className={styles.title}>Recent Activities</h3>
          {loading && <span className={styles.loadingSpinner} title="Fetching activities..." />}
        </div>
        <div className={styles.headerActions}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search Activities"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className={styles.searchInput}
            />
            <FiSearch className={styles.searchIcon} />
          </div>

          <CustomSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            width="130px"
            height="36px"
          />
        </div>
      </div>

      <div className={styles.activityTableContainer}>
        <Table<ActivityItem>
          columns={columns}
          data={activities}
          loading={loading}
          skeletonRows={Math.min(pageSize, 8)}
          height="460px"
          minWidth="800px"
          emptyMessage="No activities found for this date."
          rowKey={(row) => row.id}
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
