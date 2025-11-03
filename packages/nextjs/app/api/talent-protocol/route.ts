import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to fetch Talent Protocol data
 * Only accessible from within the app
 *
 * Query params:
 * - fid: Farcaster ID (required)
 *
 * Data sources:
 * - Talent Protocol API: Builder Score, Creator Score, and Profile ID
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
    const apiKey = process.env.TALENT_PROTOCOL_API_KEY;
    if (!apiKey) {
      console.error("TALENT_PROTOCOL_API_KEY is not set in environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    let profileId = null;

    // Build Talent Protocol API URLs
    const accountsUrl = `https://api.talentprotocol.com/profile?id=${fid}&account_source=farcaster`;
    const baseHeaders = {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    };

    // Step 1: Fetch account to get profile ID
    const accountResponse = await fetch(accountsUrl, {
      method: "GET",
      headers: baseHeaders,
      // Cache the fetch request for 5 minutes
      next: { revalidate: 300 },
    });

    if (!accountResponse.ok) {
      const errorData = await accountResponse.text();
      console.error("Talent Protocol Accounts API error:", accountResponse.status, errorData);
      //   return NextResponse.json(
      //     { error: "Failed to fetch Talent Protocol account data" },
      //     { status: accountResponse.status },
      //   );
    } else {
      const accountData = await accountResponse.json();

      // Extract profile ID
      if (!accountData.profile || !accountData.profile.id) {
        //return NextResponse.json({ error: `No Talent Protocol profile found for this FID: ${fid}` }, { status: 404 });
      } else {
        profileId = accountData.profile.id;
      }
    }

    // Step 2: Fetch scores using the profile ID
    const scoresUrl = `https://api.talentprotocol.com/scores?id=${fid}&account_source=farcaster`;

    const scoresResponse = await fetch(scoresUrl, {
      method: "GET",
      headers: baseHeaders,
      // Cache the fetch request for 5 minutes
      next: { revalidate: 300 },
    });

    let builderScore = null;
    let creatorScore = null;

    if (!scoresResponse.ok) {
      const errorData = await scoresResponse.text();
      console.error("Talent Protocol Scores API error:", scoresResponse.status, errorData);
      //   return NextResponse.json(
      //     { error: "Failed to fetch Talent Protocol scores" },
      //     { status: scoresResponse.status },
      //   );
    } else {
      const scoresData = await scoresResponse.json();

      // Extract builder_score and creator_score
      builderScore = scoresData.scores?.find((score: any) => score.slug === "builder_score");
      creatorScore = scoresData.scores?.find((score: any) => score.slug === "creator_score");
    }

    // Build response
    const responseData = {
      profileId,
      builderScore: builderScore
        ? {
            points: builderScore.points,
            rank: builderScore.rank_position,
            lastCalculated: builderScore.last_calculated_at,
          }
        : null,
      creatorScore: creatorScore
        ? {
            points: creatorScore.points,
            rank: creatorScore.rank_position,
            lastCalculated: creatorScore.last_calculated_at,
          }
        : null,
    };

    // Return with cache headers
    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Error fetching Talent Protocol data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
