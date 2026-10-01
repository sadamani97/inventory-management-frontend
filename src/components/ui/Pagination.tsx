import React from "react";
import styles from "./Pagination.module.css";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export default function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.leftSection}>
        {onPageSizeChange && (
          <div className={styles.pageSizeWrapper}>
            <span className={styles.pageSizeLabel}>Rows per page</span>
            <div className={styles.selectWrapper}>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1); // Reset to first page
                }}
                className={styles.pageSizeSelect}
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className={styles.rightSection}>
        <div className={styles.pageButtons}>
          <button
            type="button"
            className={`${styles.navBtn} ${currentPage === 1 ? styles.disabled : ""}`}
            onClick={handlePrev}
            disabled={currentPage === 1}
          >
            <FiChevronLeft className={styles.navIcon} /> Previous
          </button>
          
          <div className={styles.pageNumbersGroup}>
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={`${styles.numBtn} ${currentPage === page ? styles.active : ""}`}
                onClick={() => onPageChange(page)}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            type="button"
            className={`${styles.navBtn} ${currentPage === totalPages ? styles.disabled : ""}`}
            onClick={handleNext}
            disabled={currentPage === totalPages}
          >
            Next <FiChevronRight className={styles.navIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
