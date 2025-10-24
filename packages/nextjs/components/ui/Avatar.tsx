import Image from "next/image";
import { cn, components } from "~~/styles/design-system";

interface AvatarProps {
  src?: string;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
  className?: string;
  online?: boolean;
  offline?: boolean;
}

/**
 * Avatar component with consistent styling
 * Part of the design system
 */
export function Avatar({ src, alt, size = "md", fallback, className, online, offline }: AvatarProps) {
  const getStatusClass = () => {
    if (online) return "avatar online";
    if (offline) return "avatar offline";
    return "avatar";
  };

  return (
    <div className={cn(getStatusClass(), className)}>
      <div className={cn(components.avatar[size], components.avatar.rounded)}>
        {src ? (
          <Image src={src} alt={alt} width={96} height={96} className="object-cover" unoptimized />
        ) : (
          <div className="bg-neutral text-neutral-content flex items-center justify-center">
            <span className="text-lg font-semibold">{fallback || alt.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface AvatarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function AvatarGroup({ children, className }: AvatarGroupProps) {
  return <div className={cn("avatar-group -space-x-4", className)}>{children}</div>;
}
