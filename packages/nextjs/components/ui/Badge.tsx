import { ReactNode } from "react";
import { cn, components } from "~~/styles/design-system";

interface BadgeProps {
  children: ReactNode;
  variant?:
    | "default"
    | "primary"
    | "secondary"
    | "accent"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "ghost"
    | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Badge component with consistent styling
 * Part of the design system
 */
export function Badge({ children, variant = "default", size = "md", className }: BadgeProps) {
  const variantClass = variant === "default" ? components.badge.default : components.badge[variant];
  const sizeClass = components.badge[size];

  return <span className={cn(variantClass, sizeClass, className)}>{children}</span>;
}
