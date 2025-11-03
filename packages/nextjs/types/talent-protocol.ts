/**
 * Type definitions for Talent Protocol API responses
 * Based on: https://docs.talentprotocol.com/docs/developers/talent-api/api-reference
 */

export interface TalentProtocolScore {
  last_calculated_at: string;
  points: number;
  rank_position: number;
  slug: string;
}

export interface TalentProtocolScoresResponse {
  scores: TalentProtocolScore[];
}

export interface TalentProtocolAccount {
  connected_at: string;
  identifier: string;
  imported_from: string | null;
  owned_since: string | null;
  source: string;
  source_type: string | null;
  username: string | null;
}

export interface TalentProtocolProfile {
  id: string;
  onchain_id: number;
  name: string;
  display_name: string;
  bio: string;
  image_url: string;
  rank_position: number;
  accounts: TalentProtocolAccount[];
  // ... other fields not needed for our use case
}

export interface TalentProtocolAccountResponse {
  profile: TalentProtocolProfile;
}

/**
 * Combined response from our API endpoint
 */
export interface TalentProtocolData {
  profileId: string;
  builderScore: {
    points: number;
    rank: number;
    lastCalculated: string;
  } | null;
  creatorScore: {
    points: number;
    rank: number;
    lastCalculated: string;
  } | null;
}
