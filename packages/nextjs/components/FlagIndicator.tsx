"use client";

import { InfoTooltip } from "./ui";
import type { FlagLevel } from "~~/utils/profileMetrics";

interface FlagIndicatorProps {
  level: FlagLevel;
  title: string;
  value: string | number;
  subtitle?: string;
  explanation?: React.ReactNode;
}

/**
 * FlagIndicator Component
 * Displays a color-coded risk indicator with optional tooltip explanation
 */
export function FlagIndicator({ level, title, value, subtitle, explanation }: FlagIndicatorProps) {
  // Determine color classes based on level
  const colorClasses = {
    green: "bg-success/10 border-success text-success",
    yellow: "bg-warning/10 border-warning text-warning",
    red: "bg-error/10 border-error text-error",
  };

  const badgeClasses = {
    green: "badge-success",
    yellow: "badge-warning",
    red: "badge-error",
  };

  const levelLabels = {
    green: "Low Risk",
    yellow: "Medium Risk",
    red: "High Risk",
  };

  return (
    <div className={`rounded-xl border-2 p-4 ${colorClasses[level]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center align-middle gap-2">
          <h4 className="font-semibold text-sm m-0">{title}</h4>
          {explanation && (
            <InfoTooltip
              title={
                <>
                  <span className="text-base-content">{title}</span>
                </>
              }
            >
              {explanation}
            </InfoTooltip>
          )}
        </div>
      </div>

      <div className="mt-2">
        <div className="text-2xl font-bold font-mono">{value}</div>
        {subtitle && <div className="text-sm opacity-80 mt-1">{subtitle}</div>}
      </div>

      <div className="mt-3">
        <span className={`badge ${badgeClasses[level]} badge-lg`}>{levelLabels[level]}</span>
      </div>
    </div>
  );
}
