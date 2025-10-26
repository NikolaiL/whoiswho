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

// In-memory cache for generated images
interface CacheEntry {
  buffer: ArrayBuffer;
  headers: Headers;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const pendingGenerations = new Map<string, Promise<Response>>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

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

async function generateImage(fid: string): Promise<Response> {
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
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600, max-age=600",
    },
  });
}

export default async function Image({ params }: { params: Promise<{ fid: string }> }) {
  const { fid } = await params;
  const now = Date.now();

  // Check if we have a valid cached entry
  const cachedEntry = imageCache.get(fid);
  if (cachedEntry && now - cachedEntry.timestamp < CACHE_DURATION) {
    console.log(new Date().toISOString(), "✅ Cache HIT for fid:", fid);
    // Return a new Response from the cached buffer
    return new Response(cachedEntry.buffer, {
      headers: cachedEntry.headers,
    });
  }

  // Check if this image is already being generated
  if (pendingGenerations.has(fid)) {
    console.log(new Date().toISOString(), "⏳ Waiting for pending generation for fid:", fid);
    return pendingGenerations.get(fid)!;
  }

  console.log(new Date().toISOString(), "🔄 Cache MISS - Generating OG for fid:", fid);

  // Create the generation promise
  const generationPromise = (async () => {
    try {
      const response = await generateImage(fid);

      // Read the response body as buffer
      const buffer = await response.arrayBuffer();

      // Store buffer and headers in cache
      imageCache.set(fid, {
        buffer,
        headers: response.headers,
        timestamp: now,
      });

      console.log(
        new Date().toISOString(),
        "💾 Cached response for fid:",
        fid,
        "- Size:",
        (buffer.byteLength / 1024).toFixed(1),
        "KB",
      );

      // Clean up old cache entries (keep cache size manageable)
      if (imageCache.size > 500) {
        const entries = Array.from(imageCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        // Remove oldest 20 entries
        for (let i = 0; i < 20; i++) {
          imageCache.delete(entries[i][0]);
        }
        console.log(new Date().toISOString(), "🧹 Cleaned up old cache entries, current size:", imageCache.size);
      }

      // Return a new Response with the buffer
      return new Response(buffer, {
        headers: response.headers,
      });
    } finally {
      // Remove from pending after generation completes
      pendingGenerations.delete(fid);
    }
  })();

  // Store the promise to prevent duplicate generations
  pendingGenerations.set(fid, generationPromise);

  return generationPromise;
}
