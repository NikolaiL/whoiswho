"use client";

import { useMiniapp } from "./MiniappProvider";

interface ClankerDeployButtonProps {
  className?: string;
}

/**
 * Reusable button component for deploying Clanker tokens
 */
export function ClankerDeployButton({ className = "" }: ClankerDeployButtonProps) {
  const { openLink } = useMiniapp();

  return (
    <button
      onClick={() => openLink("https://clanker.world/deploy")}
      className={`btn btn-primary w-full px-8 sm:w-auto cursor-pointer ${className}`}
    >
      Create a Clanker
    </button>
  );
}
