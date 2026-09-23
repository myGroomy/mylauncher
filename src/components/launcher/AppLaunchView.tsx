"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Lock } from "lucide-react";
import type { App } from "@/lib/types";
import { resolveAppUrl } from "@/lib/constants";

interface AppLaunchViewProps {
  app: App | null;
  appId: string;
}

export function AppLaunchView({ app, appId }: AppLaunchViewProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      {app ? (
        <div className="text-center space-y-4">
          <Card className="max-w-sm">
            <CardHeader>
              <CardTitle className="text-lg">{app.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <a
                href={resolveAppUrl(app.url)}
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
            You do not have permission to access {appId}.
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
  );
}
