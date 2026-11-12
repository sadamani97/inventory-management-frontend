import React, { forwardRef, useRef } from "react";
import styles from "./Table.module.css";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: React.ReactNode;
  width?: string | number;
  minWidth?: string | number;
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
  /**
   * Column definitions for the table.
   */
  columns?: TableColumn<T>[];
  /**
   * Data items to render as rows.
   */
  data?: T[];
  /**
   * Whether data is currently loading (shows skeleton rows).
   */
  loading?: boolean;
  /**
   * Number of skeleton rows to show while loading (default: 10).
   */
  skeletonRows?: number;
  /**
   * Custom message or component to display when data array is empty.
   */
  emptyMessage?: React.ReactNode;
  /**
   * Callback fired when a table row is clicked.
   */
  onRowClick?: (row: T, index: number) => void;
  /**
   * Unique key extractor for each row item.
   */
  rowKey?: (row: T, index: number) => string | number;
  /**
   * Function to determine if a row should have selected highlighting.
   */
  isRowSelected?: (row: T, index: number) => boolean;
  /**
   * Function returning custom class name(s) for a row.
   */
  rowClassName?: (row: T, index: number) => string;

  /**
   * Fixed height for the table container.
   * If data exceeds this height, the container scrolls vertically.
   * If data is less, the table takes only the rows' height and the remaining container space stays empty.
   * Default: "520px"
   */
  height?: string | number;

  /**
   * Minimum width of the internal table element to enable horizontal scroll on small screens.
   * Default: "1000px"
   */
  minWidth?: string | number;

  /**
   * Optional custom children if raw table content (thead/tbody) is passed instead of columns/data.
   */
  children?: React.ReactNode;

  /**
   * Additional class name for outer container.
   */
  className?: string;

  /**
   * Additional class name for table element.
   */
  tableClassName?: string;
}

const MIN_WIDTH_CLASS_MAP: Record<string, string> = {
  "860px": styles.minWidth860,
  "1000px": styles.minWidth1000,
};

const COL_WIDTH_CLASS_MAP: Record<string, string> = {
  "110": styles.colW110,
  "110px": styles.colW110,
  "120": styles.colW120,
  "120px": styles.colW120,
  "150": styles.colW150,
  "150px": styles.colW150,
  "220": styles.colW220,
  "220px": styles.colW220,
};

function resolveColWidthClass(width?: string | number, minWidth?: string | number): string {
  const key = width ?? minWidth;
  if (key === undefined) return "";
  return COL_WIDTH_CLASS_MAP[String(key)] || "";
}

function TableInner<T = Record<string, unknown>>(
  {
    columns,
    data = [],
    loading = false,
    skeletonRows = 10,
    emptyMessage = "No records found.",
    onRowClick,
    rowKey,
    isRowSelected,
    rowClassName,
    minWidth = "1000px",
    children,
    className,
    tableClassName,
  }: TableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const headerWrapRef = useRef<HTMLDivElement>(null);
  const resolvedMinWidth = typeof minWidth === "number" ? `${minWidth}px` : minWidth;
  const minWidthClass = MIN_WIDTH_CLASS_MAP[resolvedMinWidth] || styles.minWidth1000;
  const shouldUseFixedHeight = data.length > 0 && data.length > 6;

  const containerClasses = [
    styles.container,
    shouldUseFixedHeight ? styles.fixedHeight : styles.autoHeight,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const tableClasses = [styles.table, minWidthClass, tableClassName].filter(Boolean).join(" ");

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerWrapRef.current) {
      headerWrapRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const renderEmptyState = () => {
    if (emptyMessage && typeof emptyMessage !== "string" && typeof emptyMessage !== "number") {
      return <div className={styles.emptyStateCustom}>{emptyMessage}</div>;
    }

    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" className={styles.emptyIconSvg}>
            <path d="M4.5 7.5 12 3l7.5 4.5v9L12 21l-7.5-4.5v-9Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
            <path d="M4.5 7.5 12 12l7.5-4.5M12 12v9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className={styles.emptyTitle}>{emptyMessage || "No data available"}</div>
        <div className={styles.emptySubtitle}>
          Product movement records will appear here once stock transactions are recorded for today.
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <thead>
      <tr>
        {columns?.map((col) => {
          const alignClass =
            col.align === "center"
              ? styles.alignCenter
              : col.align === "right"
              ? styles.alignRight
              : styles.alignLeft;
          const thClass = [alignClass, resolveColWidthClass(col.width, col.minWidth), col.headerClassName]
            .filter(Boolean)
            .join(" ");

          return (
            <th
              key={col.key}
              className={thClass}
            >
              {col.header}
            </th>
          );
        })}
      </tr>
    </thead>
  );

  const renderBody = () => {
    if (!columns || columns.length === 0) return null;

    return (
      <tbody>
        {loading ? (
          Array.from({ length: skeletonRows }).map((_, rIdx) => (
            <tr key={`table-skel-${rIdx}`}>
              {columns.map((col, cIdx) => (
                <td key={`table-skel-cell-${rIdx}-${cIdx}`}>
                  <div className={styles.skeletonBone} />
                </td>
              ))}
            </tr>
          ))
        ) : data.length > 0 ? (
          data.map((row, index) => {
            const key = rowKey
              ? rowKey(row, index)
              : ((row as Record<string, unknown>)?.id as string | number | undefined) ?? index;
            const selected = isRowSelected ? isRowSelected(row, index) : false;
            const customRowClass = rowClassName ? rowClassName(row, index) : "";
            const isClickable = Boolean(onRowClick);

            const trClass = [
              isClickable ? styles.clickableRow : "",
              selected ? styles.selectedRow : "",
              customRowClass,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <tr key={key} className={trClass} onClick={() => onRowClick?.(row, index)}>
                {columns.map((col) => {
                  const alignClass =
                    col.align === "center"
                      ? styles.alignCenter
                      : col.align === "right"
                      ? styles.alignRight
                      : styles.alignLeft;
                  const tdClass = [alignClass, resolveColWidthClass(col.width, col.minWidth), col.className]
                    .filter(Boolean)
                    .join(" ");
                  const content = col.render
                    ? col.render(row, index)
                    : (row as Record<string, React.ReactNode>)?.[col.key];

                  return (
                    <td
                      key={`${key}-${col.key}`}
                      className={tdClass}
                    >
                      {content}
                    </td>
                  );
                })}
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={columns.length} className={styles.emptyCell}>
              {renderEmptyState()}
            </td>
          </tr>
        )}
      </tbody>
    );
  };

  return (
    <div
      ref={ref}
      className={containerClasses}
    >
      {children ? (
        children
      ) : columns && columns.length > 0 ? (
        <>
          <div ref={headerWrapRef} className={styles.headerTableWrap}>
            <table className={tableClasses}>
              {renderHeader()}
            </table>
          </div>

          <div
            className={`${styles.bodyScroll} ${shouldUseFixedHeight ? styles.bodyScrollFixed : styles.bodyScrollAuto}`}
            onScroll={handleBodyScroll}
          >
            <table className={tableClasses}>
              {renderBody()}
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

export const Table = forwardRef(TableInner) as <T = Record<string, unknown>>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export default Table;
