"use client";

import { useRouter } from "next/navigation";
import { FarcasterUserProfile } from "~~/components/FarcasterUserProfile";
import { FarcasterUserSearch } from "~~/components/FarcasterUserSearch";
import { useMiniapp } from "~~/components/MiniappProvider";

interface ProfilePageClientProps {
  fid: number;
}

export function ProfilePageClient({ fid }: ProfilePageClientProps) {
  const router = useRouter();
  const { user } = useMiniapp();

  const handleSelectFid = (newFid: number) => {
    router.push(`/profile/${newFid}`);
  };

  return (
    <div className="flex items-center flex-col grow pt-4">
      <div className="px-5 w-full">
        {/* Search for Farcaster users */}
        <FarcasterUserSearch onSelectUser={handleSelectFid} currentFid={fid} miniappUserFid={user?.fid} />

        {/* Display selected user profile */}
        <FarcasterUserProfile fid={fid} />
      </div>
    </div>
  );
}
