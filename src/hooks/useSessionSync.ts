"use client";

import { useEffect } from "react";
import { useDomainStore } from "@/stores/useLauncherStore";

const LOGOUT_EVENT = "mochikin-logout";

export function useSessionSync() {
  const logout = useDomainStore((s) => s.logout);
  const isAuthenticated = useDomainStore((s) => s.isAuthenticated);
  const hydrateSession = useDomainStore((s) => s.hydrateSession);
  const getEmployeeById = useDomainStore((s) => s.getEmployeeById);

  useEffect(() => {
    void fetch("/api/auth/session")
      .then(async (response) => {
        if (!response.ok) {
          if (isAuthenticated) logout();
          return;
        }
        const result = await response.json() as { session?: {
          employeeId: string;
          roleId: string;
        } };
        const employee = result.session?.employeeId ? getEmployeeById(result.session.employeeId) : undefined;
        if (employee) hydrateSession({ ...employee, role: result.session?.roleId || employee.role });
      })
      .catch(() => {
        if (isAuthenticated) logout();
      });

    function handleStorage(e: StorageEvent) {
      if (e.key === "mochikin-domain-storage") {
        const next = e.newValue;
        if (!next) {
          if (isAuthenticated) logout();
          return;
        }
        try {
          const parsed = JSON.parse(next);
          if (!parsed.state?.isAuthenticated && isAuthenticated) {
            logout();
          }
        } catch {
          // ignore malformed storage data
        }
      }
    }

    function handleBroadcast() {
      if (isAuthenticated) logout();
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(LOGOUT_EVENT, handleBroadcast);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(LOGOUT_EVENT, handleBroadcast);
    };
  }, [logout, isAuthenticated, hydrateSession, getEmployeeById]);
}

export function broadcastLogout() {
  window.dispatchEvent(new CustomEvent(LOGOUT_EVENT));
}
