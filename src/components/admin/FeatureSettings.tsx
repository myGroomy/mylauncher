"use client";

import { useEffect, useState } from "react";
import { Check, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type FeatureKey, type FeatureSettings } from "@/lib/types";
import { DEFAULT_FEATURE_SETTINGS } from "@/lib/featureSettings";

const FEATURE_GROUPS: Array<{ title: string; keys: FeatureKey[] }> = [
  {
    title: "Launcher experience",
    keys: ["global_search", "notifications", "work_context", "announcements", "favorite_apps", "recent_apps", "system_status", "recent_activity"],
  },
  {
    title: "Admin navigation",
    keys: ["admin_roles", "admin_permissions", "admin_apps", "admin_announcements", "admin_sessions", "admin_audit"],
  },
];

const FEATURE_LABELS: Record<FeatureKey, { label: string; description: string }> = {
  global_search: { label: "Global Search", description: "Search accessible apps from the header." },
  notifications: { label: "Notifications", description: "Show the notification bell and personal feed." },
  work_context: { label: "Work Context", description: "Show the current branch and shift widget." },
  announcements: { label: "Announcements", description: "Show announcement banners and announcement items." },
  favorite_apps: { label: "Favorite Apps", description: "Show the favorites panel on the dashboard." },
  recent_apps: { label: "Recent Apps", description: "Show recently opened applications." },
  system_status: { label: "System Status", description: "Show registry and feed status cards." },
  recent_activity: { label: "Recent Activity", description: "Show audit activity summaries." },
  admin_roles: { label: "Roles", description: "Show role administration navigation and card." },
  admin_permissions: { label: "Permissions", description: "Show permission administration navigation and card." },
  admin_apps: { label: "Applications", description: "Show application registry administration navigation and card." },
  admin_announcements: { label: "Announcements Admin", description: "Show announcement administration navigation." },
  admin_sessions: { label: "Sessions", description: "Show active session administration navigation." },
  admin_audit: { label: "Audit Log", description: "Show audit log administration navigation." },
};

export function FeatureSettings() {
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/settings")
      .then(async (response) => {
        const body = (await response.json()) as { features?: FeatureSettings };
        if (response.ok && body.features) setFeatures(body.features);
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });
      const body = (await response.json()) as { success?: boolean; message?: string; features?: FeatureSettings };
      if (!response.ok || !body.success) throw new Error(body.message || "Unable to save settings");
      if (body.features) setFeatures(body.features);
      toast.success("Feature visibility updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-soft">Loading settings…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Control which optional features are visible globally.</p>
      </div>

      {FEATURE_GROUPS.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-ink">
              <Settings2 className="h-4 w-4" /> {group.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.keys.map((key) => {
              const metadata = FEATURE_LABELS[key];
              return (
                <label key={key} className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-hairline px-4 py-3 hover:bg-secondary/50">
                  <span>
                    <span className="block text-sm font-medium text-ink">{metadata.label}</span>
                    <span className="block text-xs text-ink-soft">{metadata.description}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={features[key]}
                    onChange={(event) => setFeatures((current) => ({ ...current, [key]: event.target.checked }))}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
              );
            })}
          </CardContent>
        </Card>
      ))}

      <Button onClick={() => void save()} disabled={saving}>
        <Check className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save settings"}
      </Button>
    </div>
  );
}
