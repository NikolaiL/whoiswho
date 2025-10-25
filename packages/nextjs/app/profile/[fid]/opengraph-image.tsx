import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const runtime = "nodejs";
export const alt = "Farcaster User Profile";
export const size = {
  width: 1200,
  height: 800,
};
export const contentType = "image/png";

async function loadGoogleFont(font: string) {
  const url = `https://fonts.googleapis.com/css2?family=${font}`;
  const css = await (await fetch(url)).text();
  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/);

  if (resource) {
    const response = await fetch(resource[1]);
    if (response.status == 200) {
      return await response.arrayBuffer();
    }
  }

  throw new Error("failed to load font data: " + url);
}

async function fetchUserData(fid: string) {
  // Use our own API endpoint which fetches from both Neynar and Farcaster
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const apiUrl = `${baseUrl}/api/user?fid=${fid}`;
  console.log("apiUrl", apiUrl);
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user || null;
}

export default async function Image({ params }: { params: Promise<{ fid: string }> }) {
  const { fid } = await params;
  const user = await fetchUserData(fid);

  if (!user) {
    // Return the default thumbnail.jpg from public directory
    try {
      const thumbnailPath = join(process.cwd(), "public", "thumbnail.jpg");
      console.log("thumbnailPath", thumbnailPath);
      const thumbnailBuffer = await readFile(thumbnailPath);
      return new Response(Buffer.from(thumbnailBuffer as unknown as ArrayBuffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    } catch (error) {
      console.error("Error loading thumbnail:", error);
      // Fallback to a simple error image if thumbnail is not found
      return new ImageResponse(
        (
          <div
            style={{
              width: "1200px",
              height: "800px",
              background: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f1f5f9",
              fontSize: "48px",
            }}
          >
            User not found
          </div>
        ),
        {
          ...size,
        },
      );
    }
  }

  const avatarUrl = user.pfp_url || "https://farcaster.xyz/avatar.png";
  const neynarScore = user.score || 0;

  // Get follower/following counts from Farcaster data (preferred) or fallback to Neynar
  const followerCount = user.farcaster?.user?.followerCount || user.follower_count || 0;
  const followingCount = user.farcaster?.user?.followingCount || user.following_count || 0;

  // Get banner image if available
  const bannerUrl = user.farcaster?.user?.profile?.bannerImageUrl;

  // Define colors
  const colors = {
    primary: "#8b5cf6",
    accent: "#06b6d4",
    neutral: "#f1f5f9",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    background: "#0f172a",
    base200: "#1e293b",
    base300: "#334155",
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "800px",
          background: colors.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Inter, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background banner image with blur */}
        {bannerUrl && (
          <img
            src={bannerUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "800px",
              objectFit: "cover",
              filter: "blur(5px)",
              opacity: 0.7,
            }}
          />
        )}
        <div
          style={{
            width: "1100px",
            height: "530px",
            background: colors.background,
            borderRadius: "20px",
            border: `3px solid ${colors.base300}`,
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "flex-start",
            padding: "50px",
            position: "relative",
          }}
        >
          {/* App Title */}
          <div
            style={{
              fontSize: "32px",
              fontWeight: "700",
              color: colors.primary,
              position: "absolute",
              top: "30px",
              left: "50px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            🔍 WhoIsWho
          </div>

          {/* Content Container */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: "40px",
              marginTop: "60px",
              width: "100%",
            }}
          >
            {/* Left: Avatar */}
            <img
              style={{
                width: "280px",
                height: "280px",
                borderRadius: "30px",
                objectFit: "cover",
                border: `4px solid ${colors.base300}`,
              }}
              src={avatarUrl}
            />

            {/* Right: User Info */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
                flex: 1,
              }}
            >
              {/* Display Name */}
              <div
                style={{
                  fontSize: "54px",
                  fontWeight: "700",
                  color: colors.neutral,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <span>{user.display_name}</span>
                {user.pro?.status === "subscribed" && (
                  <div
                    style={{
                      fontSize: "28px",
                      backgroundColor: colors.primary,
                      color: colors.neutral,
                      padding: "4px 12px",
                      borderRadius: "8px",
                      fontWeight: "600",
                      display: "flex",
                    }}
                  >
                    PRO
                  </div>
                )}
              </div>

              {/* Username */}
              <div
                style={{
                  fontSize: "32px",
                  color: colors.accent,
                  marginTop: "-10px",
                  display: "flex",
                }}
              >
                @{user.username}
              </div>

              {/* Bio (truncated) */}
              {user.profile?.bio?.text && (
                <div
                  style={{
                    fontSize: "24px",
                    color: colors.neutral,
                    opacity: 0.8,
                    lineHeight: 1.4,
                    maxHeight: "100px",
                    overflow: "hidden",
                    display: "flex",
                  }}
                >
                  {user.profile.bio.text.slice(0, 120) + (user.profile.bio.text.length > 120 ? "..." : "")}
                </div>
              )}

              {/* Stats Row */}
              <div
                style={{
                  display: "flex",
                  gap: "40px",
                  marginTop: "10px",
                }}
              >
                {/* Neynar Score */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: colors.base200,
                    padding: "15px 30px",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: "700",
                      color: neynarScore >= 0.7 ? colors.success : neynarScore >= 0.55 ? colors.warning : colors.error,
                      display: "flex",
                    }}
                  >
                    {neynarScore.toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      color: colors.neutral,
                      opacity: 0.7,
                      display: "flex",
                    }}
                  >
                    Quality Score
                  </div>
                </div>

                {/* Followers */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: colors.base200,
                    padding: "15px 30px",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: "700",
                      color: colors.neutral,
                      display: "flex",
                    }}
                  >
                    {followerCount.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      color: colors.neutral,
                      opacity: 0.7,
                      display: "flex",
                    }}
                  >
                    Followers
                  </div>
                </div>

                {/* Following */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: colors.base200,
                    padding: "15px 30px",
                    borderRadius: "12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "38px",
                      fontWeight: "700",
                      color: colors.neutral,
                      display: "flex",
                    }}
                  >
                    {followingCount.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      color: colors.neutral,
                      opacity: 0.7,
                      display: "flex",
                    }}
                  >
                    Following
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "30px",
              left: "50px",
              right: "50px",
              fontSize: "20px",
              color: colors.neutral,
              opacity: 0.6,
              display: "flex",
            }}
          >
            Verify Farcaster users • Check reputation • Avoid spam
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Inter",
          data: await loadGoogleFont("Inter:wght@400"),
          style: "normal",
          weight: 400,
        },
        {
          name: "Inter",
          data: await loadGoogleFont("Inter:wght@700"),
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}
