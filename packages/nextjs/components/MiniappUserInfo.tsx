"use client";

import { Avatar, Badge, Card, CardBody } from "./ui";
import { CheckCircleIcon, GlobeAltIcon } from "@heroicons/react/24/solid";
import { useMiniapp } from "~~/components/MiniappProvider";

export const MiniappUserInfo = () => {
  const { user, isReady, isMiniApp } = useMiniapp();

  return (
    <Card variant="compact" padding="compact" className="max-w-md mx-auto my-4">
      <CardBody>
        {/* Status */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-sm font-medium">MiniApp Status:</span>
          {isReady ? (
            <Badge variant={isMiniApp ? "success" : "info"} size="sm" className="gap-1">
              {isMiniApp ? <CheckCircleIcon className="w-3 h-3" /> : <GlobeAltIcon className="w-3 h-3" />}
              {isMiniApp ? "MiniApp" : "WebApp"}
            </Badge>
          ) : (
            <Badge variant="ghost" size="sm">
              <span className="loading loading-spinner loading-xs mr-1"></span>
              Loading...
            </Badge>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
            {user.pfpUrl && <Avatar src={user.pfpUrl} alt={user.displayName || "User"} size="md" />}
            <div className="flex-1 min-w-0">
              {user.displayName && <p className="font-semibold truncate">{user.displayName}</p>}
              {user.username && <p className="text-sm text-base-content/70 truncate">@{user.username}</p>}
              <p className="text-xs text-base-content/50">FID: {user.fid}</p>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};
