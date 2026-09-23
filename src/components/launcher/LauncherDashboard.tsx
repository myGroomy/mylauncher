"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { App } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, Star, Clock, Megaphone, Activity, Server } from "lucide-react";
import { Profile } from "@/components/auth/Profile";
import { WorkContextWidget } from "@/components/launcher/WorkContextWidget";
import { useFeed } from "@/hooks/useFeed";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LauncherDashboard() {
  const apps = useDomainStore((s) => s.apps);
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const activeEmployee = useDomainStore((s) => s.activeEmployee);
  const setApps = useDomainStore((s) => s.setApps);
  const permissions = useDomainStore((s) => s.permissions);
  const favorites = useDomainStore((s) => s.favorites);
  const recentApps = useDomainStore((s) => s.recentApps);
  const dismissed = useDomainStore((s) => s.dismissedAnnouncements);
  const dismissAnnouncement = useDomainStore((s) => s.dismissAnnouncement);
  const toggleFavorite = useDomainStore((s) => s.toggleFavorite);
  const pushRecentApp = useDomainStore((s) => s.pushRecentApp);
  const { feed, loaded } = useFeed();
  const [registryError, setRegistryError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetch("/api/registry")
      .then(async (response) => {
        const result = await response.json() as { apps?: App[]; message?: string };
        if (!response.ok || !result.apps) throw new Error(result.message || "Application registry unavailable");
        if (!cancelled) setApps(result.apps);
      })
      .catch((error: unknown) => {
        if (!cancelled) setRegistryError(error instanceof Error ? error.message : "Application registry unavailable");
      });
    return () => { cancelled = true; };
  }, [isAuthenticated, setApps]);

  const displayApps = isAuthenticated ? apps : [];
  const accessible = displayApps.filter(
    (app) => app.status === "ACTIVE" && permissions.includes(app.required_permission)
  );
  const favoriteApps = favorites
    .map((id) => accessible.find((a) => a.app_id === id))
    .filter((a): a is App => Boolean(a));
  const recent = recentApps
    .map((id) => displayApps.find((a) => a.app_id === id))
    .filter((a): a is App => Boolean(a));
  const visibleAnnouncements = feed.announcements.filter((a) => !dismissed.includes(a.announcement_id));

  function handleOpenApp(app: App) {
    if (app.status !== "ACTIVE") return;
    pushRecentApp(app.app_id);
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
      {registryError && <p className="text-sm text-rose">{registryError}</p>}

      {isAuthenticated && visibleAnnouncements.length > 0 && (
        <div className="space-y-2">
          {visibleAnnouncements.map((a) => (
            <Card
              key={a.announcement_id}
              className={
                a.severity === "critical"
                  ? "border-rose/40 bg-rose/5"
                  : a.severity === "warning"
                    ? "border-amber/40 bg-amber/5"
                    : "border-accent/40 bg-accent/5"
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-ink flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4 shrink-0" />
                    {a.title}
                    <Badge variant="secondary" className="text-[10px] uppercase">{a.severity}</Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px] text-ink-soft"
                    onClick={() => dismissAnnouncement(a.announcement_id)}
                  >
                    Dismiss
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-ink-soft">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAuthenticated && (favoriteApps.length > 0 || recent.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {favoriteApps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <Star className="h-4 w-4" /> Favorites
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {favoriteApps.map((app) => (
                  <Button
                    key={app.app_id}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleOpenApp(app)}
                  >
                    {app.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
          {recent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Recent
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {recent.map((app) => (
                  <Button
                    key={app.app_id}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handleOpenApp(app)}
                  >
                    {app.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {isAuthenticated && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <Server className="h-4 w-4" /> System Status
              </CardTitle>
              <CardDescription>Registry health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className={`inline-flex items-center gap-1.5 ${registryError ? "text-rose" : "text-emerald"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${registryError ? "bg-rose" : "bg-emerald"}`} />
                  Registry {registryError ? "error" : loaded ? "OK" : "…"}
                </span>
                <span className="text-ink-soft">
                  Apps: <span className="font-mono text-ink">{displayApps.length}</span>
                </span>
                <span className="text-ink-soft">
                  Favorites: <span className="font-mono text-ink">{favorites.length}</span>
                </span>
                <span className="text-ink-soft">
                  Feed: <span className="font-mono text-ink">{loaded ? "OK" : "…"}</span>
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <Activity className="h-4 w-4" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feed.activity.length === 0 ? (
                <p className="text-xs text-mist">No activity yet.</p>
              ) : (
                <ul className="space-y-1">
                  {feed.activity.slice(0, 5).map((entry) => (
                    <li key={entry.id} className="flex items-baseline gap-2 text-xs">
                      <span className="font-mono text-ink">{entry.action}</span>
                      <span className="text-mist flex-1 truncate">{entry.details}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

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
            <AppCard
              key={app.app_id}
              app={app}
              onClick={handleOpenApp}
              favorite={favorites.includes(app.app_id)}
              onToggleFavorite={() => toggleFavorite(app.app_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AppCard({
  app,
  onClick,
  favorite,
  onToggleFavorite,
}: {
  app: App;
  onClick: (app: App) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const isActive = app.status === "ACTIVE";

  return (
    <Card
      className={`relative hover:shadow-md transition-shadow ${isActive ? "cursor-pointer hover:scale-[1.02]" : "opacity-60"}`}
      onClick={() => isActive && onClick(app)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-sm font-bold text-ink truncate">{app.name}</CardTitle>
            <CardDescription>{app.app_id}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-ash hover:text-amber"
            aria-label={favorite ? "Remove favorite" : "Add favorite"}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star className={`h-3.5 w-3.5 ${favorite ? "fill-amber text-amber" : ""}`} />
          </Button>
        </div>
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
