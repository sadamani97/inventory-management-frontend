import React, { useEffect, useState } from "react";
import { FiX, FiUpload } from "react-icons/fi";
import styles from "./ExportDialog.module.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  columns: string[];
  data: (string | number)[][];
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
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadPDF = () => {
    if (!isConfirmed) {
      setIsConfirmed(true);
      return;
    }

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
      setIsConfirmed(false);
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleCancel = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Export {title}</h2>
          <button type="button" className={styles.closeBtn} onClick={handleCancel}>
            <FiX size={20} />
          </button>
        </div>
        <div className={styles.body}>
          <p className={styles.text}>
            {isConfirmed
              ? "Please confirm to download the PDF file for these records."
              : `You are about to export ${data.length} records. Click below to confirm and download the PDF file.`}
          </p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.downloadBtn}
              onClick={handleDownloadPDF}
            >
              <FiUpload size={16} /> {isConfirmed ? "Confirm & Download" : "Download PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
