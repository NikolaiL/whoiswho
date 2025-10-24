/**
 * Type definitions for Farcaster user search
 */

export interface SearchUserPfp {
  url: string;
  verified: boolean;
}

export interface SearchUserProfile {
  bio?: {
    text: string;
    mentions?: any[];
    channelMentions?: any[];
  };
  location?: {
    placeId: string;
    description: string;
  };
  accountLevel?: string;
}

export interface SearchUser {
  fid: number;
  displayName: string;
  username: string;
  pfp?: SearchUserPfp;
  profile?: SearchUserProfile;
  followerCount: number;
  followingCount: number;
  viewerContext?: {
    following: boolean;
    followedBy: boolean;
  };
}

export interface SearchResponse {
  users: SearchUser[];
}
