import { ReactNode } from "react";
import { cn, components, spacing } from "~~/styles/design-system";

interface CardProps {
  children: ReactNode;
  variant?: "base" | "compact" | "bordered" | "glass";
  padding?: "default" | "compact" | "large" | "none";
  hover?: boolean;
  className?: string;
  onClick?: () => void;
}

/**
 * Card component with consistent styling
 * Part of the design system
 */
export function Card({
  children,
  variant = "base",
  padding = "default",
  hover = false,
  className,
  onClick,
}: CardProps) {
  const paddingClasses = {
    default: spacing.card,
    compact: spacing.cardCompact,
    large: spacing.cardLarge,
    none: "",
  };

  return (
    <div
      className={cn(
        components.card[variant],
        paddingClasses[padding],
        hover && "transition-all duration-300 hover:shadow-xl",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function CardHeader({ title, subtitle, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-4", className)}>
      <div className="flex-1">
        <h3 className="text-xl font-bold">{title}</h3>
        {subtitle && <p className="text-sm text-base-content/70 mt-1">{subtitle}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className }: CardBodyProps) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return <div className={cn("mt-4 pt-4 border-t border-base-300", className)}>{children}</div>;
}
