"use client";

import { useEffect, useRef, useState } from "react";
import { ProBadgeIcon } from "./icons";
import { Avatar } from "./ui";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { SearchUser } from "~~/types/farcaster-search";

interface FarcasterUserSearchProps {
  onSelectUser: (fid: number) => void;
}

// Fallback avatar for users without pfp
const FALLBACK_AVATAR = "https://farcaster.xyz/avatar.png";

/**
 * Search-as-you-type component for finding Farcaster users
 * Features debounced API calls, dropdown results, and user selection
 */
export function FarcasterUserSearch({ onSelectUser }: FarcasterUserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search effect
  useEffect(() => {
    // Don't search for empty queries
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce: wait 300ms after user stops typing
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=10`);

        if (!response.ok) {
          throw new Error("Failed to search users");
        }

        const data = await response.json();
        setResults(data.users || []);
        setIsOpen(true);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search users");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelectUser = (user: SearchUser) => {
    onSelectUser(user.fid);
    setQuery(""); // Clear search
    setIsOpen(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setError(null);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto mb-6">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <MagnifyingGlassIcon className="w-5 h-5 text-base-content/50" />
        </div>
        <input
          type="search"
          name="q"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name or FID..."
          className="input input-bordered w-full pl-12 pr-12 rounded-2xl"
          autoComplete="off"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 hover:text-error transition-colors"
            aria-label="Clear search"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        )}
        {isLoading && (
          <div className="absolute inset-y-0 right-12 flex items-center pr-4">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-base-100 border-2 border-base-300 rounded-2xl shadow-xl max-h-96 overflow-y-auto">
          {error ? (
            <div className="p-4 text-center text-error">{error}</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-base-content/50">No users found</div>
          ) : (
            <ul className="py-2">
              {results.map(user => (
                <li key={user.fid}>
                  <button
                    onClick={() => handleSelectUser(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-base-200 transition-colors text-left cursor-pointer"
                  >
                    <Avatar src={user.pfp?.url || FALLBACK_AVATAR} alt={user.displayName} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{user.displayName}</span>
                        {user.profile?.accountLevel === "pro" && <ProBadgeIcon className="w-4 h-4 flex-shrink-0" />}
                      </div>
                      <div className="text-sm text-base-content/70 truncate">@{user.username}</div>
                      <div className="text-xs text-base-content/50">FID: {user.fid}</div>
                    </div>
                    <div className="text-xs text-base-content/50 text-right">
                      <div>{user.followerCount.toLocaleString()} followers</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
