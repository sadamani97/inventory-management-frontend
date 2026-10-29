import React, { useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/pages/alerts.module.css";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";
import { AlertItem, formatRelativeTime } from "@/lib/dashboardApi";
import StatusBadge from "@/components/alerts/StatusBadge";
import { FiSearch, FiMoreVertical } from "react-icons/fi";

interface AlertsTableProps {
  data: AlertItem[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onSeverityChange: (severity: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const STATUS_OPTIONS: CustomSelectOption[] = [
  { label: "All Status", value: "All" },
  { label: "Active", value: "Active" },
  { label: "Pending", value: "Pending" },
  { label: "In Transit", value: "In Transit" },
  { label: "Delayed", value: "Delayed" },
  { label: "Cancelled", value: "Cancelled" },
];

const SEVERITY_OPTIONS: CustomSelectOption[] = [
  { label: "All Severity", value: "All" },
  { label: "Critical", value: "Critical" },
  { label: "High", value: "High" },
  { label: "Medium", value: "Medium" },
  { label: "Low", value: "Low" },
];

function normalizeAlertStatusText(alertType?: string, fallbackStatus?: string): string {
  const combined = `${alertType ?? ""} ${fallbackStatus ?? ""}`.toLowerCase();

  if (combined.includes("out of stock")) return "Out of Stock";
  if (combined.includes("low stock")) return "Low Stock";
  if (combined.includes("pending delivery") || combined.includes("pending shipment")) return "Pending Delivery";
  if (combined.includes("delivered") || combined.includes("complete") || combined.includes("completed")) return "Delivered";
  if (combined.includes("delayed")) return "Delayed";
  if (combined.includes("cancelled") || combined.includes("canceled")) return "Cancelled";
  if (combined.includes("in transit")) return "In Transit";
  if (combined.includes("invoice") || combined.includes("payment")) return "Pending";
  if (combined.includes("purchase order")) return "Pending";
  if (fallbackStatus) return fallbackStatus;
  return "Active";
}

function getSeverityClass(severity?: string): string {
  const clean = (severity || "").toLowerCase();
  if (clean === "critical") return styles.severityCritical;
  if (clean === "high") return styles.severityHigh;
  if (clean === "medium") return styles.severityMedium;
  if (clean === "low") return styles.severityLow;
  return styles.severityDefault;
}

export default function AlertsTable({
  data,
  loading,
  totalItems,
  currentPage,
  pageSize,
  onSearchChange,
  onStatusChange,
  onSeverityChange,
  onPageChange,
  onPageSizeChange,
}: AlertsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);
  const router = useRouter();

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusChange(value === "All" ? "" : value);
  };

  const handleSeverityChange = (value: string) => {
    setSeverityFilter(value);
    onSeverityChange(value === "All" ? "" : value);
  };

  const handleViewDetails = (item: AlertItem) => {
    setOpenMenuId(null);
    router.push(`/alerts/${item.id}`);
  };

  return (
    <div className={styles.tablePanel}>
      <div className={styles.tableHeaderBar}>
        <div className={styles.tableTitleWrap}>
          <h2 className={styles.tableTitle}>All Alerts</h2>
        </div>

        <div className={styles.filterGroup}>
          <div className={styles.searchBox}>
            <FiSearch className={styles.searchIcon} />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by Alerts"
              className={styles.searchInput}
            />
          </div>

          <CustomSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={handleStatusChange}
            width="150px"
            height="36px"
          />
          <CustomSelect
            options={SEVERITY_OPTIONS}
            value={severityFilter}
            onChange={handleSeverityChange}
            width="150px"
            height="36px"
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.tableLoadingWrap}>
          {[...Array(5)].map((_, idx) => (
            <div key={idx} className={styles.tableSkeletonRow} />
          ))}
        </div>
      ) : (
        <>
          <div className={styles.tableScrollWrap}>
            <table className={styles.alertsTable}>
              <thead>
                <tr>
                  <th>Alerts</th>
                  <th>Related Item</th>
                  <th>Severity</th>
                  <th>Time</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.length > 0 ? (
                  data.map((item, index) => {
                    const statusText = normalizeAlertStatusText(item.alertType, item.status);

                    return (
                      <tr key={`${item.id ?? index}`}>
                        <td>{item.alertType || "Alert"}</td>
                        <td>{item.productName || item.productId || item.relatedItem || "N/A"}</td>
                        <td>
                          <span className={`${styles.severityBadge} ${getSeverityClass(item.severity)}`}>
                            {item.severity || "Medium"}
                          </span>
                        </td>
                        <td>{formatRelativeTime(item.createdAt)}</td>
                        <td>
                          <StatusBadge label={statusText} variant="solid" />
                        </td>
                        <td className={styles.actionCell}>
                          <div className={styles.actionCellWrap}>
                            <button
                              type="button"
                              className={styles.actionBtn}
                              aria-label="Alert actions"
                              onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            >
                              <FiMoreVertical size={16} />
                            </button>

                            {openMenuId === item.id && (
                              <div className={styles.actionMenu}>
                                <button type="button" onClick={() => handleViewDetails(item)}>
                                  View
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className={styles.emptyStateRow}>No alerts found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[5, 10, 15, 20]}
          />
        </>
      )}
    </div>
  );
}
