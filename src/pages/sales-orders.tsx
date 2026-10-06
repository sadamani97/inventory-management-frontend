import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchSalesOrdersList, fetchSalesOrderStats, SalesOrderItem, SalesOrderStatsResponse } from "@/lib/dashboardApi";
import styles from "@/styles/pages/salesOrders.module.css";
import { FiDownload, FiPlus, FiSearch, FiEye, FiEdit2, FiShoppingCart, FiDollarSign, FiUsers, FiFileText } from "react-icons/fi";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";
import SalesOrderModal, { SalesOrderMode } from "@/components/dashboard/SalesOrderModal";

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState<SalesOrderItem[]>([]);
  const [stats, setStats] = useState<SalesOrderStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SalesOrderMode>("create");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderItem | null>(null);

  const loadData = () => {
    Promise.all([
      fetchSalesOrdersList(),
      fetchSalesOrderStats()
    ]).then(([ordersData, statsData]) => {
      const storedDrafts = JSON.parse(localStorage.getItem("draftSalesOrders") || "[]");
      setOrders([...storedDrafts, ...(ordersData || [])]);
      setStats(statsData);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = useMemo(() => {
    let filtered = [...(orders || [])];

    if (statusFilter !== "All Status") {
      filtered = filtered?.filter(
        (o) => o?.status?.toLowerCase() === statusFilter?.toLowerCase()
      );
    }

    if (searchQuery) {
      const q = searchQuery?.toLowerCase();
      filtered = filtered?.filter(
        (o) =>
          o?.soNumber?.toLowerCase()?.includes(q) ||
          o?.orderNumber?.toLowerCase()?.includes(q) ||
          o?.customerName?.toLowerCase()?.includes(q)
      );
    }

    return filtered;
  }, [orders, statusFilter, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders?.slice(startIndex, startIndex + pageSize) || [];
  }, [filteredOrders, currentPage, pageSize]);

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
          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Total Sales Orders</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconBlue}`}>
                <FiShoppingCart className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.totalSalesOrders?.toLocaleString() || "0"}
              </span>
              <span className={styles?.statSubtitle}>Orders Placed</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Total Order Value</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconGreen}`}>
                <FiFileText className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.totalOrderValueFormatted || "₹0"}
              </span>
              <span className={styles?.statSubtitle}>Revenue Generated</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Average Order Value</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconPurple}`}>
                <FiFileText className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.averageOrderValueFormatted || "₹0"}
              </span>
              <span className={styles?.statSubtitle}>Avg Spend/Customer</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Active Buyers</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconOrange}`}>
                <FiUsers className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.activeBuyers?.toLocaleString() || "0"}
              </span>
              <span className={styles?.statSubtitle}>Unique Customers</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className={styles?.listSection}>
          <div className={styles?.pageHeader} style={{ marginBottom: "16px" }}>
            <h2 className={styles?.cardTitle}>Orders List</h2>
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
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                />
              </div>
            </div>
            <div className={styles?.rightControls}>
              <select
                className={styles?.btnExport}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e?.target?.value)}
                style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "8px", outline: "none", backgroundColor: "var(--surface)" }}
              >
                <option value="All Status">Status: All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button className={styles?.btnExport}>See all</button>
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
                {loading ? (
                  <tr>
                    <td colSpan={7} className={styles?.loadingState}>
                      Loading sales orders...
                    </td>
                  </tr>
                ) : paginatedOrders?.length > 0 ? (
                  paginatedOrders?.map((so, idx) => {
                    const itemsCount = so?.items?.reduce((acc, item) => acc + (item?.quantity || 0), 0) || (so as any)?.quantity || 1;
                    return (
                      <tr key={String(so?.id || idx)}>
                        <td style={{ fontWeight: 600 }}>
                          {String(so?.orderNumber || so?.soNumber || `SO-100${idx + 1}`)}
                        </td>
                        <td>{String((so as any)?.customerType || so?.customerName || "Walk In Customer")}</td>
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
                            {(so?.status?.toLowerCase() === "draft" || (so as any)?.isDraft) && (
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
            totalItems={filteredOrders?.length || 0}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Sales Orders"
        columns={["SO-ID", "Customer", "Items", "Total Amount", "Time", "Status"]}
        data={filteredOrders.map((o, idx) => [
          String(o?.orderNumber || o?.soNumber || `SO-100${idx + 1}`),
          String((o as any)?.customerType || o?.customerName || "Walk In Customer"),
          String(o?.items?.reduce((acc, item) => acc + (item?.quantity || 0), 0) || (o as any)?.quantity || 1),
          `₹${Number(o?.totalAmount || 0).toLocaleString()}`,
          formatTime(o?.createdAt || o?.orderDate),
          String(o?.status || "Pending")
        ])}
        filename="sales_orders"
      />

      <SalesOrderModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        mode={modalMode}
        order={selectedOrder}
      />
    </DashboardLayout>
  );
}
