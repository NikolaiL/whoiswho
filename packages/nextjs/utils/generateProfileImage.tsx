import React from "react";
import { ImageResponse } from "next/og";
import { getQuotientScoreLevel } from "~~/types/quotient";

export async function loadGoogleFont(font: string) {
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

export async function validateImageUrl(url: string | undefined, fallbackUrl: string): Promise<string> {
  if (!url) {
    return fallbackUrl;
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });

    if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
      return url;
    }
  } catch (error) {
    console.error(`Failed to load image from ${url}:`, error);
  }

  return fallbackUrl;
}

async function fetchImageAsDataUrl(url: string, timeoutMs: number = 3000): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
      return null;
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return `data:${contentType};base64,${base64}`;
  } catch {
    // Silently fail - timeouts are expected when external services are unavailable
    return null;
  }
}

function generateGradientFromFid(fid: string | number): string {
  const fidStr = String(fid);
  const hash = fidStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hash * 137) % 360; // Golden angle for pleasing color combinations
  const degree = (hash * 73) % 360; // Generate degree from 0-360

  return `linear-gradient(${degree}deg, hsl(${hue1}, 70%, 50%), hsl(${hue2}, 70%, 30%))`;
}

async function getBannerImage(user: any): Promise<{ type: "image" | "gradient"; value: string }> {
  // Try user banner first (3s timeout)
  if (user.farcaster?.user?.profile?.bannerImageUrl) {
    const dataUrl = await fetchImageAsDataUrl(user.farcaster.user.profile.bannerImageUrl, 3000);
    if (dataUrl) {
      return { type: "image", value: dataUrl };
    }
  }

  // Try picsum with shorter timeout (2s)
  const picsumUrl = await fetchImageAsDataUrl("https://picsum.photos/1200/800", 2000);
  if (picsumUrl) {
    return { type: "image", value: picsumUrl };
  }

  // Fallback to gradient
  const gradient = generateGradientFromFid(user.fid || user.fid_str || "0");
  return { type: "gradient", value: gradient };
}

export function transformImgurUrl(url: string): string {
  // Check if the URL is from imgur.com
  if (url?.includes("imgur.com")) {
    //console.log("transforming imgur url", url);
    // Encode the URL
    const encodedUrl = encodeURIComponent(url);
    // Return the Warpcast CDN proxy URL
    const result = `https://wrpcd.net/cdn-cgi/image/anim=false,fit=contain,f=auto,w=288/${encodedUrl}`;
    //console.log("transformed imgur url", result);
    return result;
  }
  return url;
}

interface GenerateProfileImageOptions {
  user: any;
  size?: { width: number; height: number };
}

