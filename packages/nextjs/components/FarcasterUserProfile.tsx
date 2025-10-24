"use client";

import { useState } from "react";
import { useMiniapp } from "./MiniappProvider";
import { getScoreQuality } from "./UserQualityBadge";
import { DeBankIcon, ProBadgeIcon, ZapperIcon } from "./icons";
import { Alert, Avatar, Badge, Card, CardBody, Stat, StatsContainer } from "./ui";
import { LoadingScreen } from "./ui/Loading";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { useFarcasterUser } from "~~/hooks/useFarcasterUser";
import { miniappPatterns } from "~~/styles/design-system";
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
  const { openLink } = useMiniapp();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

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

  if (isLoading) {
    return <LoadingScreen message="Loading user profile..." />;
  }

  if (error) {
    return (
      <Alert variant="error" title="Error loading profile">
        {error}
      </Alert>
    );
  }

  if (!user) {
    return <Alert variant="info">No user data available</Alert>;
  }

  const userScore = user.experimental?.neynar_user_score;
  const scoreQuality = getScoreQuality(userScore);

  return (
    <Card variant="base" padding="default" hover className="max-w-2xl mx-auto my-6">
      <CardBody>
        {/* Profile Header */}
        <div className={miniappPatterns.profileHeader}>
          <Avatar src={user.pfp_url || FALLBACK_AVATAR} alt={user.display_name} size="lg" />
          <div className="flex-1">
            <div className="flex items-start gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{user.display_name}</h2>
                {user.pro?.status === "subscribed" && <ProBadgeIcon className="w-5 h-5 flex-shrink-0" />}
              </div>
              {user.power_badge && (
                <Badge variant="primary" size="sm" className="gap-1">
                  <CheckBadgeIcon className="w-3 h-3" />
                  Power User
                </Badge>
              )}
            </div>
            <p className="text-sm text-base-content/70 mt-1">@{user.username}</p>
            <p className="text-xs text-base-content/50 mt-0.5">FID: {user.fid}</p>
          </div>
        </div>

        {/* Bio */}
        {user.profile?.bio?.text && <p className="mt-4 text-base leading-relaxed">{user.profile.bio.text}</p>}

        {/* User Quality Score */}
        <div className={miniappPatterns.scoreContainer}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">User Quality Score</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono">
                {userScore !== undefined ? userScore.toFixed(2) : "N/A"}
              </span>
              <Badge
                variant={
                  scoreQuality.level === "excellent" || scoreQuality.level === "good"
                    ? "success"
                    : scoreQuality.level === "decent"
                      ? "info"
                      : scoreQuality.level === "low"
                        ? "warning"
                        : "ghost"
                }
                size="md"
              >
                {scoreQuality.label}
              </Badge>
            </div>
          </div>

          <Alert variant="info" showIcon={false} className="text-xs">
            <div className="space-y-2">
              <p>
                <strong>What is this?</strong> The Neynar score (0-1) measures account quality based on network
                behavior. Higher scores indicate more valuable contributions.
              </p>
              <p>
                <strong>Thresholds:</strong> 0.9+ Excellent · 0.7+ High Quality · 0.55+ Good · &lt;0.55 Low Quality
              </p>
              <p className="italic opacity-70">
                Note: This is NOT proof of humanity. It measures value added to the network. Scores update weekly.
              </p>
            </div>
          </Alert>
        </div>

        {/* Social Stats */}
        <StatsContainer className="w-full">
          <Stat title="Followers" value={user.follower_count.toLocaleString()} />
          <Stat title="Following" value={user.following_count.toLocaleString()} />
        </StatsContainer>

        {/* Verified Addresses */}
        {user.verified_addresses && user.verified_addresses.eth_addresses.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              Verified Addresses
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
                            className="w-10 h-10  !min-h-0 !p-0 btn btn-circle btn-ghost hover:btn-primary flex items-center justify-center transition-all"
                            title="View on DeBank"
                          >
                            <DeBankIcon className="w-4 h-4 shrink-0" />
                          </button>
                          <button
                            onClick={() => openLink(`https://zapper.xyz/account/${address}`)}
                            className="w-10 h-10  !min-h-0 !p-0 btn btn-circle btn-ghost hover:btn-primary flex items-center justify-center transition-all"
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
          </div>
        )}
      </CardBody>
    </Card>
  );
}
