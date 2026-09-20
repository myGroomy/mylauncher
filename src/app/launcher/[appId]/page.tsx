"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useDomainStore } from "@/stores/useLauncherStore";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Lock } from "lucide-react";
import { toast } from "sonner";

export default function AppIdPage({ params }: { params: { appId: string } }) {
  const router = useRouter();
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const getAccessibleApps = useDomainStore((s) => s.getAccessibleApps);
  const getSession = useDomainStore((s) => s.getSession);
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const session = useMemo(() => getSession(), [getSession, tick]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sessionValid = session.isValid;
  const accessibleApps = isAuthenticated ? getAccessibleApps() : [];
  const appId = params.appId.toUpperCase();

  useEffect(() => {
    if (!isAuthenticated || !sessionValid) {
      router.replace("/");
    }
  }, [isAuthenticated, sessionValid, router]);

  useEffect(() => {
    if (!sessionValid && isAuthenticated) {
      toast.info("Session expired. Please sign in again.");
      router.replace("/");
    }
  }, [sessionValid, isAuthenticated, router]);

  const app = accessibleApps.find((a) => a.app_id === appId);

  if (!isAuthenticated || !sessionValid) {
    return null;
  }

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        {app && app.status === "ACTIVE" ? (
          <div className="text-center space-y-4">
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle className="text-lg">{app.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <a
                  href={app.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open {app.name}
                </a>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <Lock className="h-12 w-12 text-mist mx-auto" />
            <h2 className="text-xl font-bold text-ink">Access Denied</h2>
            <p className="text-ink-soft">
              You do not have permission to access this application.
            </p>
            <button
              className="inline-flex h-9 items-center justify-center rounded-lg border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
              onClick={() => router.push("/launcher")}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
