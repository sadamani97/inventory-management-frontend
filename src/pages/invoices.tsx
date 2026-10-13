import { useEffect, useState, useCallback } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { fetchInvoicesPaginated, InvoiceItem } from "@/lib/dashboardApi";
import Pagination from "@/components/ui/Pagination";
import styles from "@/styles/pages/invoices.module.css";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [totalInvoicesCount, setTotalInvoicesCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadPaginatedInvoices = useCallback(() => {
    let isMounted = true;
    setTableLoading(true);

    fetchInvoicesPaginated({
      page: currentPage,
      limit: pageSize,
    })
      .then((res) => {
        if (!isMounted) return;
        setInvoices(res.data || []);
        setTotalInvoicesCount(res.totalItems || 0);
      })
      .catch((err) => {
        console.error("Failed to load invoices:", err);
        if (isMounted) {
          setInvoices([]);
          setTotalInvoicesCount(0);
        }
      })
      .finally(() => {
        if (isMounted) setTableLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, pageSize]);

  useEffect(() => {
    return loadPaginatedInvoices();
  }, [loadPaginatedInvoices]);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Invoices
              {tableLoading && <span className={styles.loadingSpinner} />}
            </h1>
            <p className={styles.subtitle}>Billing invoices from backend database.</p>
          </div>
          <div className={styles.badge}>
            Total Invoices: {totalInvoicesCount}
          </div>
        </div>

        <div className={styles.card}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                Array.from({ length: pageSize > 10 ? 10 : pageSize }).map((_, idx) => (
                  <tr key={`inv-skel-${idx}`} className={styles.skeletonRow}>
                    <td><div className={styles.skeletonBone} style={{ width: "120px" }} /></td>
                    <td><div className={styles.skeletonBone} style={{ width: "90px" }} /></td>
                    <td><div className={styles.skeletonBone} style={{ width: "100px" }} /></td>
                    <td><div className={styles.skeletonBadge} /></td>
                  </tr>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((inv) => (
                  <tr key={String(inv.id)}>
                    <td className={styles.invoiceNum}>{String(inv.invoiceNumber || `INV-#${inv.id}`)}</td>
                    <td className={styles.amount}>₹ {Number(inv.totalAmount || 0).toLocaleString()}</td>
                    <td>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "N/A"}</td>
                    <td>
                      <span className={styles.statusPaid}>
                        {String(inv.status || "Paid")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    No invoice records stored in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ marginTop: "16px" }}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalInvoicesCount}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
