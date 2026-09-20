"use client";

import { useState, useEffect } from "react";
import { useDomainStore } from "@/stores/useLauncherStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const MAX_FAILED_ATTEMPTS = 5;

export function LoginStub() {
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);
  const login = useDomainStore((s) => s.login);
  const isLocked = useDomainStore((s) => s.isLocked());
  const getRemainingAttempts = useDomainStore((s) => s.getRemainingAttempts);
  const lockUntil = useDomainStore((s) => s.lockUntil);

  const remaining = getRemainingAttempts();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!isLocked) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [isLocked]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const result = login(employeeId, pin);
    if (result.success) {
      toast.success("Login successful");
    } else {
      toast.error(result.message);
    }
  }

  const minutesLeft = lockUntil ? Math.ceil((lockUntil - now) / 60000) : 0;

  if (isLocked && lockUntil && minutesLeft > 0) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center">
              <AlertTriangle className="h-12 w-12 text-amber mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-ink">Account Locked</h1>
            <p className="text-sm text-ink-soft">
              Too many failed attempts. Please try again in {minutesLeft} minute{minutesLeft !== 1 ? "s" : ""}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-full">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-ink">MOCHIKIN LAUNCHER</h1>
          <p className="text-sm text-ink-soft">Sign in to access your applications</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <span className="text-sm text-ink-soft">Employee ID</span>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
              <Input
                id="employeeId"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="emp_001"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-sm text-ink-soft">PIN</span>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist" />
              <Input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="pl-10"
              />
            </div>
          </div>

          {remaining < MAX_FAILED_ATTEMPTS && remaining > 0 && (
            <p className="text-xs text-amber">{remaining} attempt{remaining !== 1 ? "s" : ""} remaining</p>
          )}

          {error && <p className="text-sm text-rose">{error}</p>}

          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>

        <p className="text-xs text-mist text-center">
          Demo: use emp_001 / 1234 or emp_002 / 1234
        </p>
      </div>
    </div>
  );
}
