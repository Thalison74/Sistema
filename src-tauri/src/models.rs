use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: i64,
    pub session_id: i64,
    pub name: String,
    pub initial_balance_cents: i64,
    pub final_balance_cents: Option<i64>,
    pub notes: Option<String>,
    pub position: i64,
    /// None while final_balance_cents is not informed (pending).
    pub result_cents: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: i64,
    pub name: String,
    pub session_date: String,
    pub session_time: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionSummary {
    #[serde(flatten)]
    pub session: Session,
    pub account_count: i64,
    pub result_cents: i64,
    pub has_pending: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionDetail {
    #[serde(flatten)]
    pub session: Session,
    pub accounts: Vec<Account>,
    pub profit_cents: i64,
    pub loss_cents: i64,
    pub result_cents: i64,
    pub has_pending: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case", tag = "kind")]
pub enum PeriodFilter {
    Today,
    Last7Days,
    Last30Days,
    ThisMonth,
    AllTime,
    Custom { start: String, end: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChartPoint {
    pub session_id: i64,
    pub name: String,
    pub date: String,
    pub result_cents: i64,
    pub cumulative_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionStats {
    pub best_session: Option<ChartPoint>,
    pub worst_session: Option<ChartPoint>,
    pub average_cents: i64,
    pub positive_count: i64,
    pub negative_count: i64,
    pub accumulated_cents: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DashboardData {
    pub total_cents: i64,
    pub profit_cents: i64,
    pub loss_cents: i64,
    pub session_count: i64,
    pub chart: Vec<ChartPoint>,
    pub stats: SessionStats,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SortOption {
    Newest,
    Oldest,
    HighestProfit,
    HighestLoss,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppInfo {
    pub name: String,
    pub version: String,
    pub data_dir: String,
}
