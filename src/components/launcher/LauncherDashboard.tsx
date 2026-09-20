"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { App } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Lock } from "lucide-react";
import { Profile } from "@/components/auth/Profile";
import { WorkContextWidget } from "@/components/launcher/WorkContextWidget";
import { useRouter } from "next/navigation";

export function LauncherDashboard() {
  const apps = useDomainStore((s) => s.apps);
  const getAccessibleApps = useDomainStore((s) => s.getAccessibleApps);
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const activeEmployee = useDomainStore((s) => s.activeEmployee);
  const router = useRouter();

  const displayApps = isAuthenticated ? getAccessibleApps() : apps;

  function handleOpenApp(app: App) {
    if (app.status !== "ACTIVE") return;
    router.push(`/launcher/${app.app_id.toLowerCase()}`);
  }

  return (
    <div className="space-y-6">
      {isAuthenticated && activeEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Profile />
          </div>
          <WorkContextWidget />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-ink">
          {isAuthenticated && activeEmployee
            ? `Welcome, ${activeEmployee.name}`
            : "Application Registry"}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {isAuthenticated
            ? "Your accessible applications"
            : "Sign in to see your available apps"}
        </p>
      </div>

      {displayApps.length === 0 ? (
        <div className="flex items-center justify-center h-64 rounded-lg border border-dashed border-hairline">
          <div className="text-center">
            <Lock className="h-10 w-10 text-mist mx-auto mb-3" />
            <p className="text-ink-soft">No applications available</p>
            <p className="text-xs text-mist mt-1">
              {isAuthenticated
                ? "Your role does not grant access to any application."
                : "Sign in with a valid account"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayApps.map((app) => (
            <AppCard key={app.app_id} app={app} onClick={handleOpenApp} />
          ))}
        </div>
      )}
    </div>
  );
}

function AppCard({ app, onClick }: { app: App; onClick: (app: App) => void }) {
  const isActive = app.status === "ACTIVE";

  return (
    <Card
      className={`hover:shadow-md transition-shadow ${isActive ? "cursor-pointer hover:scale-[1.02]" : "opacity-60"}`}
      onClick={() => isActive && onClick(app)}
    >
      <CardHeader>
        <CardTitle className="text-sm font-bold text-ink">{app.name}</CardTitle>
        <CardDescription>{app.app_id}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              app.status === "ACTIVE"
                ? "bg-emerald/10 text-emerald"
                : app.status === "MAINTENANCE"
                  ? "bg-amber/10 text-amber"
                  : "bg-rose/10 text-rose"
            }`}
          >
            {app.status}
          </span>
          {isActive ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
              Open <ExternalLink className="h-3 w-3" />
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-mist">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
