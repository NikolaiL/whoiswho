"use client";

import { Suspense, useEffect } from "react";
//import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { NextPage } from "next";
//import { useAccount } from "wagmi";
//import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
//import { Address } from "~~/components/scaffold-eth";
import { FarcasterUserSearch } from "~~/components/FarcasterUserSearch";
import { useMiniapp } from "~~/components/MiniappProvider";

//import { MiniappUserInfo } from "~~/components/MiniappUserInfo";

function HomeContent() {
  //const { address: connectedAddress } = useAccount();
  const { user } = useMiniapp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sanitize and validate FID from URL
  const sanitizeFid = (fidString: string | null): number | null => {
    if (!fidString) return null;

    // Remove any non-numeric characters
    const cleaned = fidString.trim().replace(/[^0-9]/g, "");
    if (cleaned === "") return null;

    const parsed = parseInt(cleaned, 10);

    // Validate: must be a positive integer within reasonable bounds
    // FIDs start at 1 and are currently in the hundreds of thousands
    if (isNaN(parsed) || parsed < 1 || parsed > 999999999) {
      return null;
    }

    return parsed;
  };

  // Get FID from URL query parameter
  const fidFromUrl = searchParams.get("fid");
  const sanitizedFid = sanitizeFid(fidFromUrl);

  // Auto-redirect to miniapp user's profile if no FID in URL
  useEffect(() => {
    if (!sanitizedFid && user?.fid) {
      router.push(`/profile/${user.fid}`);
    }
  }, [user?.fid, sanitizedFid, router]);

  // Handle FID selection - redirect to profile page
  const handleSelectFid = (fid: number) => {
    router.push(`/profile/${fid}`);
  };

  return (
    <div className="flex items-center flex-col grow pt-4">
      <div className="px-5 w-full">
        {/* Search for Farcaster users */}
        <FarcasterUserSearch onSelectUser={handleSelectFid} />

        {/* Welcome message when no user is selected */}
        {!fidFromUrl && (
          <div className="max-w-2xl mx-auto my-12 text-center">
            <h1 className="text-4xl font-bold mb-4">🔍 WhoIsWho</h1>
            <p className="text-xl text-base-content/70 mb-2">Verify Farcaster users before you engage</p>
            <p className="text-base text-base-content/50">
              Check reputation scores, verify identities, and avoid spam accounts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const Home: NextPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center flex-col grow pt-10">
          <div className="px-5 w-full">
            <div className="flex justify-center items-center min-h-[200px]">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
};

export default Home;
