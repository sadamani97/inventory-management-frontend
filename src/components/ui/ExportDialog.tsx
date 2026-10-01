import React from "react";
import { FiX, FiDownload } from "react-icons/fi";
import styles from "./ExportDialog.module.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: string[];
  data: any[][];
  filename: string;
}

export default function ExportDialog({
  isOpen,
  onClose,
  title,
  columns,
  data,
  filename,
}: ExportDialogProps) {
  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text(title, 14, 15);
      autoTable(doc, {
        head: [columns],
        body: data,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });
      doc.save(`${filename}.pdf`);
      toast.success("PDF downloaded successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Export {title}</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.text}>
            You are about to export <strong>{data.length}</strong> records. Click below to download the data as a PDF document.
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadPDF}
            >
              <FiDownload size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
