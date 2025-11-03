import { useCallback, useEffect, useState } from "react";
import type { TalentProtocolData } from "~~/types/talent-protocol";

interface UseTalentProtocolOptions {
  fid: number | null;
  enabled?: boolean;
}

interface UseTalentProtocolResult {
  data: TalentProtocolData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Talent Protocol data from our API endpoint
 *
 * Fetches user Talent Protocol information including:
 * - Builder Score (points and rank)
 * - Creator Score (points and rank)
 * - Profile ID
 *
 * @param options - Configuration options
 * @param options.fid - The Farcaster ID to fetch
 * @param options.enabled - Whether to automatically fetch (default: true)
 *
 * @returns Talent Protocol data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useTalentProtocol({ fid: 366713 });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (data?.builderScore) {
 *   return (
 *     <div>
 *       Builder Score: {data.builderScore.points}
 *       Rank: #{data.builderScore.rank}
 *     </div>
 *   );
 * }
 * ```
 */
export function useTalentProtocol({ fid, enabled = true }: UseTalentProtocolOptions): UseTalentProtocolResult {
  const [data, setData] = useState<TalentProtocolData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTalentProtocol = useCallback(async () => {
    if (!fid) {
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ fid: fid.toString() });
      const response = await fetch(`/api/talent-protocol?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch Talent Protocol data");
      }

      const responseData: TalentProtocolData = await response.json();
      setData(responseData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching Talent Protocol data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    if (enabled && fid) {
      fetchTalentProtocol();
    }
  }, [fid, enabled, fetchTalentProtocol]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTalentProtocol,
  };
}
