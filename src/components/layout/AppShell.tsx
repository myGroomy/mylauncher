"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSessionSync } from "@/hooks/useSessionSync";
import { FeatureSettingsProvider } from "@/components/layout/FeatureSettingsProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  useSessionSync();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <FeatureSettingsProvider>
      <div className="flex h-screen overflow-hidden bg-canvas">
        <Sidebar isMobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-ink/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="flex flex-col flex-1 min-w-0">
          <Header onMenuClick={() => setMobileOpen(true)} />

          <ScrollArea className="flex-1">
            <main className="px-6 py-6">{children}</main>
          </ScrollArea>
        </div>
      </div>
    </FeatureSettingsProvider>
  );
}
