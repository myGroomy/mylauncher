"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, User, Building } from "lucide-react";

export function Profile() {
  const activeEmployee = useDomainStore((s) => s.activeEmployee);
  const roleName = useDomainStore((s) => s.roleName);
  const permissions = useDomainStore((s) => s.permissions);
  const branches = useDomainStore((s) => s.branches);

  if (!activeEmployee) return null;

  const baseBranch = branches.find((b) => b.branch_id === activeEmployee.base_branch);

  return (
    <Card className="border-hairline">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
          <User className="h-4 w-4" />
          Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mist">Name:</span>
          <span className="text-ink font-medium">{activeEmployee.name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mist">Username:</span>
          <span className="text-ink font-mono text-xs">{activeEmployee.username}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mist">Employee ID:</span>
          <span className="text-ink font-mono text-xs">{activeEmployee.employee_id}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mist">Role:</span>
          <Badge variant="secondary" className="text-xs">{roleName || activeEmployee.role}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-mist">Status:</span>
          <Badge
            variant={activeEmployee.status === "ACTIVE" ? "default" : "destructive"}
            className="text-xs"
          >
            {activeEmployee.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Building className="h-3.5 w-3.5 text-mist" />
          <span className="text-mist">Base Branch:</span>
          <span className="text-ink text-xs">{baseBranch?.name || activeEmployee.base_branch || "—"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Shield className="h-3.5 w-3.5 text-mist" />
          <span className="text-mist">Permissions:</span>
          <span className="text-ink text-xs">{permissions.length} granted</span>
        </div>
      </CardContent>
    </Card>
  );
}
