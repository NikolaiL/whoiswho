/**
 * Type definitions for Quotient API responses
 * Based on: https://docs.quotient.social/reputation/quotient-score
 */

export interface QuotientUserData {
  fid: number;
  username: string;
  quotientScore: number;
  quotientScoreRaw: number;
  quotientRank: number;
  quotientProfileUrl: string;
}

export interface QuotientReputationResponse {
  data: QuotientUserData[];
  count: number;
}

export interface QuotientScoreLevel {
  level: "error" | "warning" | "success";
  label: string;
  description: string;
}

export const QUOTIENT_SCORE_TIERS: Record<string, QuotientScoreLevel> = {
  EXCEPTIONAL: {
    level: "success",
    label: "🌟 Exceptional",
    description: "Platform superstar, maximum influence",
  },
  ELITE: {
    level: "success",
    label: "⭐️ Elite",
    description: "Top-tier creator, community leader",
  },
  INFLUENTIAL: {
    level: "success",
    label: "Influential",
    description: "High-quality content, strong network",
  },
  ACTIVE: {
    level: "success",
    label: "Active",
    description: "Regular contributor, solid engagement",
  },
  CASUAL: {
    level: "warning",
    label: "Casual",
    description: "Occasional users, low engagement. Potentially spam or bot accounts.",
  },
  INACTIVE_SPAM: {
    level: "error",
    label: "Inactive OR Spam",
    description: "Can be a bot/farmer account OR just an inactive user",
  },
};

/**
 * Get the quality level based on Quotient Score
 */
export function getQuotientScoreLevel(score: number): QuotientScoreLevel {
  if (score >= 0.9) return QUOTIENT_SCORE_TIERS.EXCEPTIONAL;
  if (score >= 0.8) return QUOTIENT_SCORE_TIERS.ELITE;
  if (score >= 0.75) return QUOTIENT_SCORE_TIERS.INFLUENTIAL;
  if (score >= 0.6) return QUOTIENT_SCORE_TIERS.ACTIVE;
  if (score >= 0.5) return QUOTIENT_SCORE_TIERS.CASUAL;
  return QUOTIENT_SCORE_TIERS.INACTIVE_SPAM;
}
