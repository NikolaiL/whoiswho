"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ClankerTokens } from "./ClankerTokens";
import { FlagIndicator } from "./FlagIndicator";
import { useMiniapp } from "./MiniappProvider";
import { StremeTokens } from "./StremeTokens";
import { DeBankIcon, ProBadgeIcon, ZapperIcon } from "./icons";
import { Alert, Avatar, Badge, Card, CardBody, InfoTooltip } from "./ui";
import { LoadingScreen } from "./ui/Loading";
import { sdk } from "@farcaster/miniapp-sdk";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ArrowUpIcon, CheckIcon, ClipboardDocumentIcon, ShareIcon } from "@heroicons/react/24/outline";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useCreatorRewards } from "~~/hooks/useCreatorRewards";
import { useFarcasterUser } from "~~/hooks/useFarcasterUser";
import { useQuotientScore } from "~~/hooks/useQuotientScore";
import { calculateReward, formatTimeRemaining } from "~~/types/creator-rewards";
import { getQuotientScoreLevel } from "~~/types/quotient";
import { transformImgurUrl } from "~~/utils/generateProfileImage";
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
  const { data: quotientData, isLoading: isLoadingQuotient } = useQuotientScore({ fid });
  const { data: creatorRewardsData, isLoading: isLoadingCreatorRewards } = useCreatorRewards({ fid });
  const {
    openLink,
    openProfile,
    composeCast,
    isReady: isMiniappReady,
    user: miniappUser,
    context: miniappContext,
  } = useMiniapp();
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
      let text = `Here is @${user.username}'s profile on WhoIsWho:\n\nVerify reputation, check flags, and avoid spam accounts - WhoIsWho by @nikolaii.eth\n\nLike it? Vote for it: https://devfolio.co/projects/farcaster-user-stats-miniapp-fc7c `;
      if (fid == miniappUser?.fid) {
        text = `Here is my profile on WhoIsWho:\n\nVerify reputation, check flags, and avoid spam accounts - WhoIsWho by @nikolaii.eth\n\nLike it? Vote for it: https://devfolio.co/projects/farcaster-user-stats-miniapp-fc7c `;
      }
      await composeCast({
        text,
        embeds: [profileUrl],
      });
      console.log("casted", text);
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
      // delete image and meta files from pinata

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
      // <Alert variant="warning" title="User not found">
      //   No user found with FID {fid}
      // </Alert>
      <LoadingScreen message="Loading user profile..." />
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

  const totalFollowerCount = user.follower_count || 0;
  const totalFollowingCount = user.following_count || 0;

  let clientName = "Farcaster";
  if (miniappContext?.client?.clientFid == 309857) {
    clientName = "Base App";
  }

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
              <Avatar src={transformImgurUrl(user.pfp_url || FALLBACK_AVATAR)} alt={user.display_name} size="lg" />
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
              <div className="text-sm text-base-content/60">
                Followers
                <InfoTooltip title="Followers">
                  Excluding bots and spammy accounts (Excluding accounts with Spam Score 0)
                </InfoTooltip>
              </div>
              <div className="text-xl font-bold mb-1">{followerCount.toLocaleString()}</div>
              {totalFollowerCount > followerCount && (
                <>
                  <div className="text-xs text-base-content/40 flex items-center gap-1 justify-center">
                    Total Followers
                    <InfoTooltip title="Total Followers">
                      Including all followers, regardless of account quality or spam activity (Including accounts with
                      Spam Score 0)
                    </InfoTooltip>
                  </div>
                  <div className="text-base text-base-content/50 font-bold -mt-1">
                    {totalFollowerCount.toLocaleString()}
                  </div>
                </>
              )}
            </div>
            <div className="flex-1 text-center">
              <div className="text-sm text-base-content/60">
                Following
                <InfoTooltip title="Following">
                  Excluding bots and spammy accounts (Excluding accounts with Spam Score 0)
                </InfoTooltip>
              </div>
              <div className="text-xl font-bold mb-1">{followingCount.toLocaleString()}</div>
              {totalFollowingCount > followingCount && (
                <>
                  <div className="text-xs text-base-content/40">
                    Total Following
                    <InfoTooltip title="Total Following">
                      Including all following, regardless of account quality or spam activity (Including accounts with
                      Spam Score 0)
                    </InfoTooltip>
                  </div>
                  <div className="text-base text-base-content/50 font-bold -mt-1">
                    {totalFollowingCount.toLocaleString()}
                  </div>
                </>
              )}
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
            className="btn btn-primary btn-sm shrink-0 w-full sm:w-auto"
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
                src={`/profile/${user.fid}/opengraph-image?t=${Date.now()}`}
                alt={`${user.display_name} (@${user.username}) profile card`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Buttons Grid */}
            <div className={miniappUser?.fid === fid ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : ""}>
              {/* Share Button */}
              <button onClick={handleShare} disabled={isSharing} className="btn btn-primary w-full gap-2">
                <ShareIcon className="w-5 h-5" />
                {isSharing ? "Opening Composer..." : `Share on ${clientName}`}
              </button>

              {/* Mint Button, should only show if fid is the same as the miniapp user fid */}
              {miniappUser?.fid === fid && (
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
                      Mint as NFT {mintPrice && mintPrice > 0n ? `(${formatEther(mintPrice)} ETH)` : "(🔑Free Today)"}
                    </>
                  )}
                </button>
              )}
            </div>

            {miniappUser?.fid === fid && (
              <>
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
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* SECTION 2.7: FARCASTER CREATOR REWARDS */}
      <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Farcaster Creator Rewards
              <InfoTooltip title="How to Earn?">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0">
                      <span className="text-lg">✍️</span>
                      <strong>Cast and Engage</strong>
                    </div>
                    <p className="text-xs">
                      Your score is based on the engagement your casts receive, adjusted by the number of followers.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0">
                      <span className="text-lg">🏆</span>
                      <strong>Get Ranked → Top 3000</strong>
                    </div>
                    <p className="text-xs">
                      Each week, the top 3000 accounts with the highest scores receive USDC rewards.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0">
                      <span className="text-lg">💰</span>
                      <strong>Receive USDC</strong>
                    </div>
                    <p className="text-xs mb-0">Rewards are sent to your connected Ethereum address on Base.</p>
                  </div>
                </div>
              </InfoTooltip>
            </h3>
          </div>

          {isLoadingCreatorRewards ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : creatorRewardsData?.scores && creatorRewardsData?.metadata ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                {/* Your Score */}
                <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    Score
                    <InfoTooltip title="Current Period Score">
                      <p>Your score for the current reward period.</p>
                    </InfoTooltip>
                  </h4>
                  <div className="text-2xl font-bold text-primary">
                    {creatorRewardsData.scores.currentPeriodScore.toLocaleString()}
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">Current period</div>
                </div>

                {/* Your Rank */}
                <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    Rank
                    <InfoTooltip title="Current Period Rank">
                      <p>Your ranking among all Farcaster creators for the current period.</p>
                    </InfoTooltip>
                  </h4>
                  <div className="text-2xl font-bold text-primary">
                    {creatorRewardsData?.scores?.currentPeriodRank
                      ? `#${creatorRewardsData.scores.currentPeriodRank.toLocaleString()}`
                      : "-"}
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">Global ranking</div>
                </div>

                {/* Round Ends In */}
                <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    Round Ends In
                    <InfoTooltip title="Period End">
                      <p>Time remaining until the current reward period ends.</p>
                    </InfoTooltip>
                  </h4>
                  <div className="text-2xl font-bold text-warning">
                    {formatTimeRemaining(creatorRewardsData.metadata.currentPeriodEndTimestamp)}
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">
                    {new Date(creatorRewardsData.metadata.currentPeriodEndTimestamp).toLocaleDateString()}
                  </div>
                </div>

                {/* Your Reward */}
                <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    Reward
                    <InfoTooltip title="Estimated Reward">
                      <p>
                        Estimated USDC reward based on your current rank. Final rewards are distributed at the end of
                        each period.
                      </p>
                    </InfoTooltip>
                  </h4>
                  <div className="text-2xl font-bold text-success">
                    {calculateReward(
                      creatorRewardsData?.scores?.currentPeriodRank || 0,
                      creatorRewardsData?.metadata?.tiers || [],
                    ).toFixed(2)}{" "}
                    <span className="text-base">USDC</span>
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">Estimated payout</div>
                </div>
              </div>

              {/* Previous Period Stats (collapsed by default) */}
              <details className="mt-4 collapse collapse-arrow border border-base-300 bg-base-200/30">
                <summary className="collapse-title text-sm font-medium">Previous Period Stats</summary>
                <div className="collapse-content">
                  <div className="pt-2 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-base-content/70">Previous Score:</span>
                      <span className="text-sm font-mono">
                        {creatorRewardsData?.scores?.previousPeriodScore
                          ? creatorRewardsData.scores.previousPeriodScore.toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-base-content/70">All-Time Score:</span>
                      <span className="text-sm font-mono">
                        {creatorRewardsData?.scores?.allTimeScore
                          ? creatorRewardsData.scores.allTimeScore.toLocaleString()
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </details>
            </>
          ) : (
            <div className="text-center py-8 text-base-content/50">No Creator Rewards data available</div>
          )}
        </CardBody>
      </Card>

      {/* SECTION 2.8: QUOTIENT SCORE */}
      <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Quotient Score
              <InfoTooltip title="What is Quotient Score?">
                <p>
                  <strong>Quotient Score</strong> is a variation of the PageRank algorithm optimized for Farcaster,
                  measuring momentum and relevance based on the quantity and quality of incoming engagement.
                </p>
                <p className="mt-2">
                  The algorithm weights recent interactions more heavily and ignores follower counts to avoid advantages
                  from automated/spam followers, focusing instead on genuine engagement patterns.
                </p>
                <p className="mt-2">
                  <strong>Score Tiers:</strong>
                </p>
                <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                  <li className="text-success">🌟 ≥ 0.9: Exceptional - Platform superstars, maximum influence</li>
                  <li className="text-success">💎 0.8-0.89: Elite - Top-tier creators, community leaders</li>
                  <li className="text-success">🔑 0.75-0.79: Influential - High-quality content, strong network</li>
                  <li className="text-success">✅ 0.6-0.74: Active - Regular contributors, solid engagement</li>
                  <li className="text-warning">⚠️ 0.5-0.59: Casual - Occasional users, low engagement</li>
                  <li className="text-error">❌ &lt; 0.5: Inactive/Spam - Bot accounts, farmers, inactive users</li>
                </ul>
                <p className="text-xs opacity-70 italic mt-2 mb-0">
                  Data provided by{" "}
                  <a
                    href="https://docs.quotient.social"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Quotient
                  </a>
                </p>
              </InfoTooltip>
            </h3>
          </div>

          {isLoadingQuotient ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : quotientData ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    Score
                    <InfoTooltip title="Quotient Score">
                      <p>
                        A normalized score (0-1) measuring account momentum and relevance based on the quality of
                        incoming engagement.
                      </p>
                      <p className="mt-2">
                        <strong>Score Tiers:</strong>
                      </p>
                      <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                        <li className="text-success">🌟 ≥ 0.9: Exceptional - Platform superstars, maximum influence</li>
                        <li className="text-success">💎 0.8-0.89: Elite - Top-tier creators, community leaders</li>
                        <li className="text-success">
                          🔑 0.75-0.79: Influential - High-quality content, strong network
                        </li>
                        <li className="text-success">✅ 0.6-0.74: Active - Regular contributors, solid engagement</li>
                        <li className="text-warning">
                          ⚠️ 0.5-0.59: Casual - Occasional users, low engagement. Potentially spam or bot accounts.
                        </li>
                        <li className="text-error">
                          ❌ &lt; 0.5: Inactive/Spam - Bot accounts, farmers, inactive users
                        </li>
                      </ul>
                    </InfoTooltip>
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <div
                      className={`text-2xl font-bold ${
                        getQuotientScoreLevel(quotientData.quotientScore).level === "success"
                          ? "text-success"
                          : getQuotientScoreLevel(quotientData.quotientScore).level === "warning"
                            ? "text-warning"
                            : "text-error"
                      }`}
                    >
                      {quotientData.quotientScore.toFixed(3)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant={getQuotientScoreLevel(quotientData.quotientScore).level}
                      size="sm"
                      className="inline-block"
                    >
                      <span className="flex items-center gap-1">
                        <span>{getQuotientScoreLevel(quotientData.quotientScore).label}</span>
                      </span>
                    </Badge>
                  </div>
                  <div className="text-xs text-base-content/60 mt-2">
                    {getQuotientScoreLevel(quotientData.quotientScore).description}
                  </div>
                </div>

                <div className="rounded-xl border-2 border-base-300 p-4 bg-base-200/50">
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                    Rank
                    <InfoTooltip title="Quotient Rank">
                      <p>The user&apos;s ranking among all Farcaster users based on Quotient Score.</p>
                    </InfoTooltip>
                  </h4>
                  <div className="text-2xl font-bold text-primary">#{quotientData.quotientRank.toLocaleString()}</div>
                  <div className="text-xs text-base-content/60 mt-2">Global ranking</div>
                </div>
              </div>
              <div className="w-full">
                <button
                  onClick={() => openLink(new URL("https://" + quotientData.quotientProfileUrl).toString())}
                  className="btn btn-primary w-full mt-1"
                >
                  View on Quotient
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-base-content/50">No Quotient Score data available</div>
          )}
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

      {/* SECTION 5: STREME TOKENS */}
      <StremeTokens fid={user.fid} />
    </>
  );
}
