import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Quotient Score data from Quotient API
 * Only accessible from within the app
 *
 * Query params:
 * - fid: Farcaster ID (required)
 *
 * Data sources:
 * - Quotient API: User reputation metrics and quotient score
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

    // Get API key from environment
    const apiKey = process.env.QUOTIENT_API_KEY;
    if (!apiKey) {
      console.error("QUOTIENT_API_KEY is not set in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Build Quotient API URL
    const quotientUrl = "https://api.quotient.social/v1/user-reputation";

    // Fetch from Quotient API
    const response = await fetch(quotientUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fids: [Number(fid)],
        api_key: apiKey,
      }),
      // Cache the fetch request for 5 minutes
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Quotient API error:", response.status, errorData);
      return NextResponse.json({ error: "Failed to fetch quotient score data" }, { status: response.status });
    }

    const data = await response.json();

    // Return with cache headers
    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching quotient score data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
