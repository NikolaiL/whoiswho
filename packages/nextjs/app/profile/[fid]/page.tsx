import { ProfilePageClient } from "./ProfilePageClient";
import type { Metadata } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

interface ProfilePageProps {
  params: Promise<{ fid: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ fid: string }> }): Promise<Metadata> {
  const { fid } = await params;

  // Fetch user data to get username/display name for better metadata
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (apiKey) {
      const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        next: { revalidate: 300 },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.users?.[0];

        if (user) {
          return getMetadata({
            title: `${user.display_name} (@${user.username}) - Farcaster Profile`,
            description: `Check ${user.display_name}'s reputation score, verified wallets, and activity on Farcaster. Quality score: ${user.score?.toFixed(2) || "N/A"} | ${user.follower_count} followers`,
            imageRelativePath: `/profile/${fid}/opengraph-image?t=${Date.now()}`,
            actionName: `WhoIsWho?✓`,
            actionRealtiveUrl: `/profile/${fid}`,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error fetching user metadata:", error);
  }

  // Fallback metadata if user data fetch fails
  return getMetadata({
    title: `Farcaster User Profile - FID ${fid}`,
    description: `View reputation score, verified wallets, and Clanker tokens for Farcaster user ${fid}. Check if this account is trustworthy before engaging.`,
    imageRelativePath: `/profile/${fid}/opengraph-image`,
    actionName: `WhoIsWho?✓`,
    actionRealtiveUrl: `/profile/${fid}`,
  });
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { fid } = await params;
  const fidNumber = parseInt(fid, 10);

  return <ProfilePageClient fid={fidNumber} />;
}
