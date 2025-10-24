"use client";

import { UserQualityBadge, UserQualityScoreInfo } from "./UserQualityBadge";
import { useFarcasterUser } from "~~/hooks/useFarcasterUser";

/**
 * Example component showing different ways to use the User Quality Score components
 */
export function UserQualityScoreExamples() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">User Quality Score Examples</h2>

        {/* Example 1: Different score levels */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title">Badge Examples (Different Scores)</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-32">Excellent (0.95):</span>
                <UserQualityBadge score={0.95} />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">High Quality (0.75):</span>
                <UserQualityBadge score={0.75} />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">Good (0.60):</span>
                <UserQualityBadge score={0.6} />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">Low Quality (0.40):</span>
                <UserQualityBadge score={0.4} />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">Unknown:</span>
                <UserQualityBadge score={undefined} />
              </div>
            </div>
          </div>
        </div>

        {/* Example 2: Different sizes */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title">Badge Sizes</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-32">Small:</span>
                <UserQualityBadge score={0.85} size="sm" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">Medium:</span>
                <UserQualityBadge score={0.85} size="md" />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">Large:</span>
                <UserQualityBadge score={0.85} size="lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Example 3: With and without score display */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title">With/Without Score Number</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-32">With score:</span>
                <UserQualityBadge score={0.85} showScore={true} />
              </div>
              <div className="flex items-center gap-4">
                <span className="w-32">Without score:</span>
                <UserQualityBadge score={0.85} showScore={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Example 4: Info component */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h3 className="card-title mb-4">Score Information Panel</h3>
            <UserQualityScoreInfo />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Using the score in a list of users
 */
export function UserListWithScores({ fids }: { fids: number[] }) {
  return (
    <div className="space-y-2">
      {fids.map(fid => (
        <UserListItem key={fid} fid={fid} />
      ))}
    </div>
  );
}

function UserListItem({ fid }: { fid: number }) {
  const { user, isLoading } = useFarcasterUser({ fid });

  if (isLoading) {
    return <div className="skeleton h-16 w-full"></div>;
  }

  if (!user) return null;

  const score = user.experimental?.neynar_user_score;

  return (
    <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg border">
      <div className="flex items-center gap-3">
        {user.pfp_url && (
          <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={user.pfp_url} alt={user.display_name} />
            </div>
          </div>
        )}
        <div>
          <div className="font-semibold">{user.display_name}</div>
          <div className="text-sm text-gray-500">@{user.username}</div>
        </div>
      </div>
      <UserQualityBadge score={score} size="sm" />
    </div>
  );
}

/**
 * Example: Filtering users by score threshold
 */
export function FilteredUserList({ fids, minScore = 0.55 }: { fids: number[]; minScore?: number }) {
  return (
    <div className="space-y-4">
      <div className="alert alert-info">
        <span>Showing only users with quality score ≥ {minScore}</span>
      </div>
      {fids.map(fid => (
        <FilteredUserItem key={fid} fid={fid} minScore={minScore} />
      ))}
    </div>
  );
}

function FilteredUserItem({ fid, minScore }: { fid: number; minScore: number }) {
  const { user } = useFarcasterUser({ fid });

  if (!user) return null;

  const score = user.experimental?.neynar_user_score ?? 0;

  // Filter out users below threshold
  if (score < minScore) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-base-100 rounded-lg">
      <div>
        <div className="font-semibold">{user.display_name}</div>
        <div className="text-sm text-gray-500">@{user.username}</div>
      </div>
      <UserQualityBadge score={score} />
    </div>
  );
}
