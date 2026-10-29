import { useEffect, useState, useMemo, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  fetchSalesOrdersList,
  fetchSalesOrdersPaginated,
  fetchSalesOrderStats,
  SalesOrderItem,
  SalesOrderStatsResponse,
  deleteSalesOrder,
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/salesOrders.module.css";
import { FiDownload, FiPlus, FiSearch, FiEye, FiEdit2, FiShoppingCart, FiDollarSign, FiUsers, FiFileText, FiTrash2 } from "react-icons/fi";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";
import SalesOrderModal, { SalesOrderMode } from "@/components/dashboard/SalesOrderModal";
import MetricCard from "@/components/common/MetricCard";
import { ASSETS } from "@/constants/assets";
import { toast } from "react-toastify";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [allOrdersForExport, setAllOrdersForExport] = useState<SalesOrderItem[]>([]);
  const [stats, setStats] = useState<SalesOrderStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SalesOrderMode>("create");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderItem | null>(null);

  const loadStats = useCallback(() => {
    fetchSalesOrderStats().then((statsData) => {
      setStats(statsData);
      setLoading(false);
    });
    fetchSalesOrdersList().then((allData) => {
      setAllOrdersForExport(allData || []);
    });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const loadPaginatedOrders = useCallback(() => {
    let isMounted = true;
    setTableLoading(true);

    fetchSalesOrdersPaginated({
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
        console.error("Failed to load sales orders:", err);
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

  const handleDeleteDraft = async (id: number | string) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      const res = await deleteSalesOrder(id);
      if (res?.success) {
        toast.success("Draft deleted successfully");
        loadPaginatedOrders();
        loadStats();
      }
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    const st = status?.toLowerCase() || "draft";
    if (st === "paid" || st === "completed" || st === "delivered") return styles?.statusPaid;
    if (st === "cancelled" || st === "failed") return styles?.statusCancelled;
    if (st === "pending") return styles?.statusPending;
    return styles?.statusDraft;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout>
      <div className={styles?.container}>
        {/* Header */}
        <div className={styles?.pageHeader}>
          <h1 className={styles?.pageTitle}>Sales Orders</h1>
          <div className={styles?.headerActions}>
            <button className={styles?.btnExport} onClick={() => setIsExportOpen(true)}>
              <FiDownload /> Export
            </button>
            <button 
              className={styles?.btnPrimary}
              onClick={() => {
                setModalMode("create");
                setSelectedOrder(null);
                setIsModalOpen(true);
              }}
            >
              <FiPlus /> Create Sales Order
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles?.statsGrid}>
          <MetricCard
            title="Total Sales Orders"
            value={stats?.totalSalesOrders?.toLocaleString() || "0"}
            subtitle="Orders Placed"
            icon={ASSETS.ICONS.TPO.src}
            tone="blue"
          />
          <MetricCard
            title="Total Order Value"
            value={stats?.totalOrderValueFormatted || "₹0"}
            subtitle="Revenue Generated"
            icon={ASSETS.IMAGES.REPORT_TODAYS_REVENUE.src}
            tone="green"
          />
          <MetricCard
            title="Average Order Value"
            value={stats?.averageOrderValueFormatted || "₹0"}
            subtitle="Avg Spend/Customer"
            icon={ASSETS.IMAGES.REPORT_INVENTORY_VALUE.src}
            tone="purple"
          />
          <MetricCard
            title="Active Buyers"
            value={stats?.activeBuyers?.toLocaleString() || "0"}
            subtitle="Unique Customers"
            icon={ASSETS.ICONS.ORDER_PAGE.src}
            tone="amber"
          />
        </div>

        {/* Orders List */}
        <div className={styles?.listSection}>
          <div className={styles?.pageHeader} style={{ marginBottom: "16px" }}>
            <h2 className={styles?.cardTitle}>
              Orders List
              {tableLoading && <span className={styles.loadingSpinner} />}
            </h2>
            <button className={styles?.btnExport} onClick={() => setIsExportOpen(true)}>
              <FiDownload /> Export
            </button>
          </div>

          <div className={styles?.listControls}>
            <div className={styles?.leftControls}>
              <div className={styles?.searchBox}>
                <FiSearch color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search by Orders ID/Customer..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e?.target?.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className={styles?.rightControls}>
              <select
                className={styles?.btnExport}
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e?.target?.value);
                  setCurrentPage(1);
                }}
                style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", outline: "none", backgroundColor: "var(--surface)" }}
              >
                <option value="All Status">Status: All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className={styles?.tableListWrapper}>
            <table className={styles?.tableList}>
              <thead>
                <tr>
                  <th>SO-ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total Amount</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, idx) => (
                    <tr key={`so-skel-${idx}`} className={styles.skeletonRow}>
                      <td><div className={styles.skeletonBone} style={{ width: "90px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "130px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "60px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "80px" }} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "70px" }} /></td>
                      <td><div className={styles.skeletonBadge} /></td>
                      <td><div className={styles.skeletonBone} style={{ width: "60px" }} /></td>
                    </tr>
                  ))
                ) : orders?.length > 0 ? (
                  orders.map((so, idx) => {
                    const itemsCount = so?.items?.reduce((acc, item) => acc + (item?.quantity || 0), 0) || so?.quantity || 1;
                    return (
                      <tr key={String(so?.id || idx)}>
                        <td style={{ fontWeight: 600 }}>
                          {String(so?.orderNumber || so?.soNumber || `SO-100${idx + 1}`)}
                        </td>
                        <td>{String(so?.customerType || so?.customerName || "Walk In Customer")}</td>
                        <td>{itemsCount} items</td>
                        <td style={{ fontWeight: 600 }}>
                          ₹{Number(so?.totalAmount || 0).toLocaleString()}
                        </td>
                        <td>{formatTime(so?.createdAt || so?.orderDate)}</td>
                        <td>
                          <span className={`${styles?.statusBadge} ${getStatusBadgeClass(so?.status)}`}>
                            {String(so?.status || "Pending")}
                          </span>
                        </td>
                        <td>
                          <div className={styles?.actionsContainer}>
                            <button 
                              className={styles?.actionMenuBtn} 
                              title="View"
                              onClick={() => {
                                setModalMode("view");
                                setSelectedOrder(so);
                                setIsModalOpen(true);
                              }}
                            >
                              <FiEye />
                            </button>
                            {(so?.status?.toLowerCase() === "draft" || so?.isDraft) && (
                              <>
                                <button 
                                  className={styles?.actionMenuBtn} 
                                  title="Edit"
                                  onClick={() => {
                                    setModalMode("edit");
                                    setSelectedOrder(so);
                                    setIsModalOpen(true);
                                  }}
                                >
                                  <FiEdit2 />
                                </button>
                                <button 
                                  className={styles?.actionMenuBtn} 
                                  title="Delete"
                                  onClick={() => handleDeleteDraft(so?.id)}
                                >
                                  <FiTrash2 />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className={styles?.emptyState}>
                      No sales orders found matching your criteria.
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
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Sales Orders"
        columns={["SO-ID", "Customer", "Items", "Total Amount", "Time", "Status"]}
        data={(allOrdersForExport.length > 0 ? allOrdersForExport : orders).map((o, idx) => [
          String(o?.orderNumber || o?.soNumber || `SO-100${idx + 1}`),
          String(o?.customerType || o?.customerName || "Walk In Customer"),
          String(o?.items?.reduce((acc, item) => acc + (item?.quantity || 0), 0) || o?.quantity || 1),
          `₹${Number(o?.totalAmount || 0).toLocaleString()}`,
          formatTime(o?.createdAt || o?.orderDate),
          String(o?.status || "Pending")
        ])}
        filename="sales_orders"
      />

      <SalesOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          loadPaginatedOrders();
          loadStats();
        }}
        mode={modalMode}
        order={selectedOrder}
      />
    </DashboardLayout>
  );
}
