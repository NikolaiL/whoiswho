/**
 * Profile Metrics Utilities
 * Helper functions for calculating and categorizing user profile metrics
 */

export type FlagLevel = "green" | "yellow" | "red";

/**
 * Calculate follower ratio and determine flag level
 * @param followers - Number of followers
 * @param following - Number of accounts following
 * @returns Ratio, flag level, and display string
 */
export function calculateFollowerRatio(
  followers: number,
  following: number,
): {
  ratio: number;
  level: FlagLevel;
  display: string;
} {
  // Handle edge cases
  if (following === 0) {
    return {
      ratio: followers > 0 ? Infinity : 0,
      level: "green",
      display: `${followers.toLocaleString()} / ${following.toLocaleString()}`,
    };
  }

  const ratio = followers / following;

  // Determine flag level based on thresholds
  let level: FlagLevel;
  if (ratio >= 0.8) {
    level = "green"; // Low Risk
  } else if (ratio >= 0.2) {
    level = "yellow"; // Medium Risk
  } else {
    level = "red"; // High Risk
  }

  return {
    ratio,
    level,
    display: `${followers.toLocaleString()} / ${following.toLocaleString()}`,
  };
}

/**
 * Parse spam label and determine flag level
 * @param label - Spam label string (e.g., "2 (unlikely to engage in spammy behavior)")
 * @returns Score number, flag level, and text
 */
export function parseSpamLabel(label: string): {
  score: number;
  level: FlagLevel;
  text: string;
} {
  // Extract the number from the label (should be at the start)
  const match = label.match(/^(\d+)/);
  const score = match ? parseInt(match[1]) : 0;

  // Determine flag level based on score
  let level: FlagLevel;
  if (score === 2) {
    level = "green";
  } else if (score === 1) {
    level = "yellow";
  } else {
    level = "red";
  }

  return {
    score,
    level,
    text: label,
  };
}

/**
 * Get Neynar score flag level
 * @param score - Neynar user score (0-1 scale)
 * @returns Flag level
 */
export function getNeynarScoreLevel(score: number): FlagLevel {
  if (score >= 0.7) {
    return "green"; // Low Risk
  } else if (score >= 0.55) {
    return "yellow"; // Medium Risk
  } else {
    return "red"; // High Risk
  }
}
