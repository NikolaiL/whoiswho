/**
 * Design System Tokens & Utilities for Farcaster MiniApp
 *
 * Provides consistent styling patterns across the application
 * using DaisyUI and TailwindCSS
 */

// === SPACING ===
export const spacing = {
  section: "px-4 py-6 md:px-6 md:py-8",
  card: "p-4 md:p-6",
  cardCompact: "p-3 md:p-4",
  cardLarge: "p-6 md:p-8",
  gap: {
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  },
} as const;

// === TYPOGRAPHY ===
export const typography = {
  h1: "text-3xl md:text-4xl font-bold",
  h2: "text-2xl md:text-3xl font-bold",
  h3: "text-xl md:text-2xl font-semibold",
  h4: "text-lg md:text-xl font-semibold",
  body: "text-base",
  bodySmall: "text-sm",
  caption: "text-xs text-base-content/70",
  mono: "font-mono",
} as const;

// === COMPONENTS ===
export const components = {
  // Cards
  card: {
    base: "card bg-base-100 shadow-lg rounded-2xl",
    compact: "card bg-base-100 shadow-md rounded-xl",
    bordered: "card bg-base-100 border-2 border-base-300 rounded-2xl",
    glass: "card bg-base-100/80 backdrop-blur-sm shadow-lg rounded-2xl",
  },

  // Buttons
  button: {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    accent: "btn btn-accent",
    ghost: "btn btn-ghost",
    outline: "btn btn-outline",
    sm: "btn btn-sm",
    md: "btn btn-md",
    lg: "btn btn-lg",
    block: "btn btn-block",
  },

  // Badges
  badge: {
    default: "badge",
    primary: "badge badge-primary",
    secondary: "badge badge-secondary",
    accent: "badge badge-accent",
    success: "badge badge-success",
    warning: "badge badge-warning",
    error: "badge badge-error",
    info: "badge badge-info",
    ghost: "badge badge-ghost",
    outline: "badge badge-outline",
    lg: "badge badge-lg",
    md: "badge badge-md",
    sm: "badge badge-sm",
  },

  // Inputs
  input: {
    base: "input input-bordered w-full",
    primary: "input input-bordered input-primary w-full",
    ghost: "input input-ghost w-full",
    sm: "input input-sm",
    md: "input input-md",
    lg: "input input-lg",
  },

  // Alerts
  alert: {
    info: "alert alert-info",
    success: "alert alert-success",
    warning: "alert alert-warning",
    error: "alert alert-error",
  },

  // Avatars
  avatar: {
    base: "avatar",
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
    rounded: "rounded-full",
  },

  // Stats
  stat: {
    container: "stats stats-vertical md:stats-horizontal shadow-lg bg-base-100 rounded-2xl",
    item: "stat",
    title: "stat-title",
    value: "stat-value",
    desc: "stat-desc",
  },
} as const;

// === LAYOUT UTILITIES ===
export const layout = {
  container: "container mx-auto max-w-7xl",
  containerSmall: "container mx-auto max-w-4xl",
  containerLarge: "container mx-auto max-w-screen-2xl",
  centerContent: "flex items-center justify-center",
  stack: "flex flex-col",
  row: "flex flex-row items-center",
  grid: {
    cols1: "grid grid-cols-1",
    cols2: "grid grid-cols-1 md:grid-cols-2",
    cols3: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    cols4: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  },
} as const;

// === ANIMATION ===
export const animation = {
  fadeIn: "animate-fade-in",
  slideUp: "animate-slide-up",
  pulse: "animate-pulse",
  spin: "animate-spin",
  bounce: "animate-bounce",
  transition: {
    fast: "transition-all duration-150 ease-in-out",
    normal: "transition-all duration-300 ease-in-out",
    slow: "transition-all duration-500 ease-in-out",
  },
} as const;

// === HELPER FUNCTIONS ===

/**
 * Combines class names conditionally
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Creates responsive spacing
 */
export function responsiveSpacing(mobile: number, desktop: number): string {
  return `p-${mobile} md:p-${desktop}`;
}

// === PRESET COMBINATIONS ===
export const presets = {
  // Common card patterns
  profileCard: cn(components.card.base, spacing.card, animation.transition.normal, "hover:shadow-xl"),

  statCard: cn(components.card.compact, spacing.cardCompact, "text-center"),

  // User list item
  userListItem: cn(
    "flex items-center justify-between",
    spacing.cardCompact,
    "bg-base-100 rounded-xl border border-base-300",
    animation.transition.fast,
    "hover:border-primary hover:shadow-md",
  ),

  // Section container
  section: cn(spacing.section, "bg-base-200 rounded-3xl"),

  // Modal content
  modal: cn("modal-box", spacing.cardLarge, "max-w-2xl"),

  // Info box
  infoBox: cn("bg-base-200 rounded-xl", spacing.card, "border-l-4 border-primary"),
} as const;

// === MINIAPP-SPECIFIC PATTERNS ===
export const miniappPatterns = {
  // User score display
  scoreContainer: cn("bg-base-200 rounded-xl", spacing.card, "border-2 border-base-300"),

  // User profile header
  profileHeader: cn("flex items-start gap-4", "p-4 bg-gradient-to-r from-base-200 to-base-100 rounded-2xl"),

  // Status badge container
  statusBadges: cn("flex flex-wrap items-center gap-2"),

  // Verification badge
  verifiedBadge: cn(components.badge.success, components.badge.sm, "gap-1"),

  // Social stats
  socialStats: cn("grid grid-cols-2 gap-4", "p-4 bg-base-200 rounded-xl"),
} as const;

// === TYPE EXPORTS ===
export type ButtonVariant = keyof typeof components.button;
export type BadgeVariant = keyof typeof components.badge;
export type CardVariant = keyof typeof components.card;
export type AlertVariant = keyof typeof components.alert;
