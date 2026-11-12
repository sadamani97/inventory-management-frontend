import React from "react";
import styles from "./Button.module.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

const variantClass = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`${styles.buttonBase} ${variantClass[variant]} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
