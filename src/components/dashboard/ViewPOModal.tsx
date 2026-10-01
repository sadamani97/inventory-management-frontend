import React from "react";
import { FiX, FiUpload } from "react-icons/fi";
import styles from "./ViewPOModal.module.css";
import { PurchaseOrderItem } from "@/lib/dashboardApi";

interface ViewPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrderItem | null;
}

export default function ViewPOModal({ isOpen, onClose, order }: ViewPOModalProps) {
  if (!isOpen || !order) return null;

  const orderTime = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "N/A";

  const invoiceNum = order.poNumber?.replace("PO", "INV") || "N/A";
  const vendorName = order.vendor?.vendorName || order.vendor?.companyName || order.vendorName || "Unknown Vendor";
  const phone = (order.vendor as { phone?: string })?.phone || "N/A";

  const itemsCount =
    order.items?.reduce((acc, item) => acc + (item.quantity || 0), 0) || order.quantity || 0;
  
  const totalAmount = order.totalAmount || 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Purchase Order Details</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>

        <div className={styles.topInfo}>
          <div className={styles.poLeft}>
            <div className={styles.iconBox}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="4" y="3" width="16" height="18" rx="2" stroke="white" strokeWidth="2"/>
                <path d="M8 8H16M8 12H16M8 16H12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.poText}>
              <div className={styles.poTitleRow}>
                <span className={styles.poNum}>{order.poNumber || "N/A"}</span>
                <span className={`${styles.badge} ${styles.pendingBadge}`}>
                  {order.status || "Pending"}
                </span>
              </div>
              <div className={styles.poSubtitle}>
                Payment: <span className={styles.darkText}>NIL</span>
              </div>
            </div>
          </div>
          <div className={styles.poRight}>
            <span className={styles.orderTimeLabel}>Order time</span>
            <span className={styles.orderTimeValue}>{orderTime}</span>
          </div>
        </div>

        <div className={styles.cardsRow}>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Invoice</span>
              <span className={styles.infoValueDark}>{invoiceNum}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Vendor</span>
              <span className={styles.infoValueDark}>{vendorName}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Phone</span>
              <span className={styles.infoValueDark}>{phone}</span>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Items</span>
              <span className={styles.infoValueDark}>{itemsCount} items</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Total Amount</span>
              <span className={styles.infoValueDark}>₹{Number(totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Paid</span>
              <span className={styles.infoValueDark}>Not yet</span>
            </div>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Purchased Product</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.productTable}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item: { quantity?: number; unitPrice?: number; product?: { productName?: string } }, idx) => (
                  <tr key={idx}>
                    <td className={styles.productNameDark}>{item.product?.productName || "Product Name"}</td>
                    <td>₹{Number(item.unitPrice || 0).toLocaleString("en-IN")}</td>
                    <td>{item.quantity}</td>
                    <td>₹{Number((item.unitPrice || 0) * (item.quantity || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : order.productName || order.quantity || order.unitCost ? (
                <tr>
                  <td className={styles.productNameDark}>{order.productName || "Unknown Product"}</td>
                  <td>₹{Number(order.unitCost || 0).toLocaleString("en-IN")}</td>
                  <td>{order.quantity || 0}</td>
                  <td>₹{Number((order.unitCost || 0) * (order.quantity || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <h3 className={styles.sectionTitle}>Bill Summary</h3>
        <div className={styles.billSummary}>
          <div className={styles.billRow}>
            <span className={styles.billLabel}>Subtotal:</span>
            <span className={styles.billValue}>₹{Number(totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={styles.billRow}>
            <span className={styles.billLabel}>Discount:</span>
            <span className={styles.billValue}>0</span>
          </div>
          <div className={`${styles.billRow} ${styles.totalRow}`}>
            <span className={styles.totalLabel}>Total:</span>
            <span className={styles.totalValue}>₹{Number(totalAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.btnOutline}>
            Download
          </button>
          <button type="button" className={styles.btnPrimary}>
            <FiUpload className={styles.btnIcon} /> Export
          </button>
        </div>
      </div>
    </div>
  );
}
