"use client";

import { useState } from "react";
import { useDomainStore } from "@/stores/useLauncherStore";
import { useEmployees, useRoles } from "@/hooks/useAdminApi";
import { Employee } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Plus, Pencil, Trash2, Lock, Save, X } from "lucide-react";
import { toast } from "sonner";

export function EmployeeManagement() {
  const branches = useDomainStore((s) => s.branches);
  const { employees, loading, error, create, update, toggleStatus, resetPin } = useEmployees();
  const { roles } = useRoles();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Employee>>({ status: "ACTIVE" });
  const [pinForm, setPinForm] = useState<{ id: string } | null>(null);
  const [newPin, setNewPin] = useState("");
  const [createPin, setCreatePin] = useState("");

  function reset() {
    setEditingId(null);
    setForm({ status: "ACTIVE" });
    setPinForm(null);
    setNewPin("");
    setCreatePin("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.role || !form.base_branch) {
      toast.error("Name, role, and base branch are required");
      return;
    }
    if (editingId) {
      const result = await update(editingId, {
        name: form.name,
        role_id: form.role,
        status: form.status,
        base_branch: form.base_branch,
      });
      toast[result.success ? "success" : "error"](result.message);
      if (result.success) reset();
    } else {
      const result = await create({
        employee_id: form.employee_id,
        name: form.name,
        role_id: form.role,
        status: form.status,
        base_branch: form.base_branch,
        pin: createPin || undefined,
      });
      toast[result.success ? "success" : "error"](result.message);
      if (result.success) reset();
    }
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.employee_id);
    setForm({ ...emp });
    setPinForm(null);
  }

  async function handleResetPin() {
    if (!pinForm || !/^\d{4,8}$/.test(newPin)) {
      toast.error("PIN must be 4-8 digits");
      return;
    }
    const result = await resetPin(pinForm.id, newPin);
    toast[result.success ? "success" : "error"](result.message);
    if (result.success) {
      setPinForm(null);
      setNewPin("");
    }
  }

  async function handleToggle(emp: Employee) {
    const result = await toggleStatus(emp.employee_id);
    toast[result.success ? "success" : "error"](result.message);
  }

  if (loading) return <p className="text-sm text-ink-soft">Loading employees…</p>;
  if (error) return <p className="text-sm text-rose">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-ink">Employee Management</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
            {editingId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingId ? "Edit Employee" : "New Employee"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            {!editingId && (
              <Input value={form.employee_id || ""} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} placeholder="Employee ID (optional)" />
            )}
            <Select value={form.role || undefined} onValueChange={(val) => setForm({ ...form, role: val ?? undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.role_id} value={r.role_id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.base_branch || undefined} onValueChange={(val) => setForm({ ...form, base_branch: val ?? undefined })}>
              <SelectTrigger>
                <SelectValue placeholder="Base branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.branch_id} value={b.branch_id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={form.status || "ACTIVE"} onValueChange={(val) => setForm({ ...form, status: val ?? "ACTIVE" })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                <SelectItem value="INACTIVE">INACTIVE</SelectItem>
              </SelectContent>
            </Select>
            {!editingId && (
              <Input
                value={createPin}
                onChange={(e) => setCreatePin(e.target.value)}
                placeholder="PIN (4-8 digits, optional)"
                inputMode="numeric"
              />
            )}
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit"><Save className="h-4 w-4 mr-2" /> {editingId ? "Update" : "Create"}</Button>
              {editingId && <Button variant="outline" onClick={reset}><X className="h-4 w-4 mr-2" /> Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      {pinForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
              <Lock className="h-4 w-4" /> Reset PIN for {pinForm.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2 items-center">
            <Input
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New PIN (4-8 digits)"
              className="max-w-xs"
              inputMode="numeric"
            />
            <Button onClick={handleResetPin}>Reset</Button>
            <Button variant="outline" onClick={() => { setPinForm(null); setNewPin(""); }}>Cancel</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold text-ink flex items-center gap-2">
            <Users className="h-4 w-4" /> All Employees
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <table className="w-full">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="text-left text-xs font-medium text-ink-soft pb-2">Employee ID</th>
                  <th className="text-left text-xs font-medium text-ink-soft pb-2">Name</th>
                  <th className="text-left text-xs font-medium text-ink-soft pb-2">Role</th>
                  <th className="text-left text-xs font-medium text-ink-soft pb-2">Status</th>
                  <th className="text-left text-xs font-medium text-ink-soft pb-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-secondary/50">
                    <td className="py-2 text-xs font-mono text-ink">{emp.employee_id}</td>
                    <td className="py-2 text-sm text-ink">{emp.name}</td>
                    <td className="py-2"><Badge variant="secondary" className="text-xs">{emp.role}</Badge></td>
                    <td className="py-2"><Badge variant={emp.status === "ACTIVE" ? "default" : "destructive"} className="text-xs">{emp.status}</Badge></td>
                    <td className="py-2 flex gap-1">
                      <Button variant="ghost" size="icon" className="text-ash hover:text-ink" onClick={() => startEdit(emp)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-ash hover:text-amber" onClick={() => setPinForm({ id: emp.employee_id })}>
                        <Lock className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-ash hover:text-rose" onClick={() => handleToggle(emp)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-4 text-sm text-ink-soft">No employees yet. Create one above.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
