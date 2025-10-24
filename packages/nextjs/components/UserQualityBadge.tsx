"use client";

interface UserQualityBadgeProps {
  score: number | undefined;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

/**
 * Determines the quality level of a user based on their Neynar score
 * Based on: https://docs.neynar.com/docs/neynar-user-quality-score
 *
 * Score ranges:
 * - 0.9+: Excellent (very high quality, ~2.5k accounts)
 * - 0.7-0.9: High Quality (~27.5k accounts)
 * - 0.55-0.7: Good (recommended threshold)
 * - <0.55: Low Quality (potential spam)
 */
export function getScoreQuality(score: number | undefined) {
  if (score === undefined) {
    return {
      label: "Unknown",
      color: "badge-ghost",
      description: "Score not available",
      level: "unknown" as const,
    };
  }

  if (score >= 0.9) {
    return {
      label: "Excellent",
      color: "badge-success",
      description: "Very high quality account (~2.5k accounts)",
      level: "excellent" as const,
    };
  }

  if (score >= 0.7) {
    return {
      label: "High Quality",
      color: "badge-success",
      description: "High quality account (~27.5k accounts)",
      level: "good" as const,
    };
  }

  if (score >= 0.55) {
    return {
      label: "Good",
      color: "badge-info",
      description: "Decent quality account (recommended threshold)",
      level: "decent" as const,
    };
  }

  return {
    label: "Low Quality",
    color: "badge-warning",
    description: "Below recommended threshold - potential spam",
    level: "low" as const,
  };
}

/**
 * Displays a user's Neynar quality score as a badge
 *
 * @param score - The Neynar user score (0-1)
 * @param showScore - Whether to display the numeric score (default: true)
 * @param size - Badge size (default: "md")
 *
 * @example
 * ```tsx
 * <UserQualityBadge score={0.85} />
 * <UserQualityBadge score={0.45} showScore={false} size="sm" />
 * ```
 */
export function UserQualityBadge({ score, showScore = true, size = "md" }: UserQualityBadgeProps) {
  const quality = getScoreQuality(score);

  const sizeClasses = {
    sm: "badge-sm text-xs",
    md: "badge-md",
    lg: "badge-lg text-base",
  };

  return (
    <div className="inline-flex items-center gap-2" title={quality.description}>
      {showScore && score !== undefined && <span className="font-mono font-semibold">{score.toFixed(2)}</span>}
      <span className={`badge ${quality.color} ${sizeClasses[size]}`}>{quality.label}</span>
    </div>
  );
}

/**
 * Displays detailed information about the Neynar user quality score
 * Useful for tooltips, modals, or info sections
 */
export function UserQualityScoreInfo() {
  return (
    <div className="text-sm space-y-2">
      <div>
        <h4 className="font-semibold mb-1">What is the User Quality Score?</h4>
        <p className="text-gray-600">
          The Neynar score (0-1) measures account quality based on network behavior. Higher scores indicate more
          valuable contributions to the Farcaster network.
        </p>
      </div>

      <div>
        <h4 className="font-semibold mb-1">Score Ranges:</h4>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>
            <strong>0.9+:</strong> Excellent - Very high quality (~2.5k accounts)
          </li>
          <li>
            <strong>0.7-0.9:</strong> High Quality (~27.5k accounts)
          </li>
          <li>
            <strong>0.55-0.7:</strong> Good - Recommended threshold for filtering
          </li>
          <li>
            <strong>&lt;0.55:</strong> Low Quality - Potential spam or low engagement
          </li>
        </ul>
      </div>

      <div className="pt-2 border-t">
        <p className="text-xs text-gray-500 italic">
          <strong>Note:</strong> This is NOT proof of humanity. It measures value added to the network. High-quality
          bots (like @clanker) can have high scores, while low-effort accounts have lower scores. Scores update weekly.
        </p>
      </div>
    </div>
  );
}
