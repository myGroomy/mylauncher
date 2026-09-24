"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { forwardRef } from "react";
import { useDomainStore } from "@/stores/useLauncherStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
  X,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  package: Package,
  "calendar-days": CalendarDays,
  users: Users,
  building: Building,
  "building-columns": Building,
  "layout-grid": LayoutGrid,
  MoreHorizontal,
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
}

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { isMobileOpen, onMobileClose },
  ref
) {
  const pathname = usePathname();
  const apps = useDomainStore((s) => s.apps);
  const permissions = useDomainStore((s) => s.permissions);
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const roleId = useDomainStore((s) => s.roleId);
  const features = useFeatureSettings();

  const accessibleApps = isAuthenticated
    ? apps.filter((app) => app.status === "ACTIVE" && permissions.includes(app.required_permission))
    : [];
  const isAdmin = isAuthenticated && roleId === "role_admin";

  const mainNav: NavItem[] = [
    { href: "/launcher", label: "Dashboard", icon: <LayoutGrid className="h-4 w-4" />, exact: true },
    { href: "/docs", label: "Documentation", icon: <BookOpen className="h-4 w-4" /> },
  ];

  const adminNav: NavItem[] = isAdmin
    ? [
        { href: "/admin", label: "Overview", icon: <Settings className="h-4 w-4" />, exact: true },
        { href: "/admin/employees", label: "Employees", icon: <Users className="h-4 w-4" /> },
        ...(features.admin_roles
          ? [{ href: "/admin/roles", label: "Roles", icon: <Shield className="h-4 w-4" /> } satisfies NavItem]
          : []),
        ...(features.admin_permissions
          ? [{ href: "/admin/permissions", label: "Permissions", icon: <KeyRound className="h-4 w-4" /> } satisfies NavItem]
          : []),
        ...(features.admin_apps
          ? [{ href: "/admin/apps", label: "Applications", icon: <AppWindow className="h-4 w-4" /> } satisfies NavItem]
          : []),
        ...(features.admin_announcements
          ? [{ href: "/admin/announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> } satisfies NavItem]
          : []),
        ...(features.admin_sessions
          ? [{ href: "/admin/sessions", label: "Sessions", icon: <LogOut className="h-4 w-4" /> } satisfies NavItem]
          : []),
        ...(features.admin_audit
          ? [{ href: "/admin/audit", label: "Audit Log", icon: <ScrollText className="h-4 w-4" /> } satisfies NavItem]
          : []),
        { href: "/admin/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
      ]
    : [];

  return (
    <aside
      ref={ref}
      id="primary-navigation"
      className={cn(
        "flex flex-col w-64 h-full bg-surface border-r border-hairline",
        isMobileOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:flex"
      )}
      aria-label="Primary navigation"
      {...(isMobileOpen ? { role: "dialog", "aria-modal": true as const } : {})}
    >
      <div className="flex items-center gap-2 px-5 py-4 border-b border-hairline">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <span className="text-sm font-bold" aria-hidden="true">M</span>
        </div>
        <span className="text-base font-bold text-ink">MOCHIKIN LAUNCHER</span>
        {isMobileOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-9 w-9 text-ash hover:text-ink lg:hidden"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-0.5" aria-label="Main">
          <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-mist">
            Launcher
          </p>
          {mainNav.map((item) => (
            <SidebarLink
              key={item.href}
              {...item}
              active={isActive(pathname, item.href, item.exact)}
              onNavigate={onMobileClose}
            />
          ))}

          {accessibleApps.length > 0 && (
            <>
              <Separator className="my-2 bg-hairline" />
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-mist">
                Applications
              </p>
              {accessibleApps.map((app) => {
                const Icon = ICON_MAP[app.icon || "MoreHorizontal"] || MoreHorizontal;
                const href = `/launcher/${app.app_id.toLowerCase()}`;
                return (
                  <SidebarLink
                    key={app.app_id}
                    href={href}
                    label={app.name}
                    icon={<Icon className="h-4 w-4" />}
                    active={isActive(pathname, href)}
                    onNavigate={onMobileClose}
                  />
                );
              })}
            </>
          )}

          {isAdmin && adminNav.length > 0 && (
            <>
              <Separator className="my-2 bg-hairline" />
              <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-mist">
                Administration
              </p>
              {adminNav.map((item) => (
                <SidebarLink
                  key={item.href}
                  {...item}
                  active={isActive(pathname, item.href, item.exact)}
                  onNavigate={onMobileClose}
                />
              ))}
            </>
          )}
        </nav>
      </ScrollArea>
    </aside>
  );
});

function SidebarLink({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors",
        active
          ? "bg-accent-wash text-accent-deep"
          : "text-ash hover:bg-secondary hover:text-ink"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
