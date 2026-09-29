import React, { ReactNode } from "react";
import { toast } from "react-toastify";
import styles from "./CustomToast.module.css";

interface CustomToastProps {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

export const CustomToast = ({ title, subtitle, icon }: CustomToastProps) => {
  return (
    <div className={styles.toastContainer}>
      <div className={styles.iconWrapper}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.subtitle}>{subtitle}</p>
    </div>
  );
};

export const showSuccessToast = (title: string, subtitle: string, icon: ReactNode) => {
  toast(<CustomToast title={title} subtitle={subtitle} icon={icon} />, {
    className: styles.toastWrapper,
    closeButton: false,
    hideProgressBar: true,
    autoClose: 3500,
    position: "top-center",
    style: {
      width: "429px",
      marginTop: "25vh"
    }
  });
};
