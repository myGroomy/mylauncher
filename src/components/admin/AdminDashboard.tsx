"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, UserCheck, Shield, AppWindow, KeyRound, Users } from "lucide-react";
import Link from "next/link";

export function AdminDashboard() {
  const auditLog = useDomainStore((s) => s.getAuditLog());
  const employees = useDomainStore((s) => s.employees);
  const roles = useDomainStore((s) => s.roles);
  const permissions = useDomainStore((s) => s.permissions);
  const apps = useDomainStore((s) => s.apps);
  const getAuditLog = useDomainStore((s) => s.getAuditLog);

  const recentLogs = getAuditLog().slice(-20).reverse();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/employees">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <Users className="h-4 w-4" /> Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-ink">{employees.length}</p>
              <p className="text-xs text-ink-soft mt-1">Manage users, roles, PINs</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/roles">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <Shield className="h-4 w-4" /> Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-ink">{roles.length}</p>
              <p className="text-xs text-ink-soft mt-1">Permission assignments</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/permissions">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-ink">{permissions.length}</p>
              <p className="text-xs text-ink-soft mt-1">Access keys</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/apps">
          <Card className="hover:bg-secondary/50 transition-colors cursor-pointer">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
                <AppWindow className="h-4 w-4" /> Apps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-ink">{apps.length}</p>
              <p className="text-xs text-ink-soft mt-1">Registry management</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Active Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{employees.filter((e) => e.status === "ACTIVE").length}</p>
            <p className="text-xs text-ink-soft mt-1">Can access launcher</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
              <Shield className="h-4 w-4" /> Defined Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{roles.length}</p>
            <p className="text-xs text-ink-soft mt-1">Role templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
              <Clock className="h-4 w-4" /> Audit Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-ink">{auditLog.length}</p>
            <p className="text-xs text-ink-soft mt-1">Total logged events</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-ink">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-ink-soft">No audit events yet</p>
            ) : (
              <ul className="space-y-2">
                {recentLogs.map((entry) => (
                  <li key={entry.id} className="flex items-center gap-3 text-sm">
                    <span className="text-ink-soft font-mono text-xs">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="text-ink">{entry.action}</span>
                    <span className="text-mist">{entry.employeeId || "system"}</span>
                    <span className="text-ink-soft text-xs">{entry.details}</span>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
