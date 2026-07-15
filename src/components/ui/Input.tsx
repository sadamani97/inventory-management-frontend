import React, { useState } from "react";
import Image from "next/image";

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
    <div className={`input-group ${wrapperClassName}`}>
      <div className="input-label-row">
        <span className="input-label">{label}</span>
        {labelAction}
      </div>
      <div className="input-control-wrapper">
        <input className={`input-control ${className}`} type={inputType} {...props} />
        {isPassword && (
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            <Image src="/eyelogo.svg" alt="Toggle password visibility" width={20} height={20} />
          </button>
        )}
      </div>
      {error ? <span className="error-text">{error}</span> : null}
    </div>
  );
}
