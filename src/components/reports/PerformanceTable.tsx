import React, { useState } from "react";
import styles from "@/styles/pages/reports.module.css";
import { ProductPerformanceItem } from "@/lib/reportApi";
import { FiSearch } from "react-icons/fi";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import Pagination from "@/components/ui/Pagination";

interface PerformanceTableProps {
  data: ProductPerformanceItem[];
  loading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onFilterChange: (status: string) => void;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

type FilterStatus = "All" | "Fast Moving" | "Healthy" | "Low Stock" | "Critical";

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case "Fast Moving":
      return styles.statusFastMoving;
    case "Healthy":
      return styles.statusHealthy;
    case "Low Stock":
      return styles.statusLowStock;
    case "Critical":
      return styles.statusCritical;
    default:
      return styles.statusHealthy;
  }
}

function getStatusDotClass(status: string): string {
  switch (status) {
    case "Fast Moving":
      return styles.statusDotFastMoving;
    case "Healthy":
      return styles.statusDotHealthy;
    case "Low Stock":
      return styles.statusDotLowStock;
    case "Critical":
      return styles.statusDotCritical;
    default:
      return styles.statusDotHealthy;
  }
}

export default function PerformanceTable({
  data,
  loading,
  totalItems,
  currentPage,
  pageSize,
  onFilterChange,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
}: PerformanceTableProps) {
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filterOptions: CustomSelectOption[] = [
    { label: "All", value: "All" },
    { label: "Fast Moving", value: "Fast Moving" },
    { label: "Healthy", value: "Healthy" },
    { label: "Low Stock", value: "Low Stock" },
    { label: "Critical", value: "Critical" },
  ];

  const handleFilterClick = (filter: FilterStatus) => {
    setActiveFilter(filter);
    onFilterChange(filter === "All" ? "" : filter);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    onSearchChange(val);
  };

  return (
    <div className={styles.performanceSection}>
      <div className={styles.performanceHeader}>
        <h3 className={styles.performanceTitle}>Product Performance</h3>
        <div className={styles.performanceControls}>
          <div className={styles.searchInputWrapper}>
            <FiSearch className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <CustomSelect
            options={filterOptions}
            value={activeFilter}
            onChange={(val) => handleFilterClick(val as FilterStatus)}
            width="145px"
            height="36px"
          />
        </div>
      </div>

      {loading ? (
        <div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`${styles.skeleton} ${styles.skeletonRow}`} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className={styles.emptyState}>
          No products found for the selected filter.
        </div>
      ) : (
        <>
          <table className={styles.performanceTable}>
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Sold (Weekly)</th>
                <th>Current Stock</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.id}>
                  <td className={styles.productNameCell}>{item.productName}</td>
                  <td className={styles.skuCell}>{item.sku}</td>
                  <td>{item.sold}</td>
                  <td>{item.currentStock}</td>
                  <td className={styles.revenueCell}>
                    ₹ {Number(item.revenue).toLocaleString()}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${getStatusBadgeClass(item.status)}`}>
                      <span className={`${styles.statusDot} ${getStatusDotClass(item.status)}`} />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
            pageSizeOptions={[5, 10, 20]}
          />
        </>
      )}
    </div>
  );
}
