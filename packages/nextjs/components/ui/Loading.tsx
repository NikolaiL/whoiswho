import { cn } from "~~/styles/design-system";

interface LoadingProps {
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "ring" | "ball" | "bars";
  className?: string;
}

/**
 * Loading component with consistent styling
 * Part of the design system
 */
export function Loading({ size = "md", variant = "spinner", className }: LoadingProps) {
  const sizeClasses = {
    xs: "loading-xs",
    sm: "loading-sm",
    md: "loading-md",
    lg: "loading-lg",
  };

  const variantClasses = {
    spinner: "loading-spinner",
    dots: "loading-dots",
    ring: "loading-ring",
    ball: "loading-ball",
    bars: "loading-bars",
  };

  return <span className={cn("loading", sizeClasses[size], variantClasses[variant], className)} />;
}

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ message = "Loading...", className }: LoadingScreenProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center min-h-[400px] space-y-4", className)}>
      <Loading size="lg" />
      <p className="text-base-content/70">{message}</p>
    </div>
  );
}
