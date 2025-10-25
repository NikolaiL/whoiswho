"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClankerTokens } from "./ClankerTokens";
import { FlagIndicator } from "./FlagIndicator";
import { useMiniapp } from "./MiniappProvider";
import { DeBankIcon, ProBadgeIcon, ZapperIcon } from "./icons";
import { Alert, Avatar, Badge, Card, CardBody, InfoTooltip } from "./ui";
import { LoadingScreen } from "./ui/Loading";
import { sdk } from "@farcaster/miniapp-sdk";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowUpIcon, CheckIcon, ClipboardDocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useFarcasterUser } from "~~/hooks/useFarcasterUser";
import { calculateFollowerRatio, getNeynarScoreLevel, parseSpamLabel } from "~~/utils/profileMetrics";
import { notification } from "~~/utils/scaffold-eth";

interface FarcasterUserProfileProps {
  fid: number;
}

// Fallback avatar for users without pfp
const FALLBACK_AVATAR = "https://farcaster.xyz/avatar.png";

/**
 * Farcaster User Profile Component
 * Displays comprehensive user information with quality score
 * Uses the design system for consistent styling
 */
export function FarcasterUserProfile({ fid }: FarcasterUserProfileProps) {
  const { user, isLoading, error } = useFarcasterUser({ fid });
  const { openLink, openProfile, composeCast, isReady: isMiniappReady, user: miniappUser } = useMiniapp();
  const { address } = useAccount();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [mintStep, setMintStep] = useState<"idle" | "verifying" | "generating" | "uploading" | "minting" | "success">(
    "idle",
  );
  const [userMintCount, setUserMintCount] = useState<number>(0);

  // Read contract to get user's minted tokens
  const { data: userTokens } = useScaffoldReadContract({
    contractName: "WhoIsWho",
    functionName: "getUserTokens",
    args: [address],
  });

  // Read mint price
  const { data: mintPrice } = useScaffoldReadContract({
    contractName: "WhoIsWho",
    functionName: "mintPrice",
  });

  // Write contract hook
  const { writeContractAsync: mintNFT } = useScaffoldWriteContract({
    contractName: "WhoIsWho",
  });

  useEffect(() => {
    if (userTokens) {
      setUserMintCount(userTokens.length);
    }
  }, [userTokens]);

  const copyToClipboard = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);

      // Show notification using Scaffold-ETH toast
      notification.success("Copied to clipboard!");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedAddress(null);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      notification.error("Failed to copy address");
    }
  };

  const handleShare = async () => {
    if (!user) return;
    setIsSharing(true);
    try {
      const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${user.fid}`;
      await composeCast({
        text: `Check out @${user.username}'s profile on WhoIsWho:\n\nVerify reputation, check flags, and avoid spam accounts. by @nikolaii.eth\n\nLike it? Please vote for it: https://devfolio.co/projects/farcaster-user-stats-miniapp-fc7c `,
        embeds: [profileUrl],
      });
      notification.success("Cast composer opened!");
    } catch (err) {
      console.error("Failed to share:", err);
      notification.error("Failed to open cast composer");
    } finally {
      setIsSharing(false);
    }
  };

  const handleMint = async () => {
    try {
      setIsMinting(true);

      // Step 1: Check ownership
      setMintStep("verifying");
      if (!miniappUser?.fid) {
        throw new Error("Please open in Farcaster app");
      }
      if (miniappUser.fid !== fid) {
        throw new Error("You can only mint your own profile");
      }
      if (!address) {
        throw new Error("Please connect your wallet");
      }

      // Step 2: Get Quick Auth token
      const { token } = await sdk.quickAuth.getToken();

      // Step 3: Generate snapshot and upload to IPFS
      setMintStep("generating");
      const response = await fetch("/api/generate-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fid, token }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate snapshot");
      }

      const { metadataHash } = await response.json();

      // Step 4: Mint NFT on-chain
      setMintStep("minting");
      await mintNFT({
        functionName: "mint",
        args: [BigInt(fid), `ipfs://${metadataHash}`],
        value: mintPrice || 0n,
      });

      setMintStep("success");
      notification.success("NFT minted successfully!");

      // Refresh user tokens
      setTimeout(() => {
        setMintStep("idle");
        setIsMinting(false);
      }, 3000);
    } catch (error) {
      console.error("Mint error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to mint NFT";
      notification.error(errorMessage);
      setMintStep("idle");
      setIsMinting(false);
    }
  };

  // Show loading while miniapp is initializing or while fetching user data
  if (!isMiniappReady || isLoading) {
    return <LoadingScreen message="Loading user profile..." />;
  }

  if (error) {
    return (
      <Alert variant="error" title="Error loading profile">
        {error}
      </Alert>
    );
  }

  // Only show "Start Searching" when miniapp is loaded and no valid FID is selected
  if (!user && !fid) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="animate-bounce-arrow mb-6">
          <ArrowUpIcon className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Start Searching</h3>
        <p className="text-base-content/70 max-w-md">
          Use the search bar above to find Farcaster users by username, display name, or FID
        </p>
      </div>
    );
  }

  // If we have a FID but no user data, show error
  if (!user) {
    return (
      <Alert variant="warning" title="User not found">
        No user found with FID {fid}
      </Alert>
    );
  }

  // Prepare flag data
  const neynarScore = user.score || 0;
  const neynarLevel = getNeynarScoreLevel(neynarScore);

  const spamLabel = user.farcaster?.extras?.publicSpamLabel;
  const spamData = spamLabel ? parseSpamLabel(spamLabel) : null;

  const followerCount = user.farcaster?.user?.followerCount || 0;
  const followingCount = user.farcaster?.user?.followingCount || 0;
  const ratioData = calculateFollowerRatio(followerCount, followingCount);

  const handleProfileClick = () => {
    openProfile({ fid: user.fid, username: user.username });
  };

  return (
    <>
      {/* SECTION 1: USER PROFILE (BASIC INFO) */}
      <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
        <CardBody>
          <div className="flex items-start gap-4">
            <div onClick={handleProfileClick} className="cursor-pointer">
              <Avatar src={user.pfp_url || FALLBACK_AVATAR} alt={user.display_name} size="lg" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  onClick={handleProfileClick}
                  className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
                >
                  {user.display_name}
                </h2>
                {user.pro?.status === "subscribed" && (
                  <>
                    <ProBadgeIcon className="w-5 h-5 flex-shrink-0" />
                    <InfoTooltip
                      title={
                        <>
                          <ProBadgeIcon className="w-4 h-4 flex-shrink-0" />
                          What is Farcaster Pro?
                        </>
                      }
                    >
                      <p>
                        A <strong>Farcaster Pro user</strong> is a subscriber to the premium Farcaster membership, which
                        costs <strong>$120 per year</strong> and provides access to extra protocol-level features.
                      </p>
                      <p className="text-xs opacity-70 italic mb-0">
                        <strong>Note:</strong> The Pro badge only indicates that the user has purchased a premium
                        membership. It does not verify trustworthiness, reputation, or the authenticity of the account.
                        Always evaluate users based on their actions and contributions to the network.
                      </p>
                    </InfoTooltip>
                  </>
                )}
              </div>
              <p
                onClick={handleProfileClick}
                className="text-sm text-base-content/70 mt-1 cursor-pointer hover:opacity-80 transition-opacity"
              >
                @{user.username}
              </p>
              <p className="text-xs text-base-content/50 mt-0.5">FID: {user.fid}</p>
              {user.profile?.bio?.text && <p className="mt-3 text-base leading-relaxed">{user.profile.bio.text}</p>}
            </div>
          </div>

          {/* Location */}
          {user.profile?.location?.address && (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-base-content/70">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              <span>
                {user.profile.location.address.city && `${user.profile.location.address.city}, `}
                {user.profile.location.address.state && `${user.profile.location.address.state}, `}
                {user.profile.location.address.country}
              </span>
            </div>
          )}

          {/* Follower Stats */}
          <div className="flex gap-4 mt-4 pt-4 border-t border-base-300">
            <div className="flex-1 text-center">
              <div className="text-xs text-base-content/60 mb-1">Followers</div>
              <div className="text-xl font-bold">{followerCount.toLocaleString()}</div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-base-content/60 mb-1">Following</div>
              <div className="text-xl font-bold">{followingCount.toLocaleString()}</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Vote CTA */}
      <div className="max-w-2xl mx-auto my-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm">
            Like it? Help us by voting for WhoIsWho in the Base Batches 002 Hackathon! Your support means a lot.
          </p>
          <button
            onClick={() => openLink("https://devfolio.co/projects/farcaster-user-stats-miniapp-fc7c")}
            className="btn btn-primary btn-sm shrink-0"
          >
            Vote Now
          </button>
        </div>
      </div>

      {/* SECTION 2: FLAGS (RISK INDICATORS) */}
      <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
        <CardBody>
          <h3 className="font-semibold text-lg mb-4">Account Flags</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Neynar Score Flag */}
            <FlagIndicator
              level={neynarLevel}
              title="Neynar Score"
              value={neynarScore.toFixed(2)}
              explanation={
                <>
                  <p>
                    <strong>What is this?</strong> The Neynar score (0-1) measures account quality based on network
                    behavior. Higher scores indicate more valuable contributions.
                  </p>
                  <p className="mt-2">
                    <strong>Thresholds:</strong>
                  </p>
                  <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                    <li className="text-success">≥ 0.7: Low Risk</li>
                    <li className="text-warning">0.55-0.69: Medium Risk</li>
                    <li className="text-error">&lt; 0.55: High Risk</li>
                  </ul>
                </>
              }
            />

            {/* Spam Label Flag */}
            {spamData ? (
              <FlagIndicator
                level={spamData.level}
                title="Spam Score"
                value={spamData.score}
                subtitle={spamData.text}
                explanation={
                  <>
                    <p>
                      <strong>What is this?</strong> A public spam assessment from the Farcaster network indicating the
                      likelihood of spammy behavior.
                    </p>
                    <p className="mt-2">
                      <strong>Thresholds:</strong>
                    </p>
                    <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                      <li className="text-success">2: Unlikely to spam</li>
                      <li className="text-warning">1: Possible spam</li>
                      <li className="text-error">0: Likely spam</li>
                    </ul>
                  </>
                }
              />
            ) : (
              <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                <h4 className="font-semibold text-sm mb-2">Spam Score</h4>
                <div className="text-base-content/50 text-sm">No data available</div>
              </div>
            )}

            {/* Follower Ratio Flag */}
            {followerCount > 0 || followingCount > 0 ? (
              <FlagIndicator
                level={ratioData.level}
                title="Follower Ratio"
                value={ratioData.ratio.toFixed(2)}
                subtitle={ratioData.display}
                explanation={
                  <>
                    <p>
                      <strong>What is this?</strong> The ratio of followers to following (followers ÷ following). This
                      helps identify bot-like behavior patterns.
                    </p>
                    <p className="mt-2">
                      <strong>Thresholds:</strong>
                    </p>
                    <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                      <li className="text-success">≥ 0.8: Low Risk - Healthy balance, organic growth</li>
                      <li className="text-warning">0.2-0.79: Medium Risk - Building network or newer account</li>
                      <li className="text-error">&lt; 0.2: High Risk - Possible bot or follow-for-follow behavior</li>
                    </ul>
                  </>
                }
              />
            ) : (
              <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                <h4 className="font-semibold text-sm mb-2">Follower Ratio</h4>
                <div className="text-base-content/50 text-sm">No data available</div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* SECTION 2.5: WHOISWHO ID CARD */}
      <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
        <CardBody>
          <h3 className="font-semibold text-lg mb-4">WhoIsWho ID Card</h3>
          <div className="space-y-4">
            {/* OG Image Preview */}
            <div className="relative w-full aspect-[3/2] rounded-lg overflow-hidden border-2 border-base-300">
              <Image
                src={`/profile/${user.fid}/opengraph-image`}
                alt={`${user.display_name} (@${user.username}) profile card`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Share Button */}
              <button onClick={handleShare} disabled={isSharing} className="btn btn-primary w-full gap-2">
                <ShareIcon className="w-5 h-5" />
                {isSharing ? "Opening Composer..." : "Share on Farcaster"}
              </button>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={isMinting || !isMiniappReady || !address || miniappUser?.fid !== fid}
                className="btn btn-secondary w-full gap-2"
              >
                {isMinting ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {mintStep === "verifying" && "Verifying..."}
                    {mintStep === "generating" && "Generating..."}
                    {mintStep === "uploading" && "Uploading..."}
                    {mintStep === "minting" && "Minting..."}
                    {mintStep === "success" && "✓ Minted!"}
                  </>
                ) : (
                  <>
                    <ArrowUpIcon className="w-5 h-5" />
                    Mint as NFT {mintPrice && mintPrice > 0n ? `(${formatEther(mintPrice)} ETH)` : "(Free)"}
                  </>
                )}
              </button>
            </div>

            {/* Show mint count if user has minted before */}
            {userMintCount > 0 && (
              <div className="text-sm text-center text-base-content/60">
                You&apos;ve minted {userMintCount} snapshot{userMintCount !== 1 ? "s" : ""} of this profile
              </div>
            )}

            {/* Show message if viewing someone else's profile */}
            {miniappUser?.fid && miniappUser.fid !== fid && (
              <div className="text-sm text-center text-warning">You can only mint your own profile</div>
            )}

            {/* Show message if wallet not connected */}
            {!address && miniappUser?.fid === fid && (
              <div className="text-sm text-center text-info">Connect your wallet to mint NFT</div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* SECTION 3: CONNECTED WALLETS */}
      {user.verified_addresses && user.verified_addresses.eth_addresses.length > 0 && (
        <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
          <CardBody>
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              Connected Wallets
              <Badge variant="success" size="sm">
                {user.verified_addresses.eth_addresses.length}
              </Badge>
            </h3>
            <div className="overflow-x-auto">
              <table className="table w-full table-fixed">
                <colgroup>
                  <col className="w-auto" />
                  <col className="w-40" />
                </colgroup>
                <tbody>
                  {user.verified_addresses.eth_addresses.map((address, idx) => (
                    <tr key={idx} className="hover:bg-base-200/50">
                      <td className="px-3 py-1 max-w-2">
                        <code className="text-xs font-mono block truncate">{address}</code>
                      </td>
                      <td className="px-1 py-1">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => copyToClipboard(address)}
                            className="w-10 h-10 !min-h-0 !p-0 btn btn-circle btn-ghost opacity-50 hover:opacity-100 hover:btn-primary flex items-center justify-center transition-all"
                            title="Copy address"
                          >
                            {copiedAddress === address ? (
                              <CheckIcon className="w-6 h-6 shrink-0 text-success" />
                            ) : (
                              <ClipboardDocumentIcon className="w-5 h-5 shrink-0" />
                            )}
                          </button>
                          <button
                            onClick={() => openLink(`https://debank.com/profile/${address}`)}
                            className="w-10 h-10 !min-h-0 !p-0 btn btn-circle btn-ghost opacity-50 hover:opacity-100 hover:btn-primary flex items-center justify-center transition-all"
                            title="View on DeBank"
                          >
                            <DeBankIcon className="w-4 h-4 shrink-0" />
                          </button>
                          <button
                            onClick={() => openLink(`https://zapper.xyz/account/${address}`)}
                            className="w-10 h-10 !min-h-0 !p-0 btn btn-circle btn-ghost opacity-50 hover:opacity-100 hover:btn-primary flex items-center justify-center transition-all"
                            title="View on Zapper"
                          >
                            <ZapperIcon className="w-6 h-6 shrink-0" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* SECTION 4: CLANKER TOKENS */}
      <ClankerTokens fid={user.fid} />
    </>
  );
}
