import { NextRequest, NextResponse } from "next/server";
import { Errors, createClient } from "@farcaster/quick-auth";
import { generateProfileImage } from "~~/utils/generateProfileImage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const client = createClient();

// Rate limiting storage (in-memory for simplicity, use Redis in production)
const mintAttempts = new Map<number, number[]>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_MINTS_PER_HOUR = 5;

async function fetchUserData(fid: number) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/user?fid=${fid}`;

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }

  const data = await response.json();
  return data.user;
}

function checkRateLimit(fid: number): boolean {
  const now = Date.now();
  const attempts = mintAttempts.get(fid) || [];

  // Filter out old attempts outside the window
  const recentAttempts = attempts.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);

  if (recentAttempts.length >= MAX_MINTS_PER_HOUR) {
    return false;
  }

  // Add current attempt
  recentAttempts.push(now);
  mintAttempts.set(fid, recentAttempts);

  return true;
}

async function uploadToPinata(imageBuffer: Buffer, filename: string): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([new Uint8Array(imageBuffer)], { type: "image/png" });
  formData.append("file", blob, filename);

  const pinataJWT = process.env.PINATA_JWT;
  if (!pinataJWT) {
    throw new Error("PINATA_JWT environment variable not set");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${pinataJWT}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinata upload error:", errorText);
    throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

async function uploadMetadataToPinata(metadata: object): Promise<string> {
  const pinataJWT = process.env.PINATA_JWT;
  if (!pinataJWT) {
    throw new Error("PINATA_JWT environment variable not set");
  }

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${pinataJWT}`,
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinata metadata upload error:", errorText);
    throw new Error(`Failed to upload metadata to Pinata: ${response.statusText}`);
  }

  const data = await response.json();
  return data.IpfsHash;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fid, token } = body;

    if (!fid || !token) {
      return NextResponse.json({ error: "Missing fid or token" }, { status: 400 });
    }

    // Step 1: Verify Quick Auth token
    const domain = process.env.NEXT_PUBLIC_URL?.replace(/https?:\/\//, "") || "localhost:3000";

    let authenticatedFid: number;
    try {
      const payload = await client.verifyJwt({
        token: token,
        domain: domain,
      });
      authenticatedFid = payload.sub;
    } catch (error) {
      if (error instanceof Errors.InvalidTokenError) {
        return NextResponse.json({ error: "Invalid authentication token" }, { status: 401 });
      }
      throw error;
    }

    // Step 2: Check if authenticated FID matches requested FID
    if (authenticatedFid !== fid) {
      return NextResponse.json({ error: "You can only mint your own profile" }, { status: 403 });
    }

    // Step 3: Check rate limit
    if (!checkRateLimit(fid)) {
      return NextResponse.json(
        {
          error: `Rate limit exceeded. Maximum ${MAX_MINTS_PER_HOUR} mints per hour.`,
        },
        { status: 429 },
      );
    }

    // Step 4: Fetch user data
    const user = await fetchUserData(fid);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Step 5: Generate profile image using shared utility
    const imageResponse = await generateProfileImage({ user });
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Step 6: Upload image to Pinata
    const filename = `whoiswho-${fid}-${Date.now()}.png`;
    const imageHash = await uploadToPinata(imageBuffer, filename);

    // Step 7: Create and upload metadata
    const currentDate = new Date().toISOString().split("T")[0];
    const metadata = {
      name: `WhoIsWho Profile - @${user.username}`,
      description: `Verified Farcaster profile snapshot for @${user.username} (FID: ${fid}) captured on ${currentDate}. This immutable NFT preserves the user's reputation metrics at this moment in time.`,
      image: `ipfs://${imageHash}`,
      external_url: `https://warpcast.com/${user.username}`,
      attributes: [
        {
          trait_type: "FID",
          value: fid,
        },
        {
          trait_type: "Username",
          value: user.username,
        },
        {
          trait_type: "Neynar Score",
          value: user.score || 0,
        },
        {
          trait_type: "Mint Date",
          value: currentDate,
        },
        {
          trait_type: "Followers",
          value: user.farcaster?.user?.followerCount || user.follower_count || 0,
        },
        {
          trait_type: "Following",
          value: user.farcaster?.user?.followingCount || user.following_count || 0,
        },
      ],
    };

    const metadataHash = await uploadMetadataToPinata(metadata);

    // Step 8: Return success with IPFS hashes
    return NextResponse.json(
      {
        success: true,
        imageHash,
        metadataHash,
        imageUrl: `https://gateway.pinata.cloud/ipfs/${imageHash}`,
        metadataUrl: `https://gateway.pinata.cloud/ipfs/${metadataHash}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Snapshot generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: `Failed to generate snapshot: ${errorMessage}` }, { status: 500 });
  }
}
