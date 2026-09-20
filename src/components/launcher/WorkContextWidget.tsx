"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CalendarDays, RefreshCw } from "lucide-react";

export function WorkContextWidget() {
  const activeEmployee = useDomainStore((s) => s.activeEmployee);
  const getWorkContext = useDomainStore((s) => s.getWorkContext);

  if (!activeEmployee) return null;

  const context = getWorkContext();
  const hasSchedule = context.branch && context.shift && context.schedule;

  return (
    <Card className="border-hairline">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          Today&apos;s Work
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasSchedule ? (
          <>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-mist" />
              <span className="text-ink font-medium">{context.branch!.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-mist" />
              <span className="text-ink font-medium">
                {context.shift!.start_time} – {context.shift!.end_time}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-mist">Shift:</span>
              <Badge variant="secondary" className="text-xs">{context.shift!.name}</Badge>
            </div>
            {context.schedule?.updated_via && context.schedule.updated_via !== "schedule" && (
              <div className="flex items-center gap-2 text-xs text-amber">
                <RefreshCw className="h-3 w-3" />
                Updated via {context.schedule.updated_via} change
              </div>
            )}
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
