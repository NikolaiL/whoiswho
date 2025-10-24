import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Clanker tokens deployed by a user
 * Proxies to Clanker API with caching
 *
 * Query params:
 * - fid: Farcaster ID (required)
 *
 * Caching: Results are cached for 5 minutes
 */

// Enable caching for this route - revalidate every 5 minutes
export const revalidate = 300;

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

    // Build Clanker API URL
    const clankerUrl = new URL("https://clanker.world/api/tokens");
    clankerUrl.searchParams.append("limit", "10");
    clankerUrl.searchParams.append("offset", "0");
    clankerUrl.searchParams.append("includeMarket", "true");
    clankerUrl.searchParams.append("includeUser", "false");
    clankerUrl.searchParams.append("fids", fid);
    clankerUrl.searchParams.append("sortBy", "market-cap");
    clankerUrl.searchParams.append("sort", "desc");

    // Call Clanker API with caching
    const response = await fetch(clankerUrl.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache the fetch request for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Clanker API error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to fetch tokens from Clanker" }, { status: response.status });
    }

    const data = await response.json();

    // Return with cache headers
    return NextResponse.json(
      {
        tokens: data.data || [],
        total: data.total || 0,
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
