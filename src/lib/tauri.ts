import { invoke } from "@tauri-apps/api/core";
import type {
  Account,
  AppInfo,
  DashboardData,
  PeriodFilter,
  Session,
  SessionDetail,
  SessionSummary,
  SortOption,
} from "../types";

// Tauri converts command argument object keys to camelCase to match the
// JS/Rust naming convention bridge, regardless of the snake_case parameter
// names used on the Rust side. Each wrapper below maps our snake_case input
// shape (mirroring the Rust structs) to the camelCase keys invoke() expects.

export const api = {
  sessionCreate: (input: {
    name?: string | null;
    session_date: string;
    session_time: string;
    notes?: string | null;
  }) =>
    invoke<Session>("session_create", {
      name: input.name ?? null,
      sessionDate: input.session_date,
      sessionTime: input.session_time,
      notes: input.notes ?? null,
    }),

  sessionUpdate: (input: {
    id: number;
    name: string;
    session_date: string;
    session_time: string;
    notes?: string | null;
  }) =>
    invoke<Session>("session_update", {
      id: input.id,
      name: input.name,
      sessionDate: input.session_date,
      sessionTime: input.session_time,
      notes: input.notes ?? null,
    }),

  sessionDelete: (id: number) => invoke<void>("session_delete", { id }),

  sessionGetDetail: (id: number) => invoke<SessionDetail>("session_get_detail", { id }),

  sessionList: (input: {
    sort: SortOption;
    search?: string | null;
    date_from?: string | null;
    date_to?: string | null;
  }) =>
    invoke<SessionSummary[]>("session_list", {
      sort: input.sort,
      search: input.search ?? null,
      dateFrom: input.date_from ?? null,
      dateTo: input.date_to ?? null,
    }),

  accountAdd: (input: { session_id: number; name?: string | null }) =>
    invoke<Account>("account_add", {
      sessionId: input.session_id,
      name: input.name ?? null,
    }),

  accountUpdate: (input: {
    id: number;
    name?: string | null;
    initial_balance_cents?: number | null;
    final_balance_cents?: number | null;
    final_balance_is_pending: boolean;
    notes?: string | null;
  }) =>
    invoke<Account>("account_update", {
      id: input.id,
      name: input.name ?? null,
      initialBalanceCents: input.initial_balance_cents ?? null,
      finalBalanceCents: input.final_balance_cents ?? null,
      finalBalanceIsPending: input.final_balance_is_pending,
      notes: input.notes ?? null,
    }),

  accountDelete: (id: number) => invoke<void>("account_delete", { id }),

  dashboardGet: (period: PeriodFilter) => invoke<DashboardData>("dashboard_get", { period }),

  settingsGetAll: () => invoke<Record<string, string>>("settings_get_all"),

  settingsSet: (key: string, value: string) => invoke<void>("settings_set", { key, value }),

  backupCreate: (destPath: string) => invoke<void>("backup_create", { destPath }),

  backupRestore: (srcPath: string) => invoke<void>("backup_restore", { srcPath }),

  appGetInfo: () => invoke<AppInfo>("app_get_info"),
};

/** Extracts a user-friendly message from a rejected Tauri invoke call. */
export function errorMessage(err: unknown): string {
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  return "Ocorreu um erro inesperado.";
}
