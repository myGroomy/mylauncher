"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDomainStore } from "@/stores/useLauncherStore";
import type { App } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, Star, Clock, Megaphone } from "lucide-react";
import { useFeatureSettings } from "@/components/layout/FeatureSettingsProvider";
import { AppCard, getAppDisplay } from "@/components/launcher/AppCard";
import { useFeed } from "@/hooks/useFeed";

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
  const { feed } = useFeed();
  const [registryError, setRegistryError] = useState("");
  const [registryLoading, setRegistryLoading] = useState(true);
  const router = useRouter();
  const features = useFeatureSettings();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetch("/api/registry")
      .then(async (response) => {
        const result = (await response.json()) as { apps?: App[]; message?: string };
        if (!response.ok || !result.apps) {
          throw new Error(result.message || "Application registry unavailable");
        }
        if (!cancelled) setApps(result.apps);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setRegistryError(
            error instanceof Error ? error.message : "Application registry unavailable"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setRegistryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setApps]);

  const displayApps = isAuthenticated ? apps : [];
  const accessible = displayApps.filter(
    (app) => app.status === "ACTIVE" && permissions.includes(app.required_permission)
  );
  const favoriteApps = favorites
    .map((id) => accessible.find((a) => a.app_id === id))
    .filter((a): a is App => Boolean(a));
  const recent = recentApps
    .map((id) => accessible.find((a) => a.app_id === id))
    .filter((a): a is App => Boolean(a));
  const visibleAnnouncements = feed.announcements.filter(
    (a) => !dismissed.includes(a.announcement_id)
  );

  function handleOpenApp(app: App) {
    if (app.status !== "ACTIVE") return;
    pushRecentApp(app.app_id);
    router.push(`/launcher/${app.app_id.toLowerCase()}`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">
          {isAuthenticated && activeEmployee
            ? `Welcome, ${activeEmployee.name}`
            : "Applications"}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {isAuthenticated
            ? "Open a workspace — favorites and recent apps are one click away."
            : "Sign in to see your available apps."}
        </p>
      </div>

      {registryError && (
        <p className="text-sm text-rose" role="alert">
          {registryError}
        </p>
      )}

      {isAuthenticated && features.announcements && visibleAnnouncements.length > 0 && (
        <section aria-label="Announcements" className="space-y-2">
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
              <CardContent className="flex items-start gap-3 py-3">
                <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{a.title}</p>
                    <Badge variant="secondary" className="text-[10px] uppercase">
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-soft">{a.body}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-[11px] text-ink-soft"
                  onClick={() => dismissAnnouncement(a.announcement_id)}
                  aria-label={`Dismiss announcement: ${a.title}`}
                >
                  Dismiss
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>
      )}

      {isAuthenticated &&
        ((features.favorite_apps && favoriteApps.length > 0) ||
          (features.recent_apps && recent.length > 0)) && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {features.favorite_apps && favoriteApps.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Star className="h-4 w-4" aria-hidden="true" /> Favorites
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {favoriteApps.map((app) => {
                    const { Icon } = getAppDisplay(app.app_id, app.name);
                    return (
                      <Button
                        key={app.app_id}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleOpenApp(app)}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {app.name}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
            {features.recent_apps && recent.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Clock className="h-4 w-4" aria-hidden="true" /> Recent
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-0">
                  {recent.map((app) => {
                    const { Icon } = getAppDisplay(app.app_id, app.name);
                    return (
                      <Button
                        key={app.app_id}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleOpenApp(app)}
                      >
                        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        {app.name}
                      </Button>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        )}

      <section aria-label="All applications">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-mist">
          All applications
        </h2>
        {registryLoading && isAuthenticated ? (
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4"
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            <span className="sr-only">Loading applications…</span>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-lg border border-hairline bg-surface"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : displayApps.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-hairline">
            <div className="text-center">
              <Lock className="mx-auto mb-3 h-10 w-10 text-mist" aria-hidden="true" />
              <p className="text-ink-soft">No applications available</p>
              <p className="mt-1 text-xs text-mist">
                {isAuthenticated
                  ? "Your role does not grant access to any application."
                  : "Sign in with a valid account"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {displayApps.map((app, index) => (
              <AppCard
                key={app.app_id}
                app={app}
                index={index}
                onClick={handleOpenApp}
                favorite={favorites.includes(app.app_id)}
                onToggleFavorite={() => toggleFavorite(app.app_id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
