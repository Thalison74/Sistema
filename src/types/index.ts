export interface Account {
  id: number;
  session_id: number;
  name: string;
  initial_balance_cents: number;
  final_balance_cents: number | null;
  notes: string | null;
  position: number;
  result_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  name: string;
  session_date: string;
  session_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionSummary extends Session {
  account_count: number;
  result_cents: number;
  has_pending: boolean;
}

export interface SessionDetail extends Session {
  accounts: Account[];
  profit_cents: number;
  loss_cents: number;
  result_cents: number;
  has_pending: boolean;
}

export type PeriodFilter =
  | { kind: "today" }
  | { kind: "last7_days" }
  | { kind: "last30_days" }
  | { kind: "this_month" }
  | { kind: "all_time" }
  | { kind: "custom"; start: string; end: string };

export interface ChartPoint {
  session_id: number;
  name: string;
  date: string;
  result_cents: number;
  cumulative_cents: number;
}

export interface SessionStats {
  best_session: ChartPoint | null;
  worst_session: ChartPoint | null;
  average_cents: number;
  positive_count: number;
  negative_count: number;
  accumulated_cents: number;
}

export interface DashboardData {
  total_cents: number;
  profit_cents: number;
  loss_cents: number;
  session_count: number;
  chart: ChartPoint[];
  stats: SessionStats;
}

export type SortOption = "newest" | "oldest" | "highest_profit" | "highest_loss";

export interface AppInfo {
  name: string;
  version: string;
  data_dir: string;
}

export type ThemeSetting = "light" | "dark" | "system";
