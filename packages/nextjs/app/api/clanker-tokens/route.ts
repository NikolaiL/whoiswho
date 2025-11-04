import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Clanker tokens deployed by a user
 * Fetches tokens for all verified addresses associated with the user's FID
 *
 * Query params:
 * - fid: Farcaster ID (required)
 *
 * Flow:
 * 1. Fetch user data to get all verified addresses
 * 2. Query Clanker API for each address
 * 3. Combine and deduplicate results
 *
 * Caching: Results are cached for 5 minutes
 */

// Force dynamic rendering (API routes can't be static)
export const dynamic = "force-dynamic";

// Enable caching for this route - revalidate every 5 minutes
export const revalidate = 300;

interface ClankerToken {
  id: number;
  contract_address: string;
  name: string;
  symbol: string;
  img_url: string;
  admin: string;
  created_at: string;
  related?: {
    market?: {
      marketCap: number;
      priceChangePercent24h: number;
      [key: string]: any;
    };
  };
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    // Get FID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get("fid");

    // Validate FID parameter
    if (!fid) {
      return NextResponse.json({ error: "FID parameter is required" }, { status: 400 });
    }

    // Validate FID is a number
    const fidNum = parseInt(fid);
    if (isNaN(fidNum) || fidNum < 1) {
      return NextResponse.json({ error: "Invalid FID parameter" }, { status: 400 });
    }

    // Step 1: Fetch user data to get verified addresses
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
    const userApiUrl = `${baseUrl}/api/user?fid=${fid}`;

    const userResponse = await fetch(userApiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 300 },
    });

    if (!userResponse.ok) {
      console.error("Failed to fetch user data:", userResponse.status);
      return NextResponse.json({ error: "Failed to fetch user data" }, { status: userResponse.status });
    }

    const userData = await userResponse.json();
    const user = userData.user;

    // Extract verified Ethereum addresses
    const verifiedAddresses: string[] = user?.verified_addresses?.eth_addresses || [];

    if (verifiedAddresses.length === 0) {
      // No verified addresses, return empty result
      return NextResponse.json(
        {
          tokens: [],
          total: 0,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    // Step 2: Fetch tokens for each address in parallel
    const tokenPromises = verifiedAddresses.map(async address => {
      try {
        const clankerUrl = `https://www.clanker.world/api/tokens/fetch-deployed-by-address?address=${address}&page=1`;

        const response = await fetch(clankerUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 300 },
        });

        if (!response.ok) {
          console.error(`Clanker API error for address ${address}:`, response.status);
          return { data: [], total: 0 };
        }

        const data = await response.json();
        return { data: data.data || [], total: data.total || 0 };
      } catch (error) {
        console.error(`Error fetching tokens for address ${address}:`, error);
        return { data: [], total: 0 };
      }
    });

    const results = await Promise.all(tokenPromises);

    // Step 3: Combine and deduplicate results
    const allTokens: ClankerToken[] = [];
    const seenContractAddresses = new Set<string>();

    results.forEach(result => {
      result.data.forEach((token: ClankerToken) => {
        // Deduplicate by contract address
        if (!seenContractAddresses.has(token.contract_address)) {
          seenContractAddresses.add(token.contract_address);
          allTokens.push(token);
        }
      });
    });

    // Sort by market cap (descending)
    allTokens.sort((a, b) => {
      const mcapA = a.related?.market?.marketCap || 0;
      const mcapB = b.related?.market?.marketCap || 0;
      return mcapB - mcapA;
    });

    // Return top 10 tokens
    const topTokens = allTokens.slice(0, 10);

    // Return with cache headers
    return NextResponse.json(
      {
        tokens: topTokens,
        total: allTokens.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching Clanker tokens:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
