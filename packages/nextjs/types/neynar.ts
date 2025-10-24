/**
 * Type definitions for Neynar API responses
 * Based on: https://docs.neynar.com/reference/fetch-bulk-users
 */

export interface NeynarUserDehydrated {
  object: "user_dehydrated";
  fid: number;
  username: string;
  display_name: string;
  pfp_url?: string;
  custody_address: string;
  score: number;
}

export interface NeynarChannelDehydrated {
  id: string;
  name: string;
  object: "channel_dehydrated";
  image_url: string;
  viewer_context?: {
    following: boolean;
    role: "member" | "moderator" | "admin";
  };
}

export interface NeynarProfileBio {
  text: string;
  mentioned_profiles?: NeynarUserDehydrated[];
  mentioned_profiles_ranges?: Array<{
    start: number;
    end: number;
  }>;
  mentioned_channels?: NeynarChannelDehydrated[];
  mentioned_channels_ranges?: Array<{
    start: number;
    end: number;
  }>;
}

export interface NeynarLocation {
  latitude: number;
  longitude: number;
  address?: {
    city: string;
    state: string;
    state_code: string;
    country: string;
    country_code: string;
  };
  radius: number;
}

export interface NeynarProfile {
  bio: NeynarProfileBio;
  location?: NeynarLocation;
  banner?: {
    url: string;
  };
}

export interface NeynarAuthAddress {
  address: string;
  app?: NeynarUserDehydrated;
}

export interface NeynarVerifiedAddresses {
  eth_addresses: string[];
  sol_addresses: string[];
  primary?: {
    eth_address?: string;
    sol_address?: string;
  };
}

export interface NeynarVerifiedAccount {
  platform: "x" | "github";
  username: string;
}

export interface NeynarProStatus {
  status: "subscribed" | "expired" | "cancelled";
  subscribed_at: string;
  expires_at: string;
}

export interface NeynarViewerContext {
  following: boolean;
  followed_by: boolean;
  blocking: boolean;
  blocked_by: boolean;
}

export interface NeynarUser {
  object: "user";
  fid: number;
  username: string;
  display_name: string;
  custody_address: string;
  pro?: NeynarProStatus;
  pfp_url?: string;
  profile: NeynarProfile;
  follower_count: number;
  following_count: number;
  verifications: string[];
  auth_addresses: NeynarAuthAddress[];
  verified_addresses: NeynarVerifiedAddresses;
  verified_accounts?: NeynarVerifiedAccount[];
  power_badge: boolean;
  experimental?: {
    deprecation_notice?: string;
    neynar_user_score: number;
  };
  viewer_context?: NeynarViewerContext;
  score: number;
  farcaster?: {
    user?: {
      fid: number;
      displayName: string;
      username: string;
      followerCount: number;
      followingCount: number;
      pfp?: {
        url: string;
        verified: boolean;
      };
      profile?: any;
      viewerContext?: any;
    };
    collectionsOwned?: any[];
    extras?: {
      fid: number;
      custodyAddress: string;
      ethWallets?: string[];
      solanaWallets?: string[];
      walletLabels?: any[];
      publicSpamLabel?: string;
    };
  };
}

export interface NeynarUserResponse {
  user: NeynarUser;
}
