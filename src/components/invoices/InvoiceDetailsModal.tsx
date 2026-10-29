import React from "react";
import Image from "next/image";
import { FiX } from "react-icons/fi";
import StatusBadge from "@/components/ui/StatusBadge";
import { ASSETS } from "@/constants/assets";
import styles from "./InvoiceDetailsModal.module.css";

export type InvoiceLineItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type InvoiceRecord = {
  id: number | string;
  type: "sales" | "purchase";
  invoiceNumber: string;
  referenceNumber: string;
  customerName: string;
  contactName: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  createdAt: string;
  phone?: string;
  discount?: number;
  items: InvoiceLineItem[];
};

interface InvoiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRecord | null;
  invoiceType: "sales" | "purchase";
  onExport?: (invoice: InvoiceRecord) => void;
  formatCurrency: (value: number) => string;
}

export default function InvoiceDetailsModal({
  isOpen,
  onClose,
  invoice,
  invoiceType,
  onExport,
  formatCurrency,
}: InvoiceDetailsModalProps) {
  if (!isOpen || !invoice) return null;

  const detailProductLabel = invoiceType === "sales" ? "Sold Product" : "Purchased Product";
  const partyLabel = invoiceType === "sales" ? "Customer" : "Vendor";
  const totalItemCount = invoice.items.reduce((sum, item) => sum + item.quantity, 0);
  const isPaid = invoice.status.toLowerCase() === "paid" || invoice.status.toLowerCase() === "completed";
  const discountAmount = invoice.discount ?? 0;

  return (
    <div className={styles.detailsOverlay} onClick={onClose}>
      <div className={styles.detailsPanel} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className={styles.modalHeaderTop}>
          <h2 className={styles.modalHeaderTitle}>Invoice Details</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close invoice details"
          >
            <FiX />
          </button>
        </div>

        <div className={styles.orderInfoBlock}>
          <div className={styles.orderInfoLeft}>
            <div className={styles.orderIconWrap}>
              <Image {...ASSETS.IMAGES.INVOICE_COLLACATION_LOGO} alt="Invoice logo" />
            </div>
            <div className={styles.orderInfoDetails}>
              <div className={styles.orderInfoTitleRow}>
                <h3 className={styles.orderInfoTitle}>{invoice.referenceNumber}</h3>
                <StatusBadge label={invoice.status} variant="solid" />
              </div>
              <span className={styles.paymentText}>
                Payment: <strong>{invoice.paymentMode || "Unspecified"}</strong>
              </span>
            </div>
          </div>

          <div className={styles.orderTimeBox}>
            <span className={styles.orderTimeLabel}>Order time</span>
            <strong className={styles.orderTimeValue}>
              {new Date(invoice.createdAt).toLocaleString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </strong>
          </div>
        </div>

        <div className={styles.viewModeGrid}>
          <div className={styles.viewCard}>
            <div className={styles.viewRow}>
              <span>Invoice</span>
              <span>{invoice.invoiceNumber}</span>
            </div>
            <div className={styles.viewRow}>
              <span>{partyLabel}</span>
              <span>{invoice.customerName}</span>
            </div>
            <div className={styles.viewRow}>
              <span>Contact</span>
              <span>{invoice.contactName || invoice.customerName}</span>
            </div>
            <div className={styles.viewRow}>
              <span>Phone</span>
              <span>{invoice.phone || "—"}</span>
            </div>
          </div>

          <div className={styles.viewCard}>
            <div className={styles.viewRow}>
              <span>Items</span>
              <span>{totalItemCount} items</span>
            </div>
            <div className={styles.viewRow}>
              <span>Total Amount</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
            <div className={styles.viewRow}>
              <span>Paid</span>
              <span className={styles.paidDateValue}>
                {isPaid
                  ? new Date(invoice.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>{detailProductLabel}</h3>

        <div className={styles.tableHeader}>
          <span>Product</span>
          <span>Price</span>
          <span>Quantity</span>
          <span>Total</span>
        </div>

        {invoice.items.map((item, idx) => (
          <div
            key={`${invoice.invoiceNumber}-${item.productName}-${idx}`}
            className={styles.productItem}
          >
            <div className={styles.productInfo}>
              <h4>{item.productName}</h4>
            </div>
            <div className={styles.priceCol}>{formatCurrency(item.unitPrice)}</div>
            <div className={styles.priceCol}>{item.quantity}</div>
            <div className={styles.totalCol}>{formatCurrency(item.total)}</div>
          </div>
        ))}

        <div className={styles.billSummary}>
          <h4 className={styles.sectionTitleSmall}>Bill Summary</h4>
          <div className={styles.summaryRow}>
            <span>Subtotal:</span>
            <span>{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Discount:</span>
            <span>{formatCurrency(discountAmount)}</span>
          </div>
          <div className={`${styles.summaryRow} ${styles.total}`}>
            <span>Total:</span>
            <span className={styles.value}>{formatCurrency(invoice.totalAmount - discountAmount)}</span>
          </div>
        </div>

        <div className={styles.detailsFooter}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onExport?.(invoice)}
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
