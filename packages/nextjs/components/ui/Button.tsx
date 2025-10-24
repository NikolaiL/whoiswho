import { ReactNode } from "react";
import { cn, components } from "~~/styles/design-system";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "accent" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

/**
 * Button component with consistent styling
 * Part of the design system
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  disabled = false,
  className,
  onClick,
  type = "button",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        components.button[variant],
        components.button[size],
        fullWidth && components.button.block,
        loading && "loading",
        className,
      )}
    >
      {loading ? <span className="loading loading-spinner loading-sm" /> : children}
    </button>
  );
}
