import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  fetchPurchaseOrdersList, 
  PurchaseOrderItem, 
  fetchRecentActivities, 
  ActivityItem,
  fetchProductsList,
  ProductItem 
} from "@/lib/dashboardApi";
import styles from "@/styles/pages/purchaseOrders.module.css";
import Image from "next/image";
import { FiDownload, FiPlus, FiSearch } from "react-icons/fi";
import { FaAngleDown } from "react-icons/fa6";
import CreatePOModal from "@/components/dashboard/CreatePOModal";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<ProductItem[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchPurchaseOrdersList(),
      fetchRecentActivities(),
      fetchProductsList()
    ]).then(([poData, activityData, productsData]) => {
      setOrders(poData || []);
      setActivities((activityData || [])?.slice(0, 5));
      
      const lowStock = (productsData || [])?.filter(
        (p) => Number(p?.quantity || 0) <= Number(p?.lowStockLimit || 10)
      )?.slice(0, 5);
      
      setLowStockProducts(lowStock);
      setLoading(false);
    });
  }, []);

  const stats = useMemo(() => {
    const total = orders?.length || 0;
    const pending = orders?.filter((o) => o?.status?.toLowerCase() === "pending")?.length || 0;
    const completed = orders?.filter((o) => {
      const s = o?.status?.toLowerCase();
      return s === "completed" || s === "delivered" || s === "approved" || s === "shipped";
    })?.length || 0;
    const canceled = orders?.filter((o) => {
      const s = o?.status?.toLowerCase();
      return s === "canceled" || s === "cancelled";
    })?.length || 0;

    return { total, pending, completed, canceled };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let filtered = [...(orders || [])];

    if (statusFilter !== "All Status") {
      filtered = filtered?.filter(
        (o) => o?.status?.toLowerCase() === statusFilter?.toLowerCase() || (statusFilter === "Cancelled" && (o?.status?.toLowerCase() === "canceled" || o?.status?.toLowerCase() === "cancelled"))
      );
    }

    if (searchQuery) {
      const q = searchQuery?.toLowerCase();
      filtered = filtered?.filter(
        (o) =>
          o?.poNumber?.toLowerCase()?.includes(q) ||
          o?.vendorName?.toLowerCase()?.includes(q) ||
          o?.productName?.toLowerCase()?.includes(q)
      );
    }

    return filtered;
  }, [orders, statusFilter, searchQuery]);

  const getStatusBadgeClass = (status?: string) => {
    const st = status?.toLowerCase() || "pending";
    if (st === "approved") return styles?.statusApproved;
    if (st === "shipped") return styles?.statusShipped;
    if (st === "delivered" || st === "completed") return styles?.statusDelivered;
    if (st === "cancelled" || st === "canceled") return styles?.statusCancelled;
    if (st === "delayed") return styles?.statusDelayed;
    if (st === "draft") return styles?.statusDraft;
    return styles?.statusPending; // default is pending
  };
  
  const getPriority = (qty: number, limit: number) => {
    if (qty === 0) return { label: "High", className: styles?.priorityHigh };
    if (qty <= limit / 2) return { label: "Medium", className: styles?.priorityMedium };
    return { label: "Low", className: styles?.priorityLow };
  };

  return (
    <DashboardLayout>
      <div className={styles?.container}>
        {/* Header */}
        <div className={styles?.pageHeader}>
          <h1 className={styles?.pageTitle}>Purchase Order</h1>
          <div className={styles?.headerActions}>
            <button className={styles?.btnExport}>
              <FiDownload /> Export
            </button>
            <button className={styles?.btnPrimary} onClick={() => setIsModalOpen(true)}>
              <FiPlus /> Create Purchase Order
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={styles?.statsGrid}>
          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Total Purchase Orders</span>
              <div className={styles?.statIconWrapper} style={{ backgroundColor: "#2563EB" }}>
                <Image src="/images/TPO%20icon.png" alt="TPO" width={30} height={30} className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.total}</span>
              <span className={styles?.statSubtitle}>Total created POs</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Pending Orders</span>
              <div className={styles?.statIconWrapper} style={{ backgroundColor: "#16A34A" }}>
                <Image src="/images/pending%20order.png" alt="Pending" width={30} height={30} className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.pending}</span>
              <span className={styles?.statSubtitle}>Still Processing</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Completed Orders</span>
              <div className={styles?.statIconWrapper} style={{ backgroundColor: "#F59E0B" }}>
                <Image src="/images/complete%20Order.png" alt="Completed" width={30} height={30} className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.completed}</span>
              <span className={styles?.statSubtitle}>Successfully delivered</span>
            </div>
          </div>

          <div className={styles?.statCard}>
            <div className={styles?.statHeader}>
              <span className={styles?.statTitle}>Cancelled Orders</span>
              <div className={styles?.statIconWrapper} style={{ backgroundColor: "#1F2937" }}>
                <Image src="/images/cancelorder.png" alt="Cancelled" width={30} height={30} className={styles?.statIcon} />
              </div>
            </div>
            <div className={styles?.statBody}>
              <span className={styles?.statValue}>{stats?.canceled}</span>
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
                    <tr key={act?.id || i}>
                      <td>{act?.activity || "PO Created"}</td>
                      <td>{act?.sku || `PO-102${i}`}</td>
                      <td>{`Update regarding ${act?.product || 'order'}`}</td>
                      <td>{act?.time || "5 min ago"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>No recent activity.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inventory Refill Queue */}
          <div className={styles?.card}>
            <div className={styles?.cardHeader}>
              <h2 className={styles?.cardTitle}>Inventory Refill Queue</h2>
              <select className={styles?.dropdownSelect}>
                <option>All Priority</option>
              </select>
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
                {lowStockProducts?.length > 0 ? (
                  lowStockProducts?.map((p, i) => {
                    const priority = getPriority(Number(p?.quantity || 0), Number(p?.lowStockLimit || 10));
                    return (
                      <tr key={p?.id || i}>
                        <td>{p?.productName}</td>
                        <td>{p?.quantity}</td>
                        <td className={priority?.className}>{priority?.label}</td>
                        <td><button className={styles?.actionBtn}>+ PO</button></td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>No items require refill.</td>
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
                  onChange={(e) => setSearchQuery(e?.target?.value)}
                />
              </div>
              <button className={styles?.dateBtn}>
                11 Jun 2026 <FaAngleDown style={{ marginLeft: 4 }} />
              </button>
            </div>
            <div className={styles?.rightControls}>
              <button className={styles?.btnExport}>
                <FiDownload /> Export
              </button>
              <select 
                className={styles?.dropdownSelect}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e?.target?.value)}
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

          <div style={{ overflowX: "auto" }}>
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
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>Loading data...</td>
                  </tr>
                ) : filteredOrders?.length > 0 ? (
                  filteredOrders?.map((po, idx) => (
                    <tr key={String(po?.id)}>
                      <td style={{ fontWeight: 600 }}>{String(po?.poNumber || `PO-100${idx + 1}`)}</td>
                      <td>{String(po?.vendorName || po?.productName || "Unknown")}</td>
                      <td>{po?.quantity || (Math.floor(Math.random() * 20) + 1)}</td>
                      <td>₹{Number(po?.totalAmount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`${styles?.statusBadge} ${getStatusBadgeClass(po?.status)}`}>
                          {String(po?.status || "Pending")}
                        </span>
                      </td>
                      <td>
                        {po?.createdAt
                          ? new Date(po?.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Jun 14, 2026"}
                      </td>
                      <td>Jun 20, 2026</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                      No purchase orders found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className={styles?.pagination}>
            <div className={styles?.rowsPerPage}>
              Rows per page: 
              <select className={styles?.dropdownSelect} defaultValue="10">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className={styles?.pageControls}>
              <button className={styles?.pageBtnText}>&lt; Previous</button>
              <button className={`${styles?.pageBtn} ${styles?.active}`}>1</button>
              <button className={styles?.pageBtn}>2</button>
              <button className={styles?.pageBtnText}>Next &gt;</button>
            </div>
          </div>

        </div>
      </div>
      
      <CreatePOModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => fetchPurchaseOrdersList().then(d => setOrders(d || []))} 
      />
    </DashboardLayout>
  );
}
