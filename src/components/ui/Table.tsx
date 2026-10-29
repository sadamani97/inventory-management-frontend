import React, { forwardRef } from "react";
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

  /**
   * Additional inline styles for outer container.
   */
  style?: React.CSSProperties;
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
    height = "520px",
    minWidth = "1000px",
    children,
    className,
    tableClassName,
    style,
  }: TableProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const resolvedHeight = typeof height === "number" ? `${height}px` : height;
  const resolvedMinWidth = typeof minWidth === "number" ? `${minWidth}px` : minWidth;

  const containerClasses = [styles.container, className].filter(Boolean).join(" ");
  const tableClasses = [styles.table, tableClassName].filter(Boolean).join(" ");

  return (
    <div
      ref={ref}
      className={containerClasses}
      style={{
        height: resolvedHeight,
        minHeight: resolvedHeight,
        maxHeight: resolvedHeight,
        ...style,
      }}
    >
      <table className={tableClasses} style={{ minWidth: resolvedMinWidth }}>
        {children ? (
          children
        ) : columns && columns.length > 0 ? (
          <>
            <thead>
              <tr>
                {columns.map((col) => {
                  const alignClass =
                    col.align === "center"
                      ? styles.alignCenter
                      : col.align === "right"
                      ? styles.alignRight
                      : styles.alignLeft;
                  const thClass = [alignClass, col.headerClassName].filter(Boolean).join(" ");

                  return (
                    <th
                      key={col.key}
                      style={{ width: col.width, minWidth: col.minWidth }}
                      className={thClass}
                    >
                      {col.header}
                    </th>
                  );
                })}
              </tr>
            </thead>
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
                    <tr
                      key={key}
                      className={trClass}
                      onClick={() => onRowClick?.(row, index)}
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === "center"
                            ? styles.alignCenter
                            : col.align === "right"
                            ? styles.alignRight
                            : styles.alignLeft;
                        const tdClass = [alignClass, col.className].filter(Boolean).join(" ");
                        const content = col.render
                          ? col.render(row, index)
                          : (row as Record<string, React.ReactNode>)?.[col.key];

                        return (
                          <td
                            key={`${key}-${col.key}`}
                            style={{ width: col.width, minWidth: col.minWidth }}
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
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </>
        ) : null}
      </table>
    </div>
  );
}

export const Table = forwardRef(TableInner) as <T = Record<string, unknown>>(
  props: TableProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => React.ReactElement;

export default Table;
