import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  PurchaseOrderItem,
  fetchRecentActivities,
  ActivityItem,
  fetchProductsList,
  ProductItem,
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/purchaseOrders.module.css";
import Image from "next/image";
import { FiDownload, FiPlus, FiSearch, FiMoreHorizontal } from "react-icons/fi";

import CreatePOModal from "@/components/dashboard/CreatePOModal";
import ViewPOModal from "@/components/dashboard/ViewPOModal";
import CustomDatePicker from "@/components/dashboard/CustomDatePicker";
import CustomSelect from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";
import { APP_IMAGES } from "@/constants/images";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchPurchaseOrdersThunk,
  fetchPurchaseOrderStatsThunk,
  setCurrentPage,
  setPageSize,
  setSearchQuery,
  setStatusFilter,
} from "@/store/purchaseOrderSlice";

export default function PurchaseOrdersPage() {
  const dispatch = useAppDispatch();
  const {
    orders,
    totalOrders,
    stats,
    currentPage,
    pageSize,
    searchQuery,
    statusFilter,
    loading,
  } = useAppSelector((state) => state.purchaseOrders);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewOrder, setViewOrder] = useState<PurchaseOrderItem | null>(null);
  const [activeActionMenuId, setActiveActionMenuId] = useState<number | string | null>(null);
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

  // Fetch paginated purchase orders on filter or page change
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchPurchaseOrdersThunk());
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [dispatch, currentPage, pageSize, statusFilter, searchQuery]);

  // Fetch PO stats and secondary widgets data on mount
  useEffect(() => {
    dispatch(fetchPurchaseOrderStatsThunk());

    Promise.all([
      fetchRecentActivities(),
      fetchProductsList(),
    ]).then(([activityData, productsData]) => {
      setActivities((activityData ?? []).slice(0, 5));
      const lowStock = (productsData ?? []).filter(
        (p) => Number(p?.quantity ?? 0) <= 70
      );
      setLowStockProducts(lowStock);
    });
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchPurchaseOrdersThunk());
    dispatch(fetchPurchaseOrderStatsThunk());
  };

  const getStatusBadgeClass = (status?: string) => {
    const st = status?.toLowerCase() ?? "pending";
    if (st === "approved") return styles?.statusApproved;
    if (st === "shipped") return styles?.statusShipped;
    if (st === "delivered" || st === "completed") return styles?.statusDelivered;
    if (st === "cancelled" || st === "canceled") return styles?.statusCancelled;
    if (st === "delayed") return styles?.statusDelayed;
    if (st === "draft") return styles?.statusDraft;
    return styles?.statusPending;
  };

  const getPriority = (qty: number) => {
    if (qty < 20) return { label: "High", className: styles?.priorityHigh };
    if (qty >= 20 && qty < 40) return { label: "Middle", className: styles?.priorityMedium };
    return { label: "Low", className: styles?.priorityLow };
  };

  const filteredQueue = lowStockProducts?.filter((p) => {
    if (queuePriorityFilter === "All Priority") return true;
    const prio = getPriority(Number(p?.quantity ?? 0));
    return prio?.label?.toLowerCase() === queuePriorityFilter?.toLowerCase();
  });

  return (
    <DashboardLayout>
      <div className={styles?.container}>
        {/* Page Header */}
        <div className={styles?.pageHeader}>
          <h1 className={styles?.pageTitle}>Purchase Orders</h1>
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
          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Total Purchase Orders</span>
              <div className={`${styles?.statIconWrapper} ${styles?.purchaseOrdersElement1}`}>
                <Image
                  {...APP_IMAGES.TPO_ICON}
                  alt={APP_IMAGES.TPO_ICON.alt}
                  className={styles?.statIcon}
                />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.totalOrders ?? stats?.totalPurchaseOrders ?? 0}
              </span>
              <span className={styles?.statSubtitle}>Total created POs</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Pending Orders</span>
              <div className={`${styles?.statIconWrapper} ${styles?.purchaseOrdersElement2}`}>
                <Image
                  {...APP_IMAGES.PENDING_ORDER}
                  alt={APP_IMAGES.PENDING_ORDER.alt}
                  className={styles?.statIcon}
                />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.pendingOrders ?? 0}</span>
              <span className={styles?.statSubtitle}>Still Processing</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Completed Orders</span>
              <div className={`${styles?.statIconWrapper} ${styles?.purchaseOrdersElement3}`}>
                <Image
                  {...APP_IMAGES.COMPLETE_ORDER}
                  alt={APP_IMAGES.COMPLETE_ORDER.alt}
                  className={styles?.statIcon}
                />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.completedOrders ?? 0}</span>
              <span className={styles?.statSubtitle}>Successfully delivered</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Cancelled Orders</span>
              <div className={`${styles?.statIconWrapper} ${styles?.purchaseOrdersElement4}`}>
                <Image
                  {...APP_IMAGES.CANCEL_ORDER}
                  alt={APP_IMAGES.CANCEL_ORDER.alt}
                  className={styles?.statIcon}
                />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.cancelledOrders ?? 0}</span>
              <span className={styles?.statSubtitle}>Cancelled before completion</span>
            </div>
          </div>
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
                    <tr key={act?.id ?? i}>
                      <td>{act?.activity ?? "PO Created"}</td>
                      <td>{act?.sku ?? `PO-102${i}`}</td>
                      <td>{`Update regarding ${act?.product ?? "order"}`}</td>
                      <td>{act?.time ?? "5 min ago"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className={styles?.purchaseOrdersElement5}>
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
                {filteredQueue && filteredQueue.length > 0 ? (
                  filteredQueue.map((p, i) => {
                    const priority = getPriority(Number(p?.quantity ?? 0));
                    return (
                      <tr key={p?.id ?? i}>
                        <td>
                          <div className={styles?.productCell}>
                            <div className={styles?.productThumb}>
                              <Image
                                src={p?.imageUrl || APP_IMAGES.DASHBOARD_PRODUCT.src}
                                alt={p?.productName || "Product"}
                                width={32}
                                height={32}
                                className={styles?.thumbImg}
                              />
                            </div>
                            <span className={styles?.productName}>{p?.productName}</span>
                          </div>
                        </td>
                        <td>{p?.quantity ?? 0} Units</td>
                        <td>
                          <span className={`${styles?.priorityBadge} ${priority?.className}`}>
                            {priority?.label}
                          </span>
                        </td>
                        <td>
                          <button
                            className={styles?.btnRefill}
                            onClick={() => setIsModalOpen(true)}
                          >
                            Refill
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className={styles?.purchaseOrdersElement6}>
                      No low-stock items requiring refill.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Purchase Order List */}
        <div className={styles?.listSection}>
          <h2 className={styles?.cardTitle}>Purchase Order List</h2>

          <div className={styles?.listControls}>
            <div className={styles?.leftControls}>
              <div className={styles?.searchBox}>
                <FiSearch color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search by PO ID / Vendor name"
                  value={searchQuery}
                  onChange={(e) => dispatch(setSearchQuery(e?.target?.value))}
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
                onChange={(e) => dispatch(setStatusFilter(e?.target?.value))}
              >
                <option value="All Status">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Delayed">Delayed</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          <div className={styles?.purchaseOrdersElement7}>
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
                {loading ? (
                  <tr>
                    <td colSpan={8} className={styles?.purchaseOrdersElement8}>
                      Loading data...
                    </td>
                  </tr>
                ) : orders && orders.length > 0 ? (
                  orders.map((po, idx) => (
                    <tr key={String(po?.id ?? idx)}>
                      <td className={styles?.purchaseOrdersElement9}>
                        {String(po?.poNumber ?? `PO-100${idx + 1}`)}
                      </td>
                      <td>
                        {String(
                          po?.vendor?.vendorName ??
                          po?.vendor?.companyName ??
                          po?.vendorName ??
                          po?.productName ??
                          "Unknown"
                        )}
                      </td>
                      <td>
                        {String(
                          po?.quantity ??
                          po?.items?.reduce((acc: number, item: { quantity?: number }) => acc + (item?.quantity ?? 0), 0) ??
                          (idx % 20) + 1
                        )}{" "}
                        Items
                      </td>
                      <td className={styles?.amount}>
                        INR {Number(po?.totalAmount ?? 0).toLocaleString()}
                      </td>
                      <td>
                        <span className={`${styles?.statusBadge} ${getStatusBadgeClass(po?.status)}`}>
                          {po?.status ?? "Pending"}
                        </span>
                      </td>
                      <td>{po?.orderDate ?? po?.createdAt ?? "2026-03-24"}</td>
                      <td>{po?.expectedDeliveryDate ?? "-"}</td>
                      <td>
                        <button
                          className={styles?.actionBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionMenuId(
                              activeActionMenuId === po?.id ? null : po?.id
                            );
                          }}
                        >
                          <FiMoreHorizontal />
                        </button>
                        {activeActionMenuId === po?.id && (
                          <div className={styles?.popover}>
                            <button
                              type="button"
                              className={styles?.popoverItem}
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
                    <td colSpan={8} className={styles?.purchaseOrdersElement10}>
                      No purchase orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={totalOrders}
            pageSize={pageSize}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
            onPageSizeChange={(size) => dispatch(setPageSize(size))}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </div>
      </div>

      <CreatePOModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
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
        data={orders.map((o, idx) => [
          String(o?.poNumber ?? `PO-100${idx + 1}`),
          String(o?.vendor?.vendorName ?? o?.vendor?.companyName ?? o?.vendorName ?? o?.productName ?? "Unknown"),
          String(o?.quantity ?? o?.items?.reduce((acc: number, item: { quantity?: number }) => acc + (item?.quantity ?? 0), 0) ?? (idx % 20) + 1),
          `INR ${Number(o?.totalAmount ?? 0).toLocaleString()}`,
          String(o?.status ?? "Pending"),
          String(o?.orderDate ?? o?.createdAt ?? "2026-03-24"),
          String(o?.expectedDeliveryDate ?? "-"),
        ])}
        filename="purchase_orders"
      />
    </DashboardLayout>
  );
}
