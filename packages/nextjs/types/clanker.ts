/**
 * Type definitions for Clanker API responses
 * Based on: https://clanker.world/api/tokens
 */

export interface ClankerToken {
  id: number;
  name: string;
  symbol: string;
  img_url: string;
  contract_address: string;
  related?: {
    market?: {
      marketCap: number;
      priceChangePercent24h: number;
    };
  };
}

export interface ClankerTokensResponse {
  data: ClankerToken[];
  total: number;
}
