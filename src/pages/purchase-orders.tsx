import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  fetchPurchaseOrdersList,
  fetchPurchaseOrdersPaginated,
  PurchaseOrderItem,
  fetchRecentActivities,
  ActivityItem,
  fetchProductsList,
  ProductItem,
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/purchaseOrders.module.css";
import { FiDownload, FiPlus, FiSearch, FiMoreHorizontal } from "react-icons/fi";

import CreatePOModal from "@/components/dashboard/CreatePOModal";
import ViewPOModal from "@/components/dashboard/ViewPOModal";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";
import MetricCard from "@/components/common/MetricCard";
import { ASSETS } from "@/constants/assets";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderItem[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [allOrdersForStats, setAllOrdersForStats] = useState<PurchaseOrderItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrderItem | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [queuePriorityFilter, setQueuePriorityFilter] = useState("All Priority");
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside() {
      setActiveActionMenuId(null);
    }
    if (activeActionMenuId !== null) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeActionMenuId]);

  const loadInitialData = useCallback(() => {
    Promise.all([
      fetchPurchaseOrdersList(),
      fetchRecentActivities(),
      fetchProductsList(),
    ]).then(([poData, activityData, productsData]) => {
      setAllOrdersForStats(poData || []);
      setActivities((activityData || [])?.slice(0, 5));

      const lowStock = (productsData || [])?.filter(
        (p) => Number(p?.quantity || 0) <= 70
      );

      setLowStockProducts(lowStock);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadPaginatedOrders = useCallback(() => {
    let isMounted = true;
    setTableLoading(true);

    fetchPurchaseOrdersPaginated({
      page: currentPage,
      limit: pageSize,
      search: searchQuery.trim() || undefined,
      status: statusFilter !== "All Status" ? statusFilter : undefined,
    })
      .then((res) => {
        if (!isMounted) return;
        setOrders(res.data || []);
        setTotalOrdersCount(res.totalItems || 0);
      })
      .catch((err) => {
        console.error("Failed to load POs:", err);
        if (isMounted) {
          setOrders([]);
          setTotalOrdersCount(0);
        }
      })
      .finally(() => {
        if (isMounted) setTableLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, pageSize, searchQuery, statusFilter]);

  useEffect(() => {
    return loadPaginatedOrders();
  }, [loadPaginatedOrders]);

  const stats = useMemo(() => {
    const total = allOrdersForStats?.length || 0;
    const pending =
      allOrdersForStats?.filter((o) => o?.status?.toLowerCase() === "pending")?.length ||
      0;
    const completed =
      allOrdersForStats?.filter((o) => {
        const s = o?.status?.toLowerCase();
        return (
          s === "completed" ||
          s === "delivered" ||
          s === "approved" ||
          s === "shipped"
        );
      })?.length || 0;
    const canceled =
      allOrdersForStats?.filter((o) => {
        const s = o?.status?.toLowerCase();
        return s === "canceled" || s === "cancelled";
      })?.length || 0;

    return { total, pending, completed, canceled };
  }, [allOrdersForStats]);

  const getStatusBadgeClass = (status?: string) => {
    const st = status?.toLowerCase() || "pending";
    if (st === "approved") return styles?.statusApproved;
    if (st === "shipped") return styles?.statusShipped;
    if (st === "delivered" || st === "completed")
      return styles?.statusDelivered;
    if (st === "cancelled" || st === "canceled") return styles?.statusCancelled;
    if (st === "delayed") return styles?.statusDelayed;
    if (st === "draft") return styles?.statusDraft;
    return styles?.statusPending; // default is pending
  };

  const getPriority = (qty: number) => {
    if (qty < 20) return { label: "High", className: styles?.priorityHigh };
    if (qty >= 20 && qty < 40) return { label: "Middle", className: styles?.priorityMedium };
    return { label: "Low", className: styles?.priorityLow };
  };

  const filteredQueue = lowStockProducts.filter(p => {
    if (queuePriorityFilter === "All Priority") return true;
    return getPriority(Number(p?.quantity || 0)).label === queuePriorityFilter;
  });

  return (
    <DashboardLayout>
      <div className={styles?.container}>
        {/* Header */}
        <div className={styles?.pageHeader}>
          <h1 className={styles?.pageTitle}>Purchase Order</h1>
          <div className={styles?.headerActions}>
            <button className={styles?.btnExport} onClick={() => setIsExportOpen(true)}>
              <FiDownload /> Export
            </button>
            <button
              className={styles?.btnPrimary}
              onClick={() => setIsModalOpen(true)}
            >
              <FiPlus /> Create Purchase Order
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles?.statsGrid}>
          <MetricCard
            title="Total Purchase Orders"
            value={stats?.total}
            subtitle="Total created POs"
            icon={ASSETS.ICONS.TPO.src}
            tone="blue"
          />
          <MetricCard
            title="Pending Orders"
            value={stats?.pending}
            subtitle="Still Processing"
            icon={ASSETS.ICONS.PENDING_ORDER.src}
            tone="amber"
          />
          <MetricCard
            title="Completed Orders"
            value={stats?.completed}
            subtitle="Successfully delivered"
            icon={ASSETS.ICONS.COMPLETE_ORDER.src}
            tone="green"
          />
          <MetricCard
            title="Cancelled Orders"
            value={stats?.canceled}
            subtitle="Cancelled before completion"
            icon={ASSETS.ICONS.CANCEL_ORDER.src}
            tone="red"
          />
        </div>

        {/* Middle Section */}
        <div className={styles?.middleSection}>
          {/* Recent Activity */}
          <div className={styles?.card}>
            <div className={styles?.cardHeader}>
              <h2 className={styles?.cardTitle}>Recent Activity</h2>
              <select className={styles?.dropdownSelect}>
                <option>All Activity</option>
              </select>
            </div>
            <table className={styles?.dataTable}>
              <thead>
                <tr>
                  <th>Activity Type</th>
                  <th>PO ID</th>
                  <th>Description</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {activities?.length > 0 ? (
                  activities?.map((act, i) => (
                    <tr key={act?.id || i}>
                      <td>{act?.activity || "PO Created"}</td>
                      <td>{act?.sku || `PO-102${i}`}</td>
                      <td>{`Update regarding ${act?.product || "order"}`}</td>
                      <td>{act?.time || "5 min ago"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.purchaseOrdersElement5}>
                      No recent activity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inventory Refill Queue */}
          <div className={styles?.card}>
            <div className={styles?.cardHeader}>
              <h2 className={styles?.cardTitle}>Inventory Refill Queue</h2>
              <CustomSelect
                options={[
                  { label: "All Priority", value: "All Priority" },
                  { label: "High", value: "High" },
                  { label: "Middle", value: "Middle" },
                  { label: "Low", value: "Low" },
                ]}
                value={queuePriorityFilter}
                onChange={(val) => setQueuePriorityFilter(val as string)}
                width="140px"
                height="32px"
              />
            </div>
            <table className={styles?.dataTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Stock</th>
                  <th>Priority</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue?.length > 0 ? (
                  filteredQueue?.map((p, i) => {
                    const priority = getPriority(
                      Number(p?.quantity || 0)
                    );
                    return (
                      <tr key={p?.id || i}>
                        <td>{p?.productName}</td>
                        <td>{p?.quantity}</td>
                        <td className={priority?.className}>
                          {priority?.label}
                        </td>
                        <td>
                          <button className={styles?.actionBtn}>+ PO</button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className={styles.purchaseOrdersElement6}>
                      No items require refill.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Order List */}
        <div className={styles?.listSection}>
          <h2 className={styles?.cardTitle}>
            Purchase Order List
            {tableLoading && <span className={styles.loadingSpinner} />}
          </h2>

          <div className={styles?.listControls}>
            <div className={styles?.leftControls}>
              <div className={styles?.searchBox}>
                <FiSearch color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search by PO ID / Vendor name"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e?.target?.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <CustomDatePicker variant="blue" icon="chevron" />
            </div>
            <div className={styles?.rightControls}>
              <button className={styles?.btnExport} onClick={() => setIsExportOpen(true)}>
                <FiDownload /> Export
              </button>
              <select
                className={styles?.dropdownSelect}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e?.target?.value);
                  setCurrentPage(1);
                }}
              >
                <option>All Status</option>
                <option>Pending</option>
                <option>Approved</option>
                <option>Shipped</option>
                <option>Delivered</option>
                <option>Cancelled</option>
                <option>Delayed</option>
                <option>Draft</option>
              </select>
            </div>
          </div>

          <div className={styles.purchaseOrdersElement7}>
            <table className={styles?.tableList}>
              <thead>
                <tr>
                  <th>PO ID</th>
                  <th>Vendor</th>
                  <th>Items Count</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Del Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, idx) => (
                    <tr key={`po-skel-${idx}`} className={styles.skeletonRow}>
                      <td><div className={styles.skeletonBone} style={{ width: "90px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "130px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "40px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "80px" }} /></td>
                      <td><div className={styles.skeletonBadge} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "85px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "85px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "24px" }} /></td>
                    </tr>
                  ))
                ) : orders?.length > 0 ? (
                  orders.map((po, idx) => (
                    <tr key={String(po?.id)}>
                      <td className={styles.purchaseOrdersElement9}>
                        {String(po?.poNumber || `PO-100${idx + 1}`)}
                      </td>
                      <td>
                        {String(
                          po?.vendor?.vendorName ||
                            po?.vendor?.companyName ||
                            po?.vendorName ||
                            po?.productName ||
                            "Unknown",
                        )}
                      </td>
                      <td>
                        {po?.quantity ||
                          po?.items?.reduce(
                            (acc: number, item) =>
                              acc + (item.quantity || 0),
                            0,
                          ) ||
                          (idx % 20) + 1}
                      </td>
                      <td>₹{Number(po?.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <span
                          className={`${styles?.statusBadge} ${getStatusBadgeClass(po?.status)}`}
                        >
                          {String(po?.status || "Pending")}
                        </span>
                      </td>
                      <td>
                        {po?.createdAt
                          ? new Date(po?.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "Not Set"}
                      </td>
                      <td>
                        {po?.expectedDeliveryDate
                          ? new Date(po?.expectedDeliveryDate).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )
                          : "Not Set"}
                      </td>
                      <td style={{ position: "relative" }}>
                        <button
                          className={styles.actionMenuBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(
                              activeActionMenuId === po.id ? null : po.id || null
                            );
                          }}
                        >
                          <FiMoreHorizontal />
                        </button>
                        
                        {activeActionMenuId === po.id && (
                          <div
                            className={styles.actionPopover}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              className={styles.popoverItem}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenuId(null);
                                setViewOrder(po);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className={styles.purchaseOrdersElement10}>
                      No purchase orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={totalOrdersCount}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>
      </div>

      <CreatePOModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadPaginatedOrders();
          loadInitialData();
        }}
      />
      <ViewPOModal
        isOpen={!!viewOrder}
        onClose={() => setViewOrder(null)}
        order={viewOrder}
      />
      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Purchase Orders"
        columns={["PO ID", "Vendor", "Items Count", "Total Amount", "Status", "Order Date", "Del Date"]}
        data={(allOrdersForStats.length > 0 ? allOrdersForStats : orders).map((o, idx) => [
          String(o?.poNumber || `PO-100${idx + 1}`),
          String(o?.vendor?.vendorName || o?.vendor?.companyName || o?.vendorName || o?.productName || "Unknown"),
          String(o?.quantity || o?.items?.reduce((acc: number, item: { quantity?: number }) => acc + (item.quantity || 0), 0) || (idx % 20) + 1),
          `INR ${Number(o?.totalAmount || 0).toLocaleString()}`,
          String(o?.status || "Pending"),
          o?.createdAt ? new Date(o?.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not Set",
          o?.expectedDeliveryDate ? new Date(o?.expectedDeliveryDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "Not Set"
        ])}
        filename="purchase_orders"
      />
    </DashboardLayout>
  );
}
