import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { generateProfileImage } from "~~/utils/generateProfileImage";

export const runtime = "nodejs";
export const alt = "Farcaster User Profile";
export const size = {
  width: 1200,
  height: 800,
};
export const contentType = "image/jpeg";
export const revalidate = 600; // Revalidate every 10 minutes

async function fetchUserData(fid: string) {
  // Use our own API endpoint which fetches from both Neynar and Farcaster
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const apiUrl = `${baseUrl}/api/user?fid=${fid}`;
  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    next: { revalidate }, // 10 minutes to match image revalidation
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user || null;
}

export default async function Image({ params }: { params: Promise<{ fid: string }> }) {
  const { fid } = await params;
  console.log(new Date().toISOString(), "Generating OG for fid:", fid);
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
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
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

  // Use the shared utility function to generate the profile image
  const imageResponse = await generateProfileImage({ user, size });

  // Convert ImageResponse (PNG) to JPEG with sharp for smaller file size
  const pngBuffer = Buffer.from(await imageResponse.arrayBuffer());
  const jpegBuffer = await sharp(pngBuffer)
    .jpeg({
      quality: 85, // Good balance between quality and file size
      progressive: true, // Progressive JPEG for better loading experience
      mozjpeg: true, // Use mozjpeg for better compression
    })
    .toBuffer();

  return new Response(new Uint8Array(jpegBuffer), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
    },
  });
}
