"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDomainStore } from "@/stores/useLauncherStore";
import type { WorkContext } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, CalendarDays, RefreshCw, CalendarClock } from "lucide-react";

interface WorkContextResult {
  employeeId: string;
  context: WorkContext | null;
  error: string;
}

export function WorkContextWidget() {
  const router = useRouter();
  const activeEmployee = useDomainStore((s) => s.activeEmployee);
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const [result, setResult] = useState<WorkContextResult | null>(null);
  const employeeId = isAuthenticated && activeEmployee ? activeEmployee.employee_id : null;

  useEffect(() => {
    if (!employeeId) return;

    let cancelled = false;
    void fetch("/api/work-context")
      .then(async (response) => {
        const body = await response.json() as { workContext?: WorkContext; message?: string };
        if (cancelled) return;
        if (!response.ok || !body.workContext) {
          setResult({
            employeeId,
            context: null,
            error: body.message || "Unable to load work context",
          });
          return;
        }
        setResult({ employeeId, context: body.workContext, error: "" });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setResult({
          employeeId,
          context: null,
          error: err instanceof Error ? err.message : "Unable to load work context",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (!employeeId || !activeEmployee) return null;

  const matched = result?.employeeId === employeeId;
  const error = matched ? result?.error ?? "" : "";
  const context = matched ? result?.context ?? null : null;
  const loading = !matched;
  const hasSchedule = Boolean(context?.branch && context?.shift && context?.schedule);
  const updatedVia = context?.schedule?.updated_via;

  return (
    <Card className="border-hairline">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Today&apos;s Work
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-sm text-rose">{error}</p>
        ) : loading ? (
          <p className="text-sm text-mist">Loading work context…</p>
        ) : hasSchedule ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-mist" />
              <span className="text-ink font-medium">{context!.branch!.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-mist" />
              <span className="text-ink font-medium">
                {context!.shift!.start_time} – {context!.shift!.end_time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-mist">Shift:</span>
              <Badge variant="secondary" className="text-xs">{context!.shift!.name}</Badge>
            </div>
            {updatedVia && updatedVia !== "schedule" && (
              <div className="flex items-center gap-2 text-xs text-amber">
                <RefreshCw className="h-3 w-3" />
                Updated via {updatedVia} change
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => router.push("/launcher/myshift")}
            >
              <CalendarClock className="h-3.5 w-3.5 mr-2" />
              Open My Shift
            </Button>
          </>
        ) : (
          <div className="text-sm text-ink-soft">
            No scheduled shift today.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
