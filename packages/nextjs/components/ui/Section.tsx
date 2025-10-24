import { ReactNode } from "react";
import { cn, spacing } from "~~/styles/design-system";

interface SectionProps {
  children: ReactNode;
  className?: string;
  background?: boolean;
  fullWidth?: boolean;
}

/**
 * Section component for consistent page layout
 * Part of the design system
 */
export function Section({ children, className, background = false, fullWidth = false }: SectionProps) {
  return (
    <section
      className={cn(
        spacing.section,
        background && "bg-base-200 rounded-3xl",
        !fullWidth && "container mx-auto max-w-6xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6", className)}>
      <div>
        <h2 className="text-3xl font-bold">{title}</h2>
        {subtitle && <p className="text-base-content/70 mt-2">{subtitle}</p>}
      </div>
      {action && <div className="ml-4">{action}</div>}
    </div>
  );
}
