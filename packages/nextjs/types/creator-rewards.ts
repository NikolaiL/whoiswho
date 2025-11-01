/**
 * Type definitions for Farcaster Creator Rewards API responses
 * Based on: https://client.warpcast.com/v1/creator-rewards-*
 */

export interface CreatorRewardsTier {
  size: number;
  rewardCents: number;
}

export interface CreatorRewardsMetadata {
  lastUpdateTimestamp: number;
  currentPeriodStartTimestamp: number;
  currentPeriodEndTimestamp: number;
  tiers: CreatorRewardsTier[];
}

export interface CreatorRewardsMetadataResponse {
  result: {
    metadata: CreatorRewardsMetadata;
  };
}

export interface CreatorRewardsUser {
  fid: number;
  displayName: string;
  username: string;
  followerCount: number;
  followingCount: number;
}

export interface CreatorRewardsScores {
  user: CreatorRewardsUser;
  allTimeScore: number;
  currentPeriodScore: number;
  previousPeriodScore: number;
  currentPeriodRank: number;
}

export interface CreatorRewardsScoresResponse {
  result: {
    scores: CreatorRewardsScores;
  };
}

/**
 * Calculate the USDC reward amount based on rank and tiers
 * @param rank - The user's current period rank
 * @param tiers - Array of reward tiers
 * @returns The reward amount in USDC (converted from cents)
 */
export function calculateReward(rank: number, tiers: CreatorRewardsTier[]): number {
  if (!rank || rank <= 0) return 0;

  let cumulativeSize = 0;

  for (const tier of tiers) {
    cumulativeSize += tier.size;

    // If the rank falls within this tier
    if (rank <= cumulativeSize) {
      // Convert cents to USDC
      return tier.rewardCents / 100;
    }
  }

  // If rank is beyond all tiers, no reward
  return 0;
}

/**
 * Format milliseconds timestamp to human-readable countdown
 * @param endTimestamp - End timestamp in milliseconds
 * @returns Human-readable time remaining
 */
export function formatTimeRemaining(endTimestamp: number): string {
  const now = Date.now();
  const remaining = endTimestamp - now;

  if (remaining <= 0) {
    return "Round ended";
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
