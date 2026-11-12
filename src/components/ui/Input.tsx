import React, { useState } from "react";
import Image from "next/image";
import { ASSETS } from "@/constants/assets";
import styles from "./Input.module.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  wrapperClassName?: string;
  labelAction?: React.ReactNode;
};

export default function Input({
  label,
  error,
  className = "",
  wrapperClassName = "",
  type,
  labelAction,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`${styles.inputGroup} ${wrapperClassName}`.trim()}>
      <div className={styles.inputLabelRow}>
        <span className={styles.inputLabel}>{label}</span>
        {labelAction}
      </div>
      <div className={styles.inputControlWrapper}>
        <input className={`${styles.inputControl} ${className}`.trim()} type={inputType} {...props} />
        {isPassword && (
          <button
            type="button"
            className={styles.passwordToggleBtn}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            <Image {...ASSETS.LOGOS.EYE} alt={ASSETS.LOGOS.EYE.alt} />
          </button>
        )}
      </div>
      {error ? <span className={styles.errorText}>{error}</span> : null}
    </div>
  );
}
