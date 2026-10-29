import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Pagination from "@/components/ui/Pagination";
import CustomSelect from "@/components/ui/CustomSelect";
import ExportDialog from "@/components/ui/ExportDialog";
import Table, { TableColumn } from "@/components/ui/Table";
import {
  fetchSalesOrdersList,
  fetchPurchaseOrdersList,
  fetchSalesOrdersPaginated,
  fetchPurchaseOrdersPaginated,
  SalesOrderItem,
  PurchaseOrderItem,
} from "@/lib/dashboardApi";
import { ASSETS } from "@/constants/assets";
import styles from "@/styles/pages/invoices.module.css";
import { FiDownload, FiSearch, FiX } from "react-icons/fi";

type InvoiceType = "sales" | "purchase";

type OrderLineItem = {
  quantity?: number;
  unitCost?: number;
  unitPrice?: number;
  productName?: string;
  product?: { productName?: string };
};

type InvoiceLineItem = {
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

type InvoiceRecord = {
  id: number | string;
  type: InvoiceType;
  invoiceNumber: string;
  referenceNumber: string;
  customerName: string;
  contactName: string;
  totalAmount: number;
  status: string;
  paymentMode: string;
  createdAt: string;
  items: InvoiceLineItem[];
};

const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const toInvoiceNumber = (id: number | string) => `INV-${String(id).padStart(4, "0")}`;

const mapOrderLineItems = (
  rawItems: unknown,
  fallback: InvoiceLineItem,
): InvoiceLineItem[] => {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (!items.length) return [fallback];

  return items.map((raw) => {
    const item = (raw ?? {}) as OrderLineItem;
    const quantity = Number(item.quantity || 0);
    const unitPrice = Number(item.unitCost ?? item.unitPrice ?? 0);
    return {
      productName: String(item.productName || item.product?.productName || fallback.productName),
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    };
  });
};

const normalizeSalesInvoices = (records: SalesOrderItem[]): InvoiceRecord[] =>
  records.map((order, index) => {
    const safeId = order.id ?? index + 1;
    const mappedItems = mapOrderLineItems(order.items, {
      productName: "Sales Item",
      quantity: Number(order.quantity || 1),
      unitPrice: Number(order.totalAmount || 0),
      total: Number(order.totalAmount || 0),
    });

    return {
      id: safeId,
      type: "sales",
      invoiceNumber: toInvoiceNumber(safeId),
      referenceNumber: String(order.orderNumber || order.soNumber || `SO-${safeId}`),
      customerName: String(order.customerName || order.customerType || "Walk in Customer"),
      contactName: String(order.customerName || order.customerType || "Walk in Customer"),
      totalAmount: Number(order.totalAmount || 0),
      status: String(order.status || "Paid"),
      paymentMode: "UPI",
      createdAt: String(order.createdAt || order.orderDate || new Date().toISOString()),
      items: mappedItems,
    };
  });

const normalizePurchaseInvoices = (records: PurchaseOrderItem[]): InvoiceRecord[] =>
  records.map((order, index) => {
    const safeId = order.id ?? index + 1;
    const mappedItems = mapOrderLineItems(order.items, {
      productName: String(order.productName || "Inventory Item"),
      quantity: Number(order.quantity || 1),
      unitPrice: Number(order.unitCost ?? order.unitPrice ?? order.totalAmount ?? 0),
      total: Number(order.totalAmount || 0),
    });

    return {
      id: safeId,
      type: "purchase",
      invoiceNumber: toInvoiceNumber(safeId),
      referenceNumber: String(order.poNumber || `PO-${safeId}`),
      customerName: String(order.vendorName || order.vendor?.vendorName || order.vendor?.companyName || "Supplier"),
      contactName: String(order.vendorName || order.vendor?.companyName || "Supplier"),
      totalAmount: Number(order.totalAmount || 0),
      status: String(order.status || "Pending"),
      paymentMode: "UPI",
      createdAt: String(order.createdAt || order.orderDate || new Date().toISOString()),
      items: mappedItems,
    };
  });

export default function InvoicesPage() {
  const [activeType, setActiveType] = useState<InvoiceType>("sales");
  const [salesInvoices, setSalesInvoices] = useState<InvoiceRecord[]>([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState<InvoiceRecord[]>([]);
  const [salesPageInvoices, setSalesPageInvoices] = useState<InvoiceRecord[]>([]);
  const [purchasePageInvoices, setPurchasePageInvoices] = useState<InvoiceRecord[]>([]);
  const [salesTotalItems, setSalesTotalItems] = useState(0);
  const [purchaseTotalItems, setPurchaseTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [tableLoading, setTableLoading] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);
  const [selectedInvoiceNumber, setSelectedInvoiceNumber] = useState<string | null>(null);

  const formatCompactCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${Number(value).toLocaleString("en-IN")}`;
  };

  const normalizeSearchValue = (value: string) => value.trim().replace(/\s+/g, " ");

  const filterInvoicesByQuery = useCallback(
    (records: InvoiceRecord[], query: string, selectedStatus: string) => {
      const normalizedQuery = normalizeSearchValue(query).toLowerCase();

      return records.filter((invoice) => {
        const searchableText = [
          invoice.invoiceNumber,
          invoice.referenceNumber,
          invoice.customerName,
          invoice.contactName,
          invoice.status,
          invoice.paymentMode,
          String(invoice.id),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery);
        const matchesStatus = selectedStatus === "All Status"
          || !invoice.status
          || invoice.status.toLowerCase() === selectedStatus.toLowerCase();

        return matchesQuery && matchesStatus;
      });
    },
    []
  );

  const summaryCards = useMemo(() => {
    const allInvoices = [...salesInvoices, ...purchaseInvoices];
    const totalInvoices = allInvoices.length;
    const today = new Date();
    const todaysInvoices = allInvoices.filter((invoice) => {
      const created = invoice.createdAt ? new Date(invoice.createdAt) : null;
      if (!created || Number.isNaN(created.getTime())) return false;
      return created.getFullYear() === today.getFullYear()
        && created.getMonth() === today.getMonth()
        && created.getDate() === today.getDate();
    }).length;

    const overallInvoiceValue = allInvoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
    const avgInvoiceValue = totalInvoices > 0 ? overallInvoiceValue / totalInvoices : 0;

    return [
      {
        title: "Total Invoices",
        value: totalInvoices.toLocaleString("en-IN"),
        subtitle: "",
        icon: ASSETS.IMAGES.INVOICE_TOTAL.src,
        tone: "blue",
      },
      {
        title: "Today's Invoices",
        value: todaysInvoices.toLocaleString("en-IN"),
        subtitle: "",
        icon: ASSETS.IMAGES.INVOICE_TODAY.src,
        tone: "green",
      },
      {
        title: "Overall Invoice value",
        value: formatCompactCurrency(overallInvoiceValue),
        subtitle: "",
        icon: ASSETS.IMAGES.INVOICE_OVERALL_VALUE.src,
        tone: "greenAlt",
      },
      {
        title: "Avg. Invoice Value",
        value: formatCompactCurrency(avgInvoiceValue),
        subtitle: "",
        icon: ASSETS.IMAGES.INVOICE_AVERAGE_VALUE.src,
        tone: "orange",
      },
    ];
  }, [salesInvoices, purchaseInvoices]);

  const loadSummaryInvoices = useCallback(() => {
    Promise.all([fetchSalesOrdersList(), fetchPurchaseOrdersList()])
      .then(([salesOrders, purchaseOrders]) => {
        const normalizedSales = normalizeSalesInvoices(salesOrders || []);
        const normalizedPurchase = normalizePurchaseInvoices(purchaseOrders || []);

        setSalesInvoices(normalizedSales);
        setPurchaseInvoices(normalizedPurchase);
      })
      .catch((error) => {
        console.error("Failed to load invoice summary records:", error);
      });
  }, []);

  const loadPageInvoices = useCallback(() => {
    let isMounted = true;
    setTableLoading(true);

    const sourceRecords = activeType === "sales" ? salesInvoices : purchaseInvoices;
    const safeSearch = normalizeSearchValue(searchQuery);
    const fallbackRecords = filterInvoicesByQuery(sourceRecords, safeSearch, statusFilter);
    const fallbackPageRecords = fallbackRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const request = activeType === "sales"
      ? fetchSalesOrdersPaginated({
          page: currentPage,
          limit: pageSize,
          search: safeSearch || undefined,
          status: statusFilter !== "All Status" ? statusFilter : undefined,
        })
      : fetchPurchaseOrdersPaginated({
          page: currentPage,
          limit: pageSize,
          search: safeSearch || undefined,
          status: statusFilter !== "All Status" ? statusFilter : undefined,
        });

    request
      .then((result) => {
        if (!isMounted) return;

        const backendRecords = activeType === "sales"
          ? normalizeSalesInvoices(result.data || [])
          : normalizePurchaseInvoices(result.data || []);

        const hasBackendResults = Array.isArray(result.data) && result.data.length > 0;
        const pageRecords = hasBackendResults
          ? backendRecords
          : fallbackPageRecords;
        const totalRecords = hasBackendResults ? (result.totalItems || backendRecords.length) : fallbackRecords.length;

        if (activeType === "sales") {
          setSalesPageInvoices(pageRecords);
          setSalesTotalItems(totalRecords);
        } else {
          setPurchasePageInvoices(pageRecords);
          setPurchaseTotalItems(totalRecords);
        }

        if (!pageRecords.length) {
          setSelectedInvoiceNumber(null);
          setIsInvoiceDetailOpen(false);
        }
      })
      .catch((error) => {
        console.error("Failed to load paginated invoice records:", error);
        const pageRecords = fallbackPageRecords;
        const totalRecords = fallbackRecords.length;

        if (activeType === "sales") {
          setSalesPageInvoices(pageRecords);
          setSalesTotalItems(totalRecords);
        } else {
          setPurchasePageInvoices(pageRecords);
          setPurchaseTotalItems(totalRecords);
        }

        setSelectedInvoiceNumber(null);
        setIsInvoiceDetailOpen(false);
      })
      .finally(() => {
        if (isMounted) setTableLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeType, currentPage, pageSize, salesInvoices, purchaseInvoices, searchQuery, statusFilter, filterInvoicesByQuery]);

  useEffect(() => {
    loadSummaryInvoices();
  }, [loadSummaryInvoices]);

  useEffect(() => {
    return loadPageInvoices();
  }, [loadPageInvoices]);

  const visibleInvoices = useMemo(() => {
    const source = activeType === "sales" ? salesPageInvoices : purchasePageInvoices;
    return filterInvoicesByQuery(source, searchQuery, statusFilter);
  }, [activeType, salesPageInvoices, purchasePageInvoices, searchQuery, statusFilter, filterInvoicesByQuery]);

  const activeHeadline = "Invoice List";
  const detailProductLabel = activeType === "sales" ? "Sold Product" : "Purchased Product";

  const handleExportButtonClick = useCallback(() => {
    if (!visibleInvoices.length) {
      toast.error("No invoice records to export.");
      return;
    }

    setIsExportOpen(true);
  }, [visibleInvoices]);

  const handleExportInvoices = useCallback(() => {
    if (!visibleInvoices.length) {
      toast.error("No invoice records to export.");
      return;
    }

    try {
      const doc = new jsPDF();
      const columnHeaders = ["Invoice No.", "Order No.", activeType === "sales" ? "Customer" : "Vendor", "Items", "Amount", "Status"];
      const rows = visibleInvoices.map((invoice) => [
        invoice.invoiceNumber,
        invoice.referenceNumber,
        invoice.customerName,
        String(invoice.items.reduce((sum, item) => sum + item.quantity, 0)),
        formatCurrency(invoice.totalAmount),
        invoice.status,
      ]);

      doc.setFont("helvetica", "bold");
      doc.text(activeHeadline, 14, 15);
      autoTable(doc, {
        head: [columnHeaders],
        body: rows,
        startY: 22,
        styles: { fontSize: 8, cellPadding: 4 },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${activeType}-invoices.pdf`);
      toast.success("Invoice PDF downloaded successfully.");
      setIsExportOpen(false);
    } catch (error) {
      console.error("Failed to export invoice PDF:", error);
      toast.error("Failed to generate invoice PDF.");
    }
  }, [activeHeadline, activeType, visibleInvoices]);

  const selectedInvoice = useMemo(
    () => visibleInvoices.find((item) => item.invoiceNumber === selectedInvoiceNumber) || null,
    [selectedInvoiceNumber, visibleInvoices],
  );

  useEffect(() => {
    if (!visibleInvoices.length) {
      setSelectedInvoiceNumber(null);
      setIsInvoiceDetailOpen(false);
      return;
    }

    if (selectedInvoiceNumber && !visibleInvoices.some((item) => item.invoiceNumber === selectedInvoiceNumber)) {
      setSelectedInvoiceNumber(null);
      setIsInvoiceDetailOpen(false);
    }
  }, [selectedInvoiceNumber, visibleInvoices]);

  const totalInvoicesCount = activeType === "sales" ? salesTotalItems : purchaseTotalItems;
  const paginatedInvoices = visibleInvoices;

  const invoiceColumns: TableColumn<InvoiceRecord>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice No.",
        className: styles.invoiceNumber,
      },
      {
        key: "referenceNumber",
        header: "Order No.",
      },
      {
        key: "customerName",
        header: activeType === "sales" ? "Customer" : "Vendor",
      },
      {
        key: "items",
        header: "Items",
        render: (invoice) => `${invoice.items.reduce((sum, item) => sum + item.quantity, 0)} items`,
      },
      {
        key: "totalAmount",
        header: "Amount",
        className: styles.amountCell,
        render: (invoice) => formatCurrency(invoice.totalAmount),
      },
      {
        key: "paymentMode",
        header: "Payment Method",
      },
      {
        key: "createdAt",
        header: "Date & Time",
        render: (invoice) =>
          new Date(invoice.createdAt).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
      },
    ],
    [activeType]
  );

  const exportRows = visibleInvoices.map((invoice) => [
    invoice.invoiceNumber,
    invoice.customerName,
    formatCurrency(invoice.totalAmount),
    invoice.status,
  ]);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <ExportDialog
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          title={activeHeadline}
          columns={["Invoice No.", "Order No.", activeType === "sales" ? "Customer" : "Vendor", "Items", "Amount", "Status"]}
          data={exportRows}
          filename={`${activeType}-invoices`}
        />

        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Invoices</h1>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.exportButton} type="button" onClick={handleExportButtonClick}>
              <FiDownload />
              Export
            </button>
            <CustomSelect
              options={[
                { label: "Sales", value: "sales" },
                { label: "Purchase", value: "purchase" },
              ]}
              value={activeType}
              onChange={(value) => {
                setActiveType(value as InvoiceType);
                setSelectedInvoiceNumber(null);
                setCurrentPage(1);
              }}
              width="160px"
              height="40px"
            />
          </div>
        </div>

        <div className={styles.summaryGrid}>
          {tableLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div key={`invoice-summary-skeleton-${index}`} className={styles.summaryCard}>
                  <div className={styles.summaryHeader}>
                    <div className={styles.summaryTitleSkeleton} />
                    <div className={styles.summaryIconSkeleton} />
                  </div>
                  <div className={styles.summaryValueSkeleton} />
                </div>
              ))
            : summaryCards.map((card) => (
                <div key={card.title} className={styles.summaryCard}>
                  <div className={styles.summaryHeader}>
                    <span className={styles.summaryTitle}>{card.title}</span>
                    <span className={`${styles.summaryIconWrap} ${styles[card.tone]}`}>
                      <Image src={card.icon} alt={card.title} width={30} height={30} className={styles.summaryIcon} />
                    </span>
                  </div>
                  <div className={styles.summaryValueRow}>
                    <span className={styles.summaryValue}>{card.value}</span>
                    {card.subtitle ? <span className={styles.summaryLabel}>{card.subtitle}</span> : null}
                  </div>
                </div>
              ))}
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeaderRow}>
            <h2 className={styles.tableTitle}>{activeHeadline}</h2>
            <div className={styles.tableControls}>
              <label className={styles.searchBox}>
                <FiSearch />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search invoice or order..."
                />
              </label>
              <select
                className={styles.filterSelect}
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All Status">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Draft">Draft</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <Table
            columns={invoiceColumns}
            data={paginatedInvoices}
            loading={tableLoading}
            skeletonRows={pageSize > 10 ? 10 : pageSize}
            rowKey={(invoice) => `${invoice.type}-${invoice.invoiceNumber}`}
            isRowSelected={(invoice) => selectedInvoice?.invoiceNumber === invoice.invoiceNumber}
            onRowClick={(invoice) => {
              setSelectedInvoiceNumber(invoice.invoiceNumber);
              setIsInvoiceDetailOpen(true);
            }}
            emptyMessage="No invoice records found for this selection."
            height="520px"
            minWidth="1000px"
          />

          <div className={styles.paginationWrap}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalInvoicesCount}
              pageSize={pageSize}
              onPageChange={(page) => setCurrentPage(page)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          </div>
        </div>

        {isInvoiceDetailOpen && selectedInvoice ? (
          <div className={styles.detailsOverlay}>
            <div className={styles.detailsPanel}>
              <div className={styles.modalHeaderTop}>
                <h2 className={styles.modalHeaderTitle}>Invoice Details</h2>
                <button
                  type="button"
                  className={styles.closeButton}
                  onClick={() => {
                    setSelectedInvoiceNumber(null);
                    setIsInvoiceDetailOpen(false);
                  }}
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
                      <h3 className={styles.orderInfoTitle}>{selectedInvoice.referenceNumber}</h3>
                      <span className={styles.badgeStatus}>{selectedInvoice.status}</span>
                    </div>
                    <span className={styles.paymentText}>Payment: <strong>{selectedInvoice.paymentMode || "NIL"}</strong></span>
                  </div>
                </div>

                <div className={styles.orderTimeBox}>
                  <span className={styles.orderTimeLabel}>Order time</span>
                  <strong className={styles.orderTimeValue}>
                    {new Date(selectedInvoice.createdAt).toLocaleString("en-US", {
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
                    <span>{activeType === "sales" ? "Invoice" : "Invoice"}</span>
                    <span>{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>{activeType === "sales" ? "Customer" : "Vendor"}</span>
                    <span>{selectedInvoice.customerName}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>{activeType === "sales" ? "Name" : "Name"}</span>
                    <span>{selectedInvoice.contactName || selectedInvoice.customerName}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Phone</span>
                    <span>{activeType === "sales" ? "9876543232" : "N/A"}</span>
                  </div>
                </div>

                <div className={styles.viewCard}>
                  <div className={styles.viewRow}>
                    <span>Items</span>
                    <span>{selectedInvoice.items.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Total Amount</span>
                    <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className={styles.viewRow}>
                    <span>Paid</span>
                    <span className={styles.paidDateValue}>
                      {selectedInvoice.status.toLowerCase() === "paid" || selectedInvoice.status.toLowerCase() === "completed"
                        ? new Date(selectedInvoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "Not yet"}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className={styles.sectionTitle}>{detailProductLabel}</h3>

              <div className={`${styles.tableHeader} ${styles.tableHeaderFourCols}`}>
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span>Total</span>
              </div>

              {selectedInvoice.items.map((item, idx) => (
                <div key={`${selectedInvoice.invoiceNumber}-${item.productName}-${idx}`} className={`${styles.productItem} ${styles.productItemFourCols}`}>
                  <div className={styles.productInfo}>
                    <h4>{item.productName}</h4>
                  </div>
                  <div className={styles.priceCol}>{formatCurrency(item.unitPrice)}</div>
                  <div className={styles.priceCol}>{item.quantity}</div>
                  <div className={styles.totalCol}>{formatCurrency(item.total)}</div>
                </div>
              ))}

              <div className={styles.billSummary}>
                <h4 className={`${styles.sectionTitleSmall}`}>Bill Summary</h4>
                <div className={styles.summaryRow}>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
                <div className={styles.summaryRow}>
                  <span>Discount:</span>
                  <span>{formatCurrency(0)}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.total}`}>
                  <span>Total:</span>
                  <span className={styles.value}>{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              <div className={styles.detailsFooter}>
                <button type="button" className={styles.primaryButton}>
                  Export
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>

    </DashboardLayout>
  );
}
