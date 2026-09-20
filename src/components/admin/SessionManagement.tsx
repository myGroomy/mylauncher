"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut } from "lucide-react";
import { toast } from "sonner";

export function SessionManagement() {
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const sessionToken = useDomainStore((s) => s.sessionToken);
  const sessionExpiry = useDomainStore((s) => s.sessionExpiry);
  const employeeId = useDomainStore((s) => s.employeeId);
  const revokeSession = useDomainStore((s) => s.revokeSession);
  const getSession = useDomainStore((s) => s.getSession);

  const session = getSession();

  function handleRevoke() {
    revokeSession();
    toast.info("Session revoked");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Session Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
            <Shield className="h-4 w-4" /> Current Session
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-mist">Status:</span>
            <Badge variant={isAuthenticated ? "default" : "destructive"} className="text-xs">
              {isAuthenticated ? "Active" : "Inactive"}
            </Badge>
          </div>
          {employeeId && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-mist">Employee:</span>
              <span className="text-ink font-mono text-xs">{employeeId}</span>
            </div>
          )}
          {sessionToken && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-mist">Token:</span>
              <span className="text-ink font-mono text-xs truncate max-w-xs">{sessionToken}</span>
            </div>
          )}
          {sessionExpiry && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-mist">Expires:</span>
              <span className="text-ink text-xs">{new Date(sessionExpiry).toLocaleString()}</span>
            </div>
          )}
          {session.isValid && (
            <Button variant="outline" size="sm" className="text-rose" onClick={handleRevoke}>
              <LogOut className="h-4 w-4 mr-2" /> Revoke Session
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-ink">Session Info</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-ink-soft">
            Session duration is configured to 1 hour. Revoking the session will immediately sign the user out across all tabs.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
