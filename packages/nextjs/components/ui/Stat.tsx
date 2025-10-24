import { ReactNode } from "react";
import { cn, components } from "~~/styles/design-system";

interface StatProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: "up" | "down";
  className?: string;
}

/**
 * Stat component with consistent styling
 * Part of the design system
 */
export function Stat({ title, value, description, icon, trend, className }: StatProps) {
  return (
    <div className={cn(components.stat.item, className)}>
      {icon && <div className="stat-figure text-primary">{icon}</div>}
      <div className={components.stat.title}>{title}</div>
      <div className={cn(components.stat.value, trend && (trend === "up" ? "text-success" : "text-error"))}>
        {value}
      </div>
      {description && <div className={components.stat.desc}>{description}</div>}
    </div>
  );
}

interface StatsContainerProps {
  children: ReactNode;
  vertical?: boolean;
  className?: string;
}

export function StatsContainer({ children, vertical = false, className }: StatsContainerProps) {
  return (
    <div
      className={cn(
        "stats shadow-lg bg-base-100 rounded-2xl",
        vertical ? "stats-vertical" : "stats-horizontal",
        className,
      )}
    >
      {children}
    </div>
  );
}
