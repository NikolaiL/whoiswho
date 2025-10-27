import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Streme tokens deployed by a user
 * Proxies to Streme API with caching
 *
 * Query params:
 * - fid: Farcaster ID (required)
 *
 * Caching: Results are cached for 5 minutes
 */

// Force dynamic rendering (API routes can't be static)
export const dynamic = "force-dynamic";

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

    // Build Streme API URL - note: Streme uses path parameter, not query parameter
    const stremeUrl = `https://api.streme.fun/api/tokens/fid/${fid}`;

    // Call Streme API with caching
    const response = await fetch(stremeUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      // Cache the fetch request for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Streme API error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to fetch tokens from Streme" }, { status: response.status });
    }

    const data = await response.json();

    // Streme API returns array directly (not wrapped in data property)
    const tokensArray = Array.isArray(data) ? data : [];

    // Return with cache headers
    return NextResponse.json(
      {
        tokens: tokensArray,
        total: tokensArray.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching Streme tokens:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
