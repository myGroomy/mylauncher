export type AppStatus = "ACTIVE" | "MAINTENANCE" | "INACTIVE";

export interface App {
  app_id: string;
  name: string;
  url: string;
  icon: string;
  status: AppStatus;
  required_permission: string;
}

export interface Employee {
  employee_id: string;
  name: string;
  role: string;
  status: string;
  base_branch: string;
}

export interface Role {
  role_id: string;
  name: string;
  permissions: string[];
}

export interface Permission {
  permission_id: string;
  key: string;
  description: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  action: string;
  employeeId: string | null;
  details: string;
}

export interface AdminSessionInfo {
  session_id: string;
  employee_id: string;
  role_id: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string;
  active: boolean;
}

export interface Branch {
  branch_id: string;
  name: string;
}

export interface Shift {
  shift_id: string;
  name: string;
  start_time: string;
  end_time: string;
}

export interface ScheduleEntry {
  schedule_id: string;
  employee_id: string;
  date: string;
  branch_id: string;
  shift_id: string;
  updated_via?: "schedule" | "swap" | "replacement";
}

export interface WorkContext {
  employee_id: string;
  date: string;
  branch: Branch | null;
  shift: Shift | null;
  schedule: ScheduleEntry | null;
}