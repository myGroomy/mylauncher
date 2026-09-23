"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AppSwitcher } from "@/components/layout/AppSwitcher";
import { GlobalSearch } from "@/components/launcher/GlobalSearch";
import { NotificationBell } from "@/components/launcher/NotificationBell";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { broadcastLogout } from "@/hooks/useSessionSync";
import { useFeatureSettings } from "@/components/layout/FeatureSettingsProvider";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const activeEmployee = useDomainStore((s) => s.activeEmployee);
  const roleName = useDomainStore((s) => s.roleName);
  const logout = useDomainStore((s) => s.logout);
  const getSession = useDomainStore((s) => s.getSession);
  const [now, setNow] = useState(0);
  const [sessionInfo, setSessionInfo] = useState(getSession());
  const features = useFeatureSettings();

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      setSessionInfo(getSession());
    }, 1000);
    return () => clearInterval(interval);
  }, [getSession]);

  const minutesLeft = sessionInfo.isValid && sessionInfo.expiresAt
    ? Math.ceil((sessionInfo.expiresAt - now) / 60000)
    : 0;

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-hairline bg-surface">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-ash hover:text-ink"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        {features.global_search && <GlobalSearch />}
        <AppSwitcher />
        {isAuthenticated && activeEmployee && (
          <div className="flex items-center gap-2">
            {features.notifications && <NotificationBell />}
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-ink leading-none">{activeEmployee.name}</p>
                <Badge variant="secondary" className="text-[10px]">{roleName || activeEmployee.role}</Badge>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              <Clock className="h-3 w-3 text-ink-soft" />
              <span className="text-xs font-mono text-ink-soft">{minutesLeft}m</span>
            </div>
            <Button variant="ghost" size="icon" className="text-ash hover:text-rose" onClick={() => {
              void fetch("/api/auth/logout", { method: "POST" });
              toast.info("Signed out");
              logout();
              broadcastLogout();
            }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
