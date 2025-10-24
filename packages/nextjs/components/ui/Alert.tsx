import { ReactNode } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { cn, components } from "~~/styles/design-system";

interface AlertProps {
  children: ReactNode;
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  icon?: ReactNode;
  showIcon?: boolean;
  className?: string;
}

const defaultIcons = {
  info: <InformationCircleIcon className="w-6 h-6" />,
  success: <CheckCircleIcon className="w-6 h-6" />,
  warning: <ExclamationTriangleIcon className="w-6 h-6" />,
  error: <XCircleIcon className="w-6 h-6" />,
};

/**
 * Alert component with consistent styling
 * Part of the design system
 */
export function Alert({ children, variant = "info", title, icon, showIcon = true, className }: AlertProps) {
  const displayIcon = icon || (showIcon && defaultIcons[variant]);

  return (
    <div className={cn(components.alert[variant], "rounded-2xl", className)}>
      {displayIcon && <div className="shrink-0">{displayIcon}</div>}
      <div className="flex-1">
        {title && <h3 className="font-bold mb-1">{title}</h3>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}
