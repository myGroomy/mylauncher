"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFeatureSettings } from "@/components/layout/FeatureSettingsProvider";
import {
  LayoutGrid,
  Package,
  CalendarDays,
  Users,
  Building,
  MoreHorizontal,
  Settings,
  Shield,
  KeyRound,
  AppWindow,
  LogOut,
  ScrollText,
  Megaphone,
  BookOpen,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  package: Package,
  "calendar-days": CalendarDays,
  users: Users,
  building: Building,
  "layout-grid": LayoutGrid,
  MoreHorizontal,
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen }: SidebarProps) {
  const apps = useDomainStore((s) => s.apps);
  const permissions = useDomainStore((s) => s.permissions);
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const roleId = useDomainStore((s) => s.roleId);
  const features = useFeatureSettings();

  const accessibleApps = isAuthenticated
    ? apps.filter((app) => app.status === "ACTIVE" && permissions.includes(app.required_permission))
    : [];
  const isAdmin = isAuthenticated && roleId === "role_admin";

  return (
    <aside
      className={cn(
        "flex flex-col w-64 h-full bg-surface border-r border-hairline",
        isMobileOpen ? "fixed inset-0 z-50" : "hidden lg:flex"
      )}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-hairline">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold">M</span>
        </div>
        <span className="text-base font-bold text-ink">MOCHIKIN LAUNCHER</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5">
          <SidebarButton
            icon={<LayoutGrid className="h-4 w-4" />}
            label="Dashboard"
            href="/launcher"
          />
          <SidebarButton
            icon={<BookOpen className="h-4 w-4" />}
            label="Documentation"
            href="/docs"
          />

          <Separator className="my-2 bg-hairline" />

          {accessibleApps.map((app) => {
            const Icon = ICON_MAP[app.icon || "MoreHorizontal"] || MoreHorizontal;
            return (
              <SidebarButton
                key={app.app_id}
                icon={<Icon className="h-4 w-4" />}
                label={app.name}
                href={`/launcher/${app.app_id}`}
              />
            );
          })}

          {isAdmin && (
            <>
              <Separator className="my-2 bg-hairline" />
              <SidebarButton
                icon={<Settings className="h-4 w-4" />}
                label="Admin"
                href="/admin"
              />
              <SidebarButton
                icon={<Users className="h-4 w-4" />}
                label="Employees"
                href="/admin/employees"
              />
              {features.admin_roles && <SidebarButton
                icon={<Shield className="h-4 w-4" />}
                label="Roles"
                href="/admin/roles"
              />}
              {features.admin_permissions && <SidebarButton
                icon={<KeyRound className="h-4 w-4" />}
                label="Permissions"
                href="/admin/permissions"
              />}
              {features.admin_apps && <SidebarButton
                icon={<AppWindow className="h-4 w-4" />}
                label="Applications"
                href="/admin/apps"
              />}
              {features.admin_announcements && <SidebarButton
                icon={<Megaphone className="h-4 w-4" />}
                label="Announcements"
                href="/admin/announcements"
              />}
              {features.admin_sessions && <SidebarButton
                icon={<LogOut className="h-4 w-4" />}
                label="Sessions"
                href="/admin/sessions"
              />}
              {features.admin_audit && <SidebarButton
                icon={<ScrollText className="h-4 w-4" />}
                label="Audit Log"
                href="/admin/audit"
              />}
              <SidebarButton
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                href="/admin/settings"
              />
            </>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
}

function SidebarButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-ash hover:bg-secondary hover:text-ink rounded-lg transition-colors"
    >
      {icon}
      {label}
    </a>
  );
}
