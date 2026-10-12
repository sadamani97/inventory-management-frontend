import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { SalesOrderItem, deleteSalesOrder } from "@/lib/dashboardApi";
import styles from "@/styles/pages/salesOrders.module.css";
import { FiDownload, FiPlus, FiSearch, FiEye, FiEdit2, FiShoppingCart, FiDollarSign, FiUsers, FiFileText, FiTrash2 } from "react-icons/fi";
import Pagination from "@/components/ui/Pagination";
import ExportDialog from "@/components/ui/ExportDialog";
import SalesOrderModal, { SalesOrderMode } from "@/components/dashboard/SalesOrderModal";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchSalesOrdersThunk,
  fetchSalesOrderStatsThunk,
  setCurrentPage,
  setPageSize,
  setSearchQuery,
  setStatusFilter,
} from "@/store/salesOrderSlice";

export default function SalesOrdersPage() {
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
  } = useAppSelector((state) => state.salesOrders);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<SalesOrderMode>("create");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderItem | null>(null);

  // Fetch paginated sales orders when page, pageSize, statusFilter, or searchQuery changes
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(fetchSalesOrdersThunk());
    }, searchQuery ? 300 : 0);

    return () => clearTimeout(timer);
  }, [dispatch, currentPage, pageSize, statusFilter, searchQuery]);

  // Fetch stats on mount
  useEffect(() => {
    dispatch(fetchSalesOrderStatsThunk());
  }, [dispatch]);

  const handleDeleteDraft = async (id: number | string) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      const res = await deleteSalesOrder(id);
      if (res?.success) {
        toast.success("Draft deleted successfully");
        dispatch(fetchSalesOrdersThunk());
        dispatch(fetchSalesOrderStatsThunk());
      }
    }
  };

  const handleRefresh = () => {
    dispatch(fetchSalesOrdersThunk());
    dispatch(fetchSalesOrderStatsThunk());
  };

  const getStatusBadgeClass = (status?: string) => {
    const st = status?.toLowerCase() ?? "draft";
    if (st === "paid" || st === "completed" || st === "delivered") return styles?.statusPaid;
    if (st === "cancelled" || st === "failed") return styles?.statusCancelled;
    if (st === "pending") return styles?.statusPending;
    return styles?.statusDraft;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
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
                {stats?.totalSalesOrders?.toLocaleString() ?? stats?.totalOrders?.toLocaleString() ?? "0"}
              </span>
              <span className={styles?.statSubtitle}>Total Orders</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Total Revenue</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconGreen}`}>
                <FiDollarSign className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.totalOrderValueFormatted ?? `₹${Number(stats?.totalOrderValue ?? 0).toLocaleString()}`}
              </span>
              <span className={styles?.statSubtitle}>From Paid Orders</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Pending Orders</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconOrange}`}>
                <FiFileText className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.pendingOrders?.toLocaleString() ?? "0"}
              </span>
              <span className={styles?.statSubtitle}>Awaiting Payment</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Active Buyers</span>
              <div className={`${styles?.statIconWrapper} ${styles?.iconPurple}`}>
                <FiUsers className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>
                {stats?.activeBuyers?.toLocaleString() ?? "0"}
              </span>
              <span className={styles?.statSubtitle}>Unique Customers</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className={styles?.listSection}>
          <div className={`${styles?.pageHeader} ${styles?.subHeader}`}>
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
                  onChange={(e) => dispatch(setSearchQuery(e?.target?.value))}
                />
              </div>
            </div>
            <div className={styles?.rightControls}>
              <select
                className={styles?.filterSelect}
                value={statusFilter}
                onChange={(e) => dispatch(setStatusFilter(e?.target?.value))}
              >
                <option value="All Status">Status: All</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              <button
                className={styles?.btnExport}
                onClick={() => {
                  dispatch(setStatusFilter("All Status"));
                  dispatch(setSearchQuery(""));
                }}
              >
                Reset filters
              </button>
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
                ) : orders?.length > 0 ? (
                  orders?.map((so, idx) => {
                    const itemsCount =
                      so?.items?.reduce((acc, item) => acc + (item?.quantity ?? 0), 0) ??
                      so?.quantity ??
                      1;
                    return (
                      <tr key={String(so?.id ?? idx)}>
                        <td className={styles?.boldCell}>
                          {String(so?.orderNumber ?? so?.soNumber ?? `SO-100${idx + 1}`)}
                        </td>
                        <td>{String(so?.customerType ?? so?.customerName ?? "Walk In Customer")}</td>
                        <td>{itemsCount} items</td>
                        <td className={styles?.boldCell}>
                          ₹{Number(so?.totalAmount ?? 0).toLocaleString()}
                        </td>
                        <td>{formatTime(so?.createdAt ?? so?.orderDate)}</td>
                        <td>
                          <span className={`${styles?.statusBadge} ${getStatusBadgeClass(so?.status)}`}>
                            {String(so?.status ?? "Pending")}
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
            totalItems={totalOrders}
            pageSize={pageSize}
            onPageChange={(page) => dispatch(setCurrentPage(page))}
            onPageSizeChange={(size) => dispatch(setPageSize(size))}
            pageSizeOptions={[10, 20, 50]}
          />
        </div>
      </div>

      <ExportDialog
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        title="Sales Orders"
        columns={["SO-ID", "Customer", "Items", "Total Amount", "Time", "Status"]}
        data={orders?.map((o, idx) => [
          String(o?.orderNumber ?? o?.soNumber ?? `SO-100${idx + 1}`),
          String(o?.customerType ?? o?.customerName ?? "Walk In Customer"),
          String(o?.items?.reduce((acc, item) => acc + (item?.quantity ?? 0), 0) ?? o?.quantity ?? 1),
          `₹${Number(o?.totalAmount ?? 0).toLocaleString()}`,
          formatTime(o?.createdAt ?? o?.orderDate),
          String(o?.status ?? "Pending"),
        ])}
        filename="sales_orders"
      />

      <SalesOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
        mode={modalMode}
        order={selectedOrder}
      />
    </DashboardLayout>
  );
}
