import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Farcaster Creator Rewards data
 * Only accessible from within the app
 *
 * Query params:
 * - fid: Farcaster ID (required)
 *
 * Data sources:
 * - Warpcast Creator Rewards API: User scores and ranking
 * - Warpcast Creator Rewards Metadata: Current period info and reward tiers
 *
 * Caching: Results are cached for 5 minutes to reduce API calls
 */

// Force dynamic rendering (API routes can't be static)
export const dynamic = "force-dynamic";

// Enable caching for this route - revalidate every 5 minutes (300 seconds)
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
    if (isNaN(Number(fid))) {
      return NextResponse.json({ error: "FID must be a valid number" }, { status: 400 });
    }

    // Build API URLs
    const scoresUrl = `https://client.warpcast.com/v1/creator-rewards-scores-for-user?fid=${fid}`;
    const metadataUrl = "https://client.warpcast.com/v1/creator-rewards-metadata";

    // Fetch both in parallel
    const [scoresResponse, metadataResponse] = await Promise.all([
      fetch(scoresUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Cache the fetch request for 5 minutes
        next: { revalidate: 300 },
      }),
      fetch(metadataUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Cache the fetch request for 5 minutes
        next: { revalidate: 300 },
      }),
    ]);

    if (!scoresResponse.ok) {
      const errorData = await scoresResponse.text();
      console.error("Creator Rewards Scores API error:", scoresResponse.status, errorData);
      return NextResponse.json({ error: "Failed to fetch creator rewards scores" }, { status: scoresResponse.status });
    }

    if (!metadataResponse.ok) {
      const errorData = await metadataResponse.text();
      console.error("Creator Rewards Metadata API error:", metadataResponse.status, errorData);
      return NextResponse.json(
        { error: "Failed to fetch creator rewards metadata" },
        { status: metadataResponse.status },
      );
    }

    const scoresData = await scoresResponse.json();
    const metadataData = await metadataResponse.json();

    // Combine both responses
    const combinedData = {
      scores: scoresData.result?.scores || null,
      metadata: metadataData.result?.metadata || null,
    };

    // Return with cache headers
    return NextResponse.json(combinedData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching creator rewards data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
