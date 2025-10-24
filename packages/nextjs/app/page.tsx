"use client";

import { Suspense, useEffect, useState } from "react";
//import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { NextPage } from "next";
//import { useAccount } from "wagmi";
//import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
//import { Address } from "~~/components/scaffold-eth";
import { FarcasterUserProfile } from "~~/components/FarcasterUserProfile";
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

  // Get FID from URL query parameter or use user's FID or default
  const fidFromUrl = searchParams.get("fid");
  const sanitizedFid = sanitizeFid(fidFromUrl);
  const initialFid = sanitizedFid ?? user?.fid ?? 0;

  const [selectedFid, setSelectedFid] = useState(initialFid);

  // Update selected FID when URL parameter changes
  useEffect(() => {
    const sanitized = sanitizeFid(fidFromUrl);
    if (sanitized !== null) {
      setSelectedFid(sanitized);
    }
  }, [fidFromUrl]);

  // Use miniapp user's FID as default if no FID is set
  useEffect(() => {
    // Only set miniapp user's FID if:
    // 1. No URL parameter is present
    // 2. No valid FID is currently selected (0 or invalid)
    // 3. Miniapp user data is available
    if (!fidFromUrl && (!selectedFid || selectedFid === 0) && user?.fid) {
      setSelectedFid(user.fid);
      router.push(`/?fid=${user.fid}`, { scroll: false });
    }
  }, [user?.fid, fidFromUrl, selectedFid, router]);

  // Handle FID selection - update both state and URL
  const handleSelectFid = (fid: number) => {
    setSelectedFid(fid);
    // Update URL with new FID
    router.push(`/?fid=${fid}`, { scroll: false });
  };

  return (
    <div className="flex items-center flex-col grow pt-10">
      <div className="px-5 w-full">
        {/* Search for Farcaster users */}
        <FarcasterUserSearch onSelectUser={handleSelectFid} />

        {/* Display selected user profile */}
        <FarcasterUserProfile fid={selectedFid} />
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
