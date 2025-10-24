import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint to search Farcaster users
 * Proxies to Farcaster's search API
 *
 * Query params:
 * - q: Search query (required) - can be username, display name, or FID
 * - limit: Max results (default 10, max 50)
 *
 * Caching: Results are cached for 1 minute
 *
 * Special behavior: If query is a number (FID), also fetches user directly by FID
 */

// Enable caching for this route - revalidate every 1 minute (60 seconds)
export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    // Get search query from parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q");
    const limit = searchParams.get("limit") || "10";

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Search query parameter 'q' is required" }, { status: 400 });
    }

    // Validate and cap limit
    const limitNum = Math.min(parseInt(limit) || 10, 50);

    // Check if query is a number (potential FID)
    const queryTrimmed = query.trim();
    const isNumeric = /^\d+$/.test(queryTrimmed);
    const fid = isNumeric ? parseInt(queryTrimmed) : null;

    // Prepare promises for parallel fetching
    const fetchPromises = [];

    // Always do the text search
    const searchUrl = new URL("https://client.farcaster.xyz/v2/search-summary");
    searchUrl.searchParams.append("q", queryTrimmed);
    searchUrl.searchParams.append("maxChannels", "0");
    searchUrl.searchParams.append("maxUsers", limitNum.toString());

    fetchPromises.push(
      fetch(searchUrl.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        next: { revalidate: 60 },
      }),
    );

    // If query is numeric, also fetch by FID
    if (fid !== null) {
      const fidUrl = new URL("https://client.farcaster.xyz/v2/user-by-fid");
      fidUrl.searchParams.append("fid", fid.toString());

      fetchPromises.push(
        fetch(fidUrl.toString(), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          next: { revalidate: 60 },
        }),
      );
    }

    // Execute requests in parallel
    const responses = await Promise.all(fetchPromises);
    const searchResponse = responses[0];
    const fidResponse = responses[1]; // Will be undefined if not fetched

    // Process search results
    let users = [];
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      users = searchData?.result?.users || [];
    } else {
      console.error("Farcaster search API error:", searchResponse.status);
    }

    // Process FID lookup result
    if (fidResponse) {
      if (fidResponse.ok) {
        const fidData = await fidResponse.json();
        const userByFid = fidData?.result?.user;

        // Transform user-by-fid response to match SearchUser interface
        if (userByFid) {
          const transformedUser = {
            fid: userByFid.fid,
            displayName: userByFid.displayName,
            username: userByFid.username,
            pfp: userByFid.pfp,
            profile: userByFid.profile,
            followerCount: userByFid.followerCount,
            followingCount: userByFid.followingCount,
            viewerContext: userByFid.viewerContext,
          };

          // Remove user from results if already present (we'll add it to the top)
          users = users.filter((u: any) => u.fid !== userByFid.fid);

          // Always add FID lookup result to the beginning
          users.unshift(transformedUser);
        }
      } else {
        console.error("Farcaster user-by-fid API error:", fidResponse.status);
      }
    }

    // Return with cache headers
    return NextResponse.json(
      { users },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
