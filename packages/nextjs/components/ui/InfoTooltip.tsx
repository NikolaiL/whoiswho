"use client";

import { useEffect, useRef, useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

interface InfoTooltipProps {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

/**
 * InfoTooltip component
 * Shows an info icon that displays a popover with explanatory content when clicked
 */
export function InfoTooltip({ title, children, className = "" }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={tooltipRef} className={`relative inline-block ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle btn-xs hover:bg-base-300 transition-colors"
        aria-label="More information"
        type="button"
      >
        <InformationCircleIcon className="w-4 h-4 text-base-content/60 hover:text-base-content" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 w-80 animate-fade-in">
          <div className="bg-base-100 border-2 border-base-300 rounded-xl shadow-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">{title}</h4>
              <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-xs btn-circle" aria-label="Close">
                ✕
              </button>
            </div>
            <div className="text-sm text-base-content/80 space-y-2">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
