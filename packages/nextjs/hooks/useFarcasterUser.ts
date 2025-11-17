import { useCallback, useEffect, useState } from "react";
import type { NeynarUser } from "~~/types/neynar";

interface UseFarcasterUserOptions {
  fid: number | null;
  viewerFid?: number;
  enabled?: boolean;
}

interface UseFarcasterUserResult {
  user: NeynarUser | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch Farcaster user data from our API endpoint
 *
 * Fetches comprehensive user information including:
 * - Profile data (username, display name, bio, avatar)
 * - Social stats (followers, following)
 * - Verified addresses (Ethereum, Solana)
 * - Neynar quality score (user.experimental.neynar_user_score)
 *
 * @param options - Configuration options
 * @param options.fid - The Farcaster ID to fetch
 * @param options.viewerFid - Optional viewer's FID for context
 * @param options.enabled - Whether to automatically fetch (default: true)
 *
 * @returns User data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { user, isLoading, error } = useFarcasterUser({ fid: 3 });
 *
 * if (isLoading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error}</div>;
 * if (user) {
 *   const score = user.experimental?.neynar_user_score;
 *   return (
 *     <div>
 *       {user.display_name} - Quality Score: {score?.toFixed(2)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFarcasterUser({ fid, viewerFid, enabled = true }: UseFarcasterUserOptions): UseFarcasterUserResult {
  const [user, setUser] = useState<NeynarUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    if (!fid) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ fid: fid.toString() });
      if (viewerFid) {
        params.append("viewer_fid", viewerFid.toString());
      }

      const response = await fetch(`/api/user?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch user");
      }

      const data = await response.json();
      let userData = data.user;

      // Check if birthday data is missing and refetch if needed
      if (userData && !userData.birthday) {
        console.log("Birthday data missing, refetching user data...");
        try {
          const refetchResponse = await fetch(`/api/user?${params.toString()}`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
            cache: "no-store", // Bypass cache to get fresh data
          });

          if (refetchResponse.ok) {
            const refetchData = await refetchResponse.json();
            if (refetchData.user) {
              userData = refetchData.user;
              console.log("User data refetched successfully");
            }
          }
        } catch (refetchError) {
          console.error("Failed to refetch user data:", refetchError);
          // Continue with original data if refetch fails
        }
      }

      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Error fetching Farcaster user:", err);
    } finally {
      setIsLoading(false);
    }
  }, [fid, viewerFid]);

  useEffect(() => {
    if (enabled && fid) {
      fetchUser();
    }
  }, [fid, viewerFid, enabled, fetchUser]);

  return {
    user,
    isLoading,
    error,
    refetch: fetchUser,
  };
}
