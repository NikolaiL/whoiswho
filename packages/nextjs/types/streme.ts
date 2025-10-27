/**
 * Type definitions for Streme API responses
 * Based on: https://api.streme.fun/api/tokens/fid/{fid}
 */

export interface StremeToken {
  id: number;
  name: string;
  symbol: string;
  img_url: string;
  contract_address: string;
  marketData?: {
    marketCap: number;
    priceChange24h: number;
  };
}

export interface StremeTokensResponse {
  tokens: StremeToken[];
  total: number;
}
