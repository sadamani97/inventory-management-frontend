import React, { useEffect, useState, useMemo } from "react";
import styles from "./RecentActivitiesTable.module.css";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { fetchRecentActivities, fetchRecentActivitiesPaginated, fetchProductsList, ActivityItem, ProductItem, formatRelativeTime } from "@/lib/dashboardApi";
import { FiSearch } from "react-icons/fi";

export default function RecentActivitiesTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch paginated activities directly from backend API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const timer = setTimeout(() => {
      fetchRecentActivitiesPaginated({
        page: currentPage,
        limit: pageSize,
        search: search.trim() || undefined,
        status: statusFilter !== "All Status" ? statusFilter : undefined,
      })
        .then((res) => {
          if (!isMounted) return;
          setActivities(res.data);
          setTotalItems(res.totalItems);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching activities from backend:", err);
          if (isMounted) setLoading(false);
        });
    }, 200); // 200ms debounce for search input

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentPage, pageSize, search, statusFilter]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const handleStatusFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1); // Reset to page 1 on new filter
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to page 1 on limit change
  };

  const getStatusClass = (status: ActivityItem["status"]) => {
    switch (status) {
      case "Completed":
        return styles.statusCompleted;
      case "Warning":
        return styles.statusWarning;
      case "Added":
        return styles.statusAdded;
      case "Delivered":
        return styles.statusDelivered;
      default:
        return "";
    }
  };

  return (
    <div className={styles.tableCard}>
      <div className={styles.tableHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <h3 className={styles.title}>Recent Activities</h3>
          {loading && <span className={styles.loadingSpinner} title="Fetching from backend API..." />}
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
            options={[
              { label: "All Status", value: "All Status" },
              { label: "Completed", value: "Completed" },
              { label: "Warning", value: "Warning" },
              { label: "Added", value: "Added" },
              { label: "Delivered", value: "Delivered" },
            ]}
            value={statusFilter}
            onChange={handleStatusFilterChange}
            width="130px"
            height="36px"
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Modern skeleton loading animation rows
              Array.from({ length: Math.min(pageSize, 8) }).map((_, idx) => (
                <tr key={`skeleton-${idx}`} className={styles.skeletonRow}>
                  <td><div className={styles.skeletonBone} style={{ width: "85%" }} /></td>
                  <td><div className={styles.skeletonBone} style={{ width: "70%" }} /></td>
                  <td><div className={styles.skeletonBone} style={{ width: "55%" }} /></td>
                  <td><div className={styles.skeletonBone} style={{ width: "40%" }} /></td>
                  <td><div className={styles.skeletonBadge} /></td>
                  <td><div className={styles.skeletonBone} style={{ width: "65%" }} /></td>
                </tr>
              ))
            ) : activities.length > 0 ? (
              activities.map((act) => (
                <tr key={act.id}>
                  <td className={styles.activityName}>{act.activity}</td>
                  <td className={styles.productName}>{act.product}</td>
                  <td className={styles.skuCode}>{act.sku}</td>
                  <td className={styles.qtyVal}>{act.qty}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusClass(act.status)}`}>
                      {act.status}
                    </span>
                  </td>
                  <td className={styles.timeText}>{act.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.recentActivitiesTableElement2}>
                  No backend products or activities found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
