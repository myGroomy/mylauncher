"use client";

import { useDomainStore } from "@/stores/useLauncherStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LayoutGrid, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export function AppSwitcher() {
  const router = useRouter();
  const getAccessibleApps = useDomainStore((s) => s.getAccessibleApps);
  const apps = getAccessibleApps();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-2 text-ash hover:text-ink">
            <LayoutGrid className="h-4 w-4" />
            <span className="text-sm">MOCHIKIN APPS</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Applications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {apps.length === 0 ? (
            <DropdownMenuItem disabled>No apps available</DropdownMenuItem>
          ) : (
            apps.map((app) => (
              <DropdownMenuItem
                key={app.app_id}
                onClick={() => router.push(`/launcher/${app.app_id.toLowerCase()}`)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{app.name}</span>
                <ExternalLink className="h-3 w-3 text-mist" />
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
