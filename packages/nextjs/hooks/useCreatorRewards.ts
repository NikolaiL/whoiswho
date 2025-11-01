import { useCallback, useEffect, useState } from "react";
import type { CreatorRewardsMetadata, CreatorRewardsScores } from "~~/types/creator-rewards";

interface UseCreatorRewardsOptions {
  fid: number | null;
  enabled?: boolean;
}

interface CreatorRewardsData {
  scores: CreatorRewardsScores | null;
  metadata: CreatorRewardsMetadata | null;
}

interface UseCreatorRewardsResult {
  data: CreatorRewardsData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Farcaster Creator Rewards data from our API endpoint
 *
 * Fetches user creator rewards information including:
 * - Current period score and rank
 * - All-time and previous period scores
 * - Current period metadata (start, end, tiers)
 *
 * @param options - Configuration options
 * @param options.fid - The Farcaster ID to fetch
 * @param options.enabled - Whether to automatically fetch (default: true)
 *
 * @returns Creator rewards data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCreatorRewards({ fid: 3 });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (data?.scores) {
 *   return (
 *     <div>
 *       Score: {data.scores.currentPeriodScore}
 *       Rank: #{data.scores.currentPeriodRank}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCreatorRewards({ fid, enabled = true }: UseCreatorRewardsOptions): UseCreatorRewardsResult {
  const [data, setData] = useState<CreatorRewardsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCreatorRewards = useCallback(async () => {
    if (!fid) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ fid: fid.toString() });
      const response = await fetch(`/api/creator-rewards?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch creator rewards");
      }

      const responseData = await response.json();
      setData(responseData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching creator rewards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    if (enabled && fid) {
      fetchCreatorRewards();
    }
  }, [fid, enabled, fetchCreatorRewards]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCreatorRewards,
  };
}
