"use client";

import { useMiniapp } from "./MiniappProvider";
import { StremeLaunchButton } from "./StremeLaunchButton";
import { Avatar, Badge, Card, CardBody } from "./ui";
import { LoadingScreen } from "./ui/Loading";
import { RocketLaunchIcon } from "@heroicons/react/24/outline";
import { useStremeTokens } from "~~/hooks/useStremeTokens";

interface StremeTokensProps {
  fid: number;
}

// Format market cap to compact notation (e.g., $1.2M, $345.6K)
const formatMarketCap = (value: number): { text: string; isZero: boolean } => {
  if (value === 0) return { text: "-", isZero: true };

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

  return { text: formatted, isZero: false };
};

// Format percentage change with sign and color
const formatPriceChange = (change: number): { text: string; className: string; isZero: boolean } => {
  if (change === 0) return { text: "-", className: "text-base-content/40", isZero: true };

  const prefix = change >= 0 ? "+" : "";
  const className = change >= 0 ? "text-success" : "text-error";
  const text = `${prefix}${change.toFixed(2)}%`;

  return { text, className, isZero: false };
};

/**
 * Streme Tokens Component
 * Displays tokens deployed by a user on Streme
 */
export function StremeTokens({ fid }: StremeTokensProps) {
  const { tokens, total, isLoading, error } = useStremeTokens({ fid });
  const { openLink } = useMiniapp();

  if (isLoading) {
    return <LoadingScreen message="Loading Streme tokens..." />;
  }

  if (error) {
    return null; // Silently fail - tokens are optional
  }

  // Empty state - no tokens deployed
  if (total === 0) {
    return (
      <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
        <CardBody>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <RocketLaunchIcon className="w-12 h-12 text-base-content/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Streme Tokens</h3>
            <p className="text-base-content/70 mb-8 text-sm">
              This user hasn&apos;t launched any tokens on Streme yet.
            </p>
            <StremeLaunchButton />
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card variant="base" padding="default" className="max-w-2xl mx-auto my-6">
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Streme Tokens
            <Badge variant="primary" size="sm">
              {total}
            </Badge>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2 text-right">24h Change</th>
                <th className="px-3 py-2 text-right">Market Cap</th>
              </tr>
            </thead>
            <tbody>
              {tokens
                .sort((a, b) => {
                  const aMarketCap = a.marketData?.marketCap || 0;
                  const bMarketCap = b.marketData?.marketCap || 0;
                  return bMarketCap - aMarketCap; // Descending order
                })
                .map(token => {
                  const marketCap = token.marketData?.marketCap || 0;
                  const priceChange = token.marketData?.priceChange24h || 0;
                  const { text: changeText, className: changeClass } = formatPriceChange(priceChange);
                  const { text: mcapText, isZero: mcapIsZero } = formatMarketCap(marketCap);

                  return (
                    <tr key={`streme-token-${token.contract_address}`} className="hover:bg-base-200/50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => openLink(`https://streme.fun/token/${token.contract_address}`)}
                            className="flex-shrink-0 cursor-pointer"
                          >
                            <Avatar src={token.img_url} alt={token.name} size="md" />
                          </button>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => openLink(`https://streme.fun/token/${token.contract_address}`)}
                              className="font-semibold truncate block hover:text-primary cursor-pointer text-left w-full"
                            >
                              {token.name}
                            </button>
                            <button
                              onClick={() => openLink(`https://streme.fun/token/${token.contract_address}`)}
                              className="text-sm text-primary hover:underline truncate block cursor-pointer"
                            >
                              {token.symbol}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-medium ${changeClass}`}>{changeText}</span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span className={`font-semibold ${mcapIsZero ? "text-base-content/40" : ""}`}>{mcapText}</span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex sm:justify-center">
          <StremeLaunchButton />
        </div>
      </CardBody>
    </Card>
  );
}
