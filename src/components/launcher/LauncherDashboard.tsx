"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { App } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, Star, Clock, Megaphone, Activity, Server, Package, CalendarDays, Users, Building, LayoutGrid } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useFeatureSettings } from "@/components/layout/FeatureSettingsProvider";
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
  const features = useFeatureSettings();

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
          {features.work_context && <div className="lg:col-span-2">
            <Profile />
          </div>}
          {features.work_context && <WorkContextWidget />}
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

      {isAuthenticated && features.announcements && visibleAnnouncements.length > 0 && (
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

      {isAuthenticated && ((features.favorite_apps && favoriteApps.length > 0) || (features.recent_apps && recent.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {features.favorite_apps && favoriteApps.length > 0 && (
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
          {features.recent_apps && recent.length > 0 && (
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

      {isAuthenticated && (features.system_status || features.recent_activity) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {features.system_status && <Card>
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
          </Card>}
          {features.recent_activity && <Card>
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
          </Card>}
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
    </div>
  );
}

const APP_DISPLAY: Record<string, { description: string; Icon: React.ComponentType<{ className?: string }> }> = {
  STOKIS: { description: "Inventory and stock opname", Icon: Package },
  MYSHIFT: { description: "Schedules, shifts, and branch context", Icon: CalendarDays },
  MYCUSTOMER: { description: "Customer workspace and CRM", Icon: Users },
  MYHR: { description: "Employee and HR management", Icon: Building },
};

function AppCard({
  app,
  index,
  onClick,
  favorite,
  onToggleFavorite,
}: {
  app: App;
  index: number;
  onClick: (app: App) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const isActive = app.status === "ACTIVE";
  const reduceMotion = useReducedMotion();
  const display = APP_DISPLAY[app.app_id] ?? { description: `${app.name} workspace`, Icon: LayoutGrid };
  const { Icon } = display;
  const entranceDuration = reduceMotion ? 0 : 0.5;
  const feedbackDuration = reduceMotion ? 0 : 0.25;
  const statusStyle =
    app.status === "ACTIVE"
      ? "bg-emerald/10 text-emerald"
      : app.status === "MAINTENANCE"
        ? "bg-amber/10 text-amber"
        : "bg-rose/10 text-rose";

  return (
    <motion.div
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: entranceDuration, ease: [0.4, 0, 0, 1], delay: reduceMotion ? 0 : Math.min(index * 0.05, 0.25) }}
      whileHover={isActive && !reduceMotion ? { y: -3 } : undefined}
      whileTap={isActive && !reduceMotion ? { scale: 0.99 } : undefined}
      className="h-full"
    >
      <Card className={`relative h-full transition-colors ${isActive ? "hover:border-hairline-strong" : "opacity-60"}`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-wash text-accent ring-1 ring-hairline">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <CardTitle className="truncate text-sm font-bold text-ink">{app.name}</CardTitle>
                <CardDescription className="truncate text-xs">{app.app_id}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-ash hover:text-amber"
              aria-label={favorite ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`}
              aria-pressed={favorite}
              onClick={onToggleFavorite}
            >
              <motion.span
                className="flex"
                animate={favorite && !reduceMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                transition={{ duration: feedbackDuration, ease: [0.4, 0, 0, 1] }}
              >
                <Star className={`h-4 w-4 ${favorite ? "fill-amber text-amber" : ""}`} />
              </motion.span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex h-full flex-col gap-3">
          <p className="min-h-8 text-xs leading-5 text-ink-soft">{display.description}</p>
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${statusStyle}`}>
              {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : <Lock className="h-3 w-3" aria-hidden="true" />}
              {isActive ? "Available" : app.status === "MAINTENANCE" ? "Maintenance" : "Locked"}
            </span>
            {isActive ? (
              <Button size="sm" className="h-9 rounded-full px-4" onClick={() => onClick(app)}>
                Open <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <span className="inline-flex h-9 items-center rounded-full border border-hairline px-4 text-xs font-medium text-mist">
                Unavailable
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
