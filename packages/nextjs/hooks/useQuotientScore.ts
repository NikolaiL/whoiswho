import { useCallback, useEffect, useState } from "react";
import type { QuotientReputationResponse, QuotientUserData } from "~~/types/quotient";

interface UseQuotientScoreOptions {
  fid: number | null;
  enabled?: boolean;
}

interface UseQuotientScoreResult {
  data: QuotientUserData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Quotient Score data from our API endpoint
 *
 * Fetches user reputation metrics including:
 * - Quotient Score (momentum and relevance based on engagement)
 * - Quotient Score Raw (unprocessed score)
 * - Quotient Rank (ranking among all Farcaster users)
 * - Quotient Profile URL (link to Quotient profile)
 *
 * @param options - Configuration options
 * @param options.fid - The Farcaster ID to fetch
 * @param options.enabled - Whether to automatically fetch (default: true)
 *
 * @returns Quotient score data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useQuotientScore({ fid: 3 });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (data) {
 *   return (
 *     <div>
 *       Quotient Score: {data.quotientScore.toFixed(2)}
 *       Rank: #{data.quotientRank.toLocaleString()}
 *     </div>
 *   );
 * }
 * ```
 */
export function useQuotientScore({ fid, enabled = true }: UseQuotientScoreOptions): UseQuotientScoreResult {
  const [data, setData] = useState<QuotientUserData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuotientScore = useCallback(async () => {
    if (!fid) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ fid: fid.toString() });
      const response = await fetch(`/api/quotient-score?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch quotient score");
      }

      const responseData: QuotientReputationResponse = await response.json();

      // Extract the first user from the response
      if (responseData.data && responseData.data.length > 0) {
        setData(responseData.data[0]);
      } else {
        throw new Error("No quotient score data found for this user");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching quotient score:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    if (enabled && fid) {
      fetchQuotientScore();
    }
  }, [fid, enabled, fetchQuotientScore]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchQuotientScore,
  };
}
