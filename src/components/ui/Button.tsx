import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline";
};

const variantClass = {
  primary: "button-primary",
  secondary: "button-secondary",
  outline: "button-outline",
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={`button-base ${variantClass[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
