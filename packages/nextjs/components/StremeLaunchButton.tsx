"use client";

import { useMiniapp } from "./MiniappProvider";

interface StremeLaunchButtonProps {
  className?: string;
}

/**
 * Reusable button component for launching Streme tokens
 */
export function StremeLaunchButton({ className = "" }: StremeLaunchButtonProps) {
  const { openLink } = useMiniapp();

  return (
    <button
      onClick={() => openLink("https://streme.fun/launch")}
      className={`btn btn-primary w-full px-8 sm:w-auto cursor-pointer ${className}`}
    >
      Launch a Streme Token
    </button>
  );
}
