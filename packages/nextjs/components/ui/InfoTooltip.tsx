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
        className="btn btn-ghost btn-circle btn-xs !min-h-0 !h-6 !w-6 hover:bg-base-300 transition-colors flex items-center justify-center p-0"
        aria-label="More information"
        type="button"
      >
        <InformationCircleIcon className="w-4 h-4 text-base-content/60 hover:text-base-content" />
      </button>

      {isOpen && (
        <div className="fixed sm:absolute z-50 mt-2 bottom-4 sm:bottom-auto left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-80 max-w-[calc(100vw-2rem)] animate-fade-in">
          <div className="bg-base-100 border-2 border-secondary rounded-xl shadow-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-sm flex items-center gap-2">{title}</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="-mt-1 btn btn-ghost btn-xs btn-circle !min-h-0 !h-6 !w-6 flex items-center justify-center p-0 shrink-0"
                aria-label="Close"
              >
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
