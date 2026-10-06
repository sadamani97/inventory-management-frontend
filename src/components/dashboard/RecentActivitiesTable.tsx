import React, { useEffect, useState, useMemo } from "react";
import styles from "./RecentActivitiesTable.module.css";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { fetchRecentActivities, fetchProductsList, ActivityItem, ProductItem, formatRelativeTime } from "@/lib/dashboardApi";
import { FiSearch } from "react-icons/fi";

export default function RecentActivitiesTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      // First try fetching recent report performance activities
      let items = await fetchRecentActivities();
      if (items.length === 0) {
        // Fallback: fetch products list directly from DB
        const products = await fetchProductsList();
        if (products && products.length > 0) {
          items = products.map((prod: ProductItem, idx: number) => {
            const qty = Number(prod.quantity ?? 0);
            let statusVal: ActivityItem["status"] = "Completed";
            if (qty <= 0) statusVal = "Warning";
            else if (qty <= 10) statusVal = "Warning";
            else if (idx % 2 === 0) statusVal = "Added";
            else statusVal = "Delivered";

            return {
              id: String(prod.id || idx + 1),
              activity: qty <= 10 ? "Low Stock Alert" : "Stock In",
              product: String(prod.productName || "Product"),
              sku: String(prod.sku || `SKU-${idx + 1}`),
              qty: qty <= 10 ? `${qty} Left` : `+${qty}`,
              status: statusVal,
              time: formatRelativeTime(prod.createdAt || prod.updatedAt),
            };
          });
        }
      }

      if (isMounted) {
        setActivities(items);
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch =
        act.activity.toLowerCase().includes(search.toLowerCase()) ||
        act.product.toLowerCase().includes(search.toLowerCase()) ||
        act.sku.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All Status" || act.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [activities, search, statusFilter]);

  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredActivities.slice(startIndex, startIndex + pageSize);
  }, [filteredActivities, currentPage, pageSize]);

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
        <h3 className={styles.title}>Recent Activities</h3>
        <div className={styles.headerActions}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search Activities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
            onChange={setStatusFilter}
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
              <tr>
                <td colSpan={6} className={styles.recentActivitiesTableElement1}>
                  Loading activities from backend...
                </td>
              </tr>
            ) : paginatedActivities.length > 0 ? (
              paginatedActivities.map((act) => (
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
        totalItems={filteredActivities.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[5, 10, 15, 20]}
      />
    </div>
  );
}
