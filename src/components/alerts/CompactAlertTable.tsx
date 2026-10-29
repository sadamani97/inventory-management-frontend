import React, { ReactNode } from "react";
import CustomSelect, { CustomSelectOption } from "@/components/ui/CustomSelect";
import styles from "@/styles/pages/alerts.module.css";

export type CompactTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type CompactAlertTableProps<T> = {
  title: string;
  columns: CompactTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  loading?: boolean;
  emptyMessage: string;
  filter?: {
    value: string;
    options: CustomSelectOption[];
    onChange: (value: string) => void;
  };
};

export default function CompactAlertTable<T>({
  title,
  columns,
  rows,
  getRowKey,
  loading = false,
  emptyMessage,
  filter,
}: CompactAlertTableProps<T>) {
  return (
    <div className={styles.compactTablePanel}>
      <div className={styles.compactTableHeader}>
        <h2 className={styles.compactTableTitle}>{title}</h2>
        {filter ? (
          <CustomSelect
            options={filter.options}
            value={filter.value}
            onChange={filter.onChange}
            size="sm"
            className={styles.compactSelect}
          />
        ) : null}
      </div>

      <div className={styles.compactTableScroll}>
        {loading ? (
          <div className={styles.compactLoadingWrap}>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={`compact-skel-${index}`} className={styles.compactSkeletonRow} />
            ))}
          </div>
        ) : (
          <table className={styles.compactTable}>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, index) => (
                  <tr key={getRowKey(row, index)}>
                    {columns.map((column) => (
                      <td key={`${getRowKey(row, index)}-${column.key}`}>{column.render(row)}</td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className={styles.emptyStateRow}>
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