export async function generateProfileImage({ user, size = { width: 1200, height: 800 } }: GenerateProfileImageOptions) {
  const FALLBACK_AVATAR = "https://farcaster.xyz/avatar.png";

  let avatarUrl = transformImgurUrl(user.pfp_url);

  avatarUrl = await validateImageUrl(avatarUrl, FALLBACK_AVATAR);

  // Transform imgur URLs through Warpcast CDN proxy

  //console.log("avatarUrl", avatarUrl);

  // Get banner image (fetched once, no re-fetch)
  const banner = await getBannerImage(user);

  const neynarScore = user.score || 0;

  // Get follower/following counts from Farcaster data (preferred) or fallback to Neynar
  const followerCount = user.farcaster?.user?.followerCount || user.follower_count || 0;
  const followingCount = user.farcaster?.user?.followingCount || user.following_count || 0;

  // Get creator rewards data
  const creatorScore = user.creatorRewards?.score || 0;
  const creatorRank = user.creatorRewards?.rank || 0;

  // Get quotient score data
  const quotientScore = user.quotientScore?.score || 0;
  const quotientRank = user.quotientScore?.rank || 0;

  // Calculate flag levels
  const neynarLevel = neynarScore >= 0.7 ? "green" : neynarScore >= 0.55 ? "yellow" : "red";

  const spamLabel = user.farcaster?.extras?.publicSpamLabel || "";
  const spamScore = spamLabel ? parseInt(spamLabel.charAt(0)) : 0;
  const spamLevel = spamScore === 2 ? "green" : spamScore === 1 ? "yellow" : "red";

  const followerRatio = followingCount === 0 ? 0 : followerCount / followingCount;
  const ratioLevel = followerRatio >= 0.8 ? "green" : followerRatio >= 0.2 ? "yellow" : "red";

  const talentBuilderScore = user.talentScore?.builderScore?.points || 0;
  const talentBuilderRank = user.talentScore?.builderScore?.rank || 0;

  const talentCreatorScore = user.talentScore?.creatorScore?.points || 0;
  const talentCreatorRank = user.talentScore?.creatorScore?.rank || 0;

  // Determine stamp color based on worst flag
  let stampLevel: "green" | "yellow" | "red" = "green";
  if (neynarLevel === "red" || spamLevel === "red" || ratioLevel === "red") {
    stampLevel = "red";
  } else if (neynarLevel === "yellow" || spamLevel === "yellow" || ratioLevel === "yellow") {
    stampLevel = "yellow";
  }

  // Get current date for stamp
  const currentDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const [year, month, day] = currentDate.split("-");
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const formattedDate = `${year}-${monthNames[parseInt(month) - 1]}-${day}`;

  function addZero(i: number) {
    if (i < 10) {
      return "0" + i;
    }
    return i;
  }
  // need time in utc timezone
  const formattedTime =
    `${addZero(new Date().getUTCHours())}:${addZero(new Date().getUTCMinutes())}:${addZero(new Date().getUTCSeconds())} UTC`.trim();

  // Generate random rotation between -20 and +20 degrees
  const stampRotation = Math.floor(Math.random() * 41) - 20; // Random between -20 and +20

  // Define colors
  const colors = {
    primary: "#A784FF",
    accent: "#06b6d4",
    neutral: "#f1f5f9",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    background: "#1D293F",
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
        {/* Background: Image or Gradient */}
        {banner.type === "image" ? (
          <img
            src={banner.value}
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
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "800px",
              background: banner.value,
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
            overflow: "hidden",
          }}
        >
          {/* Decorative Icon - Cropped on right edge */}
          <img
            src={`${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/icon.svg`}
            style={{
              position: "absolute",
              right: "-147px",
              top: "67%",
              transform: "translateY(-50%)",
              width: "550px",
              height: "550px",
              opacity: 0.05,
            }}
          />
          {/* App Title */}
          <div
            style={{
              fontSize: "54px",
              fontWeight: "700",
              color: "#ffffff",
              position: "absolute",
              top: "35px",
              left: "54px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: 0.15,
            }}
          >
            WhoIsWho
          </div>

          {/* FID */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: "700",
              color: "#ffffff",
              position: "absolute",
              top: "46px",
              right: "50px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              opacity: 0.15,
              fontFamily: "Sixtyfour, monospace",
            }}
          >
            {user.fid}
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
            {/* Left: Avatar with Pro Badge */}
            <div
              style={{
                position: "relative",
                display: "flex",
              }}
            >
              <img
                style={{
                  width: "300px",
                  height: "300px",
                  borderRadius: "30px",
                  objectFit: "cover",
                  border: `4px solid ${colors.base300}`,
                }}
                src={avatarUrl}
              />

              {/* Pro Badge - Bottom Right of Avatar */}
              {user.pro?.status === "subscribed" && (
                <svg
                  width="70"
                  height="70"
                  viewBox="0 0 18 18"
                  style={{
                    position: "absolute",
                    top: "255px",
                    right: "-20px",
                  }}
                >
                  <path
                    fill="#8b5cf6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M 17 9 C 16.984699 8.44998 16.8169 7.914431 16.5147 7.45381 C 16.297401 7.122351 16.016399 6.83868 15.6895 6.61875 C 15.4741 6.47382 15.3639 6.206079 15.4143 5.9514 C 15.4908 5.56531 15.4893 5.16623 15.4095 4.777781 C 15.298 4.23797 15.0375 3.74074 14.6586 3.34142 C 14.2584 2.96254 13.762 2.70285 13.2222 2.59046 C 12.8341 2.51075 12.4353 2.5092 12.0495 2.5855 C 11.7944 2.63594 11.5263 2.52522 11.3816 2.30924 C 11.1622 1.982038 10.87893 1.700779 10.54704 1.48361 C 10.08642 1.182205 9.55087 1.013622 9 1 C 8.44998 1.014473 7.91613 1.181355 7.45636 1.48361 C 7.12562 1.701042 6.84379 1.981922 6.62575 2.30818 C 6.4811 2.52463 6.21278 2.6359 5.95742 2.58524 C 5.57065 2.50851 5.17062 2.50951 4.78118 2.59046 C 4.24053 2.70115 3.74244 2.96169 3.34227 3.34142 C 2.96339 3.74159 2.70456 4.23968 2.59472 4.77863 C 2.51504 5.16661 2.51478 5.56517 2.59204 5.9505 C 2.64317 6.20557 2.53289 6.47402 2.31683 6.618879 C 1.98923 6.83852 1.707141 7.12164 1.488719 7.45296 C 1.185611 7.91273 1.016177 8.44913 1 9 C 1.017028 9.55087 1.185611 10.08642 1.488719 10.54704 C 1.70699 10.87813 1.988839 11.1615 2.31614 11.381 C 2.53242 11.5261 2.64304 11.7948 2.59191 12.0501 C 2.51478 12.4353 2.51509 12.8336 2.59472 13.2214 C 2.70541 13.7612 2.96339 14.2584 3.34142 14.6586 C 3.74159 15.0358 4.23882 15.2946 4.77778 15.4061 C 5.16676 15.4872 5.56638 15.4885 5.95297 15.4125 C 6.2069 15.3626 6.4733 15.473 6.61752 15.6879 C 6.8374 16.015499 7.12119 16.2973 7.45381 16.515499 C 7.91358 16.8169 8.44998 16.984699 9 17 C 9.55087 16.986401 10.08642 16.8186 10.54704 16.5172 C 10.87568 16.3022 11.1566 16.023899 11.3751 15.7008 C 11.5233 15.4816 11.7988 15.3721 12.0576 15.4274 C 12.4412 15.5093 12.8397 15.5111 13.2273 15.4308 C 13.7688 15.3184 14.2661 15.0502 14.6577 14.6586 C 15.0494 14.2669 15.3184 13.7697 15.4308 13.2273 C 15.5112 12.8397 15.5093 12.4411 15.427 12.0575 C 15.3716 11.7987 15.4806 11.5231 15.6997 11.3745 C 16.022301 11.1558 16.2999 10.87482 16.515499 10.54619 C 16.8169 10.08642 16.984699 9.55002 17 9 Z M 12.1286 6.46597"
                  />
                  <path
                    fill="#ffffff"
                    fillRule="evenodd"
                    d="M 5.48206 8.829732 C 5.546341 8.757008 6.096026 8.328334 6.590207 8.831891 C 6.990357 9.239633 7.80531 10.013605 7.80531 10.013605 C 7.80531 10.013605 10.326332 7.31631 11.011629 6.559397 C 11.320887 6.21782 11.875775 6.239667 12.135474 6.515033 C 12.411443 6.807649 12.489538 7.230008 12.164574 7.601331 C 10.947777 8.991708 9.508716 10.452277 8.3795 11.706156 C 8.11062 12.004721 7.595459 12.008714 7.302509 11.735093 C 7.061394 11.509888 6.005327 10.437536 5.502547 9.931531 C 5.003333 9.429114 5.404643 8.887831 5.48206 8.829732 Z"
                  />
                </svg>
              )}
            </div>

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
                  fontSize: "36px",
                  fontWeight: "700",
                  color: colors.neutral,
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "0px",
                  height: "42px",
                }}
              >
                <span>{user.display_name || " "}</span>
              </div>

              {/* Username */}
              <div
                style={{
                  fontSize: "32px",
                  color: colors.primary,
                  marginTop: "-23px",
                  display: "flex",
                }}
              >
                @{user.username}
              </div>

              {/* Follower and Creator Score Stats */}
              <div
                style={{
                  display: "flex",
                  position: "absolute",
                  top: "0px",
                  right: "0px",
                  width: "300px",
                  gap: "15px",
                  marginTop: "0px",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: `3px solid ${colors.base300}`,
                    borderRadius: "10px",
                    padding: "5px",
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: colors.neutral,
                      display: "flex",
                    }}
                  >
                    {followerCount.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: colors.neutral,
                      opacity: 0.6,
                      display: "flex",
                    }}
                  >
                    Followers
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: `3px solid ${colors.base300}`,
                    borderRadius: "10px",
                    padding: "5px",
                    flex: 1,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: "700",
                      color: colors.neutral,
                      display: "flex",
                    }}
                  >
                    {followingCount.toLocaleString()}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: colors.neutral,
                      opacity: 0.6,
                      display: "flex",
                    }}
                  >
                    Following
                  </div>
                </div>
              </div>

              {/* Flag Indicators */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginTop: "0px",
                  width: "100%",
                }}
              >
                {/* Neynar Score */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor:
                      neynarLevel === "green"
                        ? "rgba(16, 185, 129, 0.15)"
                        : neynarLevel === "yellow"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    border: `2px solid ${neynarLevel === "green" ? colors.success : neynarLevel === "yellow" ? colors.warning : colors.error}`,
                    padding: "6px",
                    borderRadius: "10px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: "54px",
                      fontWeight: "700",
                      color:
                        neynarLevel === "green"
                          ? colors.success
                          : neynarLevel === "yellow"
                            ? colors.warning
                            : colors.error,
                      display: "flex",
                    }}
                  >
                    {neynarScore.toFixed(2)}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: colors.neutral,
                      opacity: 0.8,
                      display: "flex",
                    }}
                  >
                    Neynar Score
                  </div>
                </div>

                {/* Spam Score */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor:
                      spamLevel === "green"
                        ? "rgba(16, 185, 129, 0.15)"
                        : spamLevel === "yellow"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    border: `2px solid ${spamLevel === "green" ? colors.success : spamLevel === "yellow" ? colors.warning : colors.error}`,
                    padding: "6px",
                    borderRadius: "10px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: "54px",
                      fontWeight: "700",
                      color:
                        spamLevel === "green" ? colors.success : spamLevel === "yellow" ? colors.warning : colors.error,
                      display: "flex",
                    }}
                  >
                    {spamScore}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: colors.neutral,
                      opacity: 0.8,
                      display: "flex",
                    }}
                  >
                    Spam Label
                  </div>
                </div>

                {/* Follower Ratio */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    backgroundColor:
                      ratioLevel === "green"
                        ? "rgba(16, 185, 129, 0.15)"
                        : ratioLevel === "yellow"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    border: `2px solid ${ratioLevel === "green" ? colors.success : ratioLevel === "yellow" ? colors.warning : colors.error}`,
                    padding: "6px",
                    borderRadius: "10px",
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: "54px",
                      fontWeight: "700",
                      color:
                        ratioLevel === "green"
                          ? colors.success
                          : ratioLevel === "yellow"
                            ? colors.warning
                            : colors.error,
                      display: "flex",
                    }}
                  >
                    {followerRatio.toFixed(1)}
                  </div>
                  <div
                    style={{
                      fontSize: "20px",
                      color: colors.neutral,
                      opacity: 0.8,
                      display: "flex",
                    }}
                  >
                    Follower Ratio
                  </div>
                </div>
              </div>

              {/* Other Scores Section */}
              <div
                style={{
                  display: "flex",
                  gap: "15px",
                  marginTop: "0px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    width: "100%",
                    marginTop: "0px",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: `3px solid ${colors.base300}`,
                      borderRadius: "10px",
                      padding: "5px",
                      flex: 0.5,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "400",
                        color: colors.neutral,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        opacity: 0.8,
                      }}
                    >
                      Talent Score
                    </div>
                    <hr
                      style={{
                        width: "100%",
                        margin: "1px 0",
                        borderColor: colors.base300,
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    />
                    <div style={{ display: "flex", width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "32px",
                            fontWeight: "700",
                            color: colors.neutral,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {talentBuilderScore ? talentBuilderScore.toLocaleString() : "-"}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            color: colors.neutral,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Builder Score
                        </div>
                        <div
                          style={{
                            fontSize: "32px",
                            fontWeight: "700",
                            marginTop: "5px",
                            color: colors.primary,
                            display: "flex",
                          }}
                        >
                          {talentBuilderRank ? `#${talentBuilderRank.toLocaleString()}` : "-"}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            color: colors.primary,
                            display: "flex",
                          }}
                        >
                          Builder Rank
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                        <div
                          style={{
                            fontSize: "32px",
                            fontWeight: "700",
                            color: colors.neutral,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {talentCreatorScore ? talentCreatorScore.toLocaleString() : "-"}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            color: colors.neutral,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Creator Score
                        </div>
                        <div
                          style={{
                            fontSize: "32px",
                            fontWeight: "700",
                            marginTop: "5px",
                            color: colors.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {talentCreatorRank ? `#${talentCreatorRank.toLocaleString()}` : "-"}
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            color: colors.primary,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          Creator Rank
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: `3px solid ${colors.base300}`,
                      borderRadius: "10px",
                      padding: "5px",
                      flex: 0.25,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "400",
                        color: colors.neutral,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        opacity: 0.8,
                      }}
                    >
                      Quotient
                    </div>
                    <hr
                      style={{
                        width: "100%",
                        margin: "1px 0",
                        borderColor: colors.base300,
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    />
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: "700",
                        color: colors.neutral,
                        display: "flex",
                      }}
                    >
                      {quotientScore ? quotientScore.toFixed(3) : "-"}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: colors.neutral,
                        display: "flex",
                      }}
                    >
                      Quotient Score
                    </div>
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: "700",
                        marginTop: "5px",
                        color: colors.primary,
                        display: "flex",
                      }}
                    >
                      {quotientRank ? `#${quotientRank.toLocaleString()}` : "-"}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: colors.primary,
                        display: "flex",
                      }}
                    >
                      Quotient Rank
                    </div>
                    {quotientScore !== null && quotientScore !== undefined && (
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          padding: "4px 0px",
                          borderRadius: "6px",
                          marginTop: "5px",
                          width: "100%",
                          textAlign: "center",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor:
                            getQuotientScoreLevel(quotientScore).level === "success"
                              ? "rgba(16, 185, 129, 0.15)"
                              : getQuotientScoreLevel(quotientScore).level === "warning"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                          border: `2px solid ${
                            getQuotientScoreLevel(quotientScore).level === "success"
                              ? colors.success
                              : getQuotientScoreLevel(quotientScore).level === "warning"
                                ? colors.warning
                                : colors.error
                          }`,
                          color:
                            getQuotientScoreLevel(quotientScore).level === "success"
                              ? colors.success
                              : getQuotientScoreLevel(quotientScore).level === "warning"
                                ? colors.warning
                                : colors.error,
                          display: "flex",
                        }}
                      >
                        {getQuotientScoreLevel(quotientScore).label}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      border: `3px solid ${colors.base300}`,
                      borderRadius: "10px",
                      padding: "5px",
                      flex: 0.25,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: "400",
                        color: colors.neutral,
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        opacity: 0.8,
                      }}
                    >
                      Farcaster
                    </div>
                    <hr
                      style={{
                        width: "100%",
                        margin: "1px 0",
                        borderColor: colors.base300,
                        borderWidth: "1px",
                        borderStyle: "solid",
                      }}
                    />

                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: "700",
                        color: colors.neutral,
                        display: "flex",
                      }}
                    >
                      {creatorScore ? creatorScore.toLocaleString() : "-"}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: colors.neutral,
                        display: "flex",
                      }}
                    >
                      Creator Score
                    </div>
                    <div
                      style={{
                        fontSize: "32px",
                        fontWeight: "700",
                        marginTop: "5px",
                        color: colors.primary,
                        display: "flex",
                      }}
                    >
                      {creatorRank ? `#${creatorRank.toLocaleString()}` : "-"}
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        color: colors.primary,
                        opacity: 1,
                        display: "flex",
                      }}
                    >
                      Creator Rank
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "52px",
              fontSize: "13.6px",
              color: colors.neutral,
              opacity: 0.5,
              display: "flex",
              flexDirection: "row",
              gap: "5px",
              alignItems: "flex-end",
            }}
          >
            <p style={{ margin: 0 }}>Verify Users · Check Reputation · Avoid Spam</p>
          </div>

          {/* Verification Stamp */}
          <div
            style={{
              position: "absolute",
              bottom: "60px",
              left: "20px",
              transform: `rotate(${stampRotation}deg)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 15px",
              border: `8px dashed ${stampLevel === "green" ? colors.success : stampLevel === "yellow" ? colors.warning : colors.error}`,
              borderRadius: "15px",
              backgroundColor: "rgba(15, 23, 42, 0.1)",
            }}
          >
            <div
              style={{
                fontFamily: "SpecialElite, monospace",
                fontSize: "16px",
                fontWeight: "700",
                color:
                  stampLevel === "green" ? colors.success : stampLevel === "yellow" ? colors.warning : colors.error,
                textAlign: "center",
                letterSpacing: "2px",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              Verified by WhoIsWho
            </div>
            <div
              style={{
                fontFamily: "SpecialElite, monospace",
                fontSize: "32px",
                fontWeight: "700",
                color:
                  stampLevel === "green" ? colors.success : stampLevel === "yellow" ? colors.warning : colors.error,
                marginTop: "8px",
                textAlign: "center",
                letterSpacing: "1px",
                display: "flex",
              }}
            >
              {formattedDate}
            </div>
            <div
              style={{
                fontFamily: "SpecialElite, monospace",
                fontSize: "14px",
                fontWeight: "700",
                letterSpacing: "5px",
                color:
                  stampLevel === "green" ? colors.success : stampLevel === "yellow" ? colors.warning : colors.error,
                marginTop: "2px",
                textAlign: "center",
                display: "flex",
              }}
            >
              {formattedTime}
            </div>
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
        {
          name: "SpecialElite",
          data: await loadGoogleFont("Special+Elite:wght@400"),
          style: "normal",
          weight: 400,
        },
        {
          name: "Sixtyfour",
          data: await loadGoogleFont("Sixtyfour"),
          style: "normal",
          weight: 400,
        },
      ],
    },
  );
}
