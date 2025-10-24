import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Farcaster user data from Neynar and Farcaster client API
 * Only accessible from within the app
 *
 * Query params:
 * - fid: Farcaster ID (required)
 * - viewer_fid: Optional viewer's FID for context
 *
 * Data sources:
 * - Neynar API: Primary user data with quality scores
 * - Farcaster client API: Additional Farcaster-specific data (included as user.farcaster)
 *
 * Caching: Results are cached for 5 minutes to reduce API calls
 */

// Enable caching for this route - revalidate every 5 minutes (300 seconds)
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    // Get FID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get("fid");
    const viewerFid = searchParams.get("viewer_fid");

    // Validate FID parameter
    if (!fid) {
      return NextResponse.json({ error: "FID parameter is required" }, { status: 400 });
    }

    // Validate FID is a number
    if (isNaN(Number(fid))) {
      return NextResponse.json({ error: "FID must be a valid number" }, { status: 400 });
    }

    // Get API key from environment
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.error("NEYNAR_API_KEY is not set in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Build Neynar API URL
    const neynarUrl = new URL("https://api.neynar.com/v2/farcaster/user/bulk/");
    neynarUrl.searchParams.append("fids", fid);
    if (viewerFid) {
      neynarUrl.searchParams.append("viewer_fid", viewerFid);
    }

    // Build Farcaster client API URL
    const farcasterUrl = new URL("https://client.farcaster.xyz/v2/user-by-fid");
    farcasterUrl.searchParams.append("fid", fid);

    // Fetch from both APIs in parallel
    const [neynarResponse, farcasterResponse] = await Promise.all([
      fetch(neynarUrl.toString(), {
        method: "GET",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        // Cache the fetch request for 5 minutes
        next: { revalidate: 300 },
      }),
      fetch(farcasterUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        // Cache the fetch request for 5 minutes
        next: { revalidate: 300 },
      }),
    ]);

    if (!neynarResponse.ok) {
      const errorData = await neynarResponse.text();
      console.error("Neynar API error:", neynarResponse.status, errorData);
      return NextResponse.json({ error: "Failed to fetch user data from Neynar" }, { status: neynarResponse.status });
    }

    const neynarData = await neynarResponse.json();

    // Parse Farcaster client data (optional - don't fail if it errors)
    let farcasterData = null;
    if (farcasterResponse.ok) {
      try {
        const farcasterResult = await farcasterResponse.json();
        farcasterData = farcasterResult?.result || null;
      } catch (err) {
        console.error("Error parsing Farcaster client API response:", err);
      }
    } else {
      console.error("Farcaster client API error:", farcasterResponse.status);
    }

    // Return the first user from the array (since we're querying by single FID)
    if (neynarData.users && neynarData.users.length > 0) {
      const user = neynarData.users[0];

      // Add farcaster data if available
      if (farcasterData) {
        user.farcaster = farcasterData;
      }

      // Return with cache headers
      return NextResponse.json(
        { user },
        {
          status: 200,
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    } else {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
