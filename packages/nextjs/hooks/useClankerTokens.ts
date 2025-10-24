import { useCallback, useEffect, useState } from "react";
import type { ClankerToken } from "~~/types/clanker";

interface UseClankerTokensOptions {
  fid: number | null;
  enabled?: boolean;
}

interface UseClankerTokensResult {
  tokens: ClankerToken[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Clanker tokens deployed by a user
 *
 * @param options - Configuration options
 * @param options.fid - The Farcaster ID to fetch tokens for
 * @param options.enabled - Whether to automatically fetch (default: true)
 *
 * @returns Tokens data, total count, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { tokens, total, isLoading, error } = useClankerTokens({ fid: 16085 });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * return <div>Found {total} tokens</div>;
 * ```
 */
export function useClankerTokens({ fid, enabled = true }: UseClankerTokensOptions): UseClankerTokensResult {
  const [tokens, setTokens] = useState<ClankerToken[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    if (!fid) {
      setTokens([]);
      setTotal(0);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/clanker-tokens?fid=${fid}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tokens");
      }

      const data = await response.json();
      setTokens(data.tokens || []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching Clanker tokens:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fid]);

  useEffect(() => {
    if (enabled && fid) {
      fetchTokens();
    }
  }, [fid, enabled, fetchTokens]);

  return {
    tokens,
    total,
    isLoading,
    error,
    refetch: fetchTokens,
  };
}
