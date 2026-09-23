"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useDomainStore } from "@/stores/useLauncherStore";
import { DEFAULT_FEATURE_SETTINGS } from "@/lib/featureSettings";
import type { FeatureSettings } from "@/lib/types";

const FeatureSettingsContext = createContext<FeatureSettings>(DEFAULT_FEATURE_SETTINGS);

export function FeatureSettingsProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useDomainStore((state) => state.isAuthenticated);
  const [features, setFeatures] = useState<FeatureSettings>(DEFAULT_FEATURE_SETTINGS);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    void fetch("/api/settings")
      .then(async (response) => {
        const body = (await response.json()) as { success?: boolean; features?: FeatureSettings };
        if (!cancelled && response.ok && body.success && body.features) setFeatures(body.features);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return <FeatureSettingsContext.Provider value={isAuthenticated ? features : DEFAULT_FEATURE_SETTINGS}>{children}</FeatureSettingsContext.Provider>;
}

export function useFeatureSettings(): FeatureSettings {
  return useContext(FeatureSettingsContext);
}
