use chrono::{Datelike, Duration, Local, NaiveDate};
use tauri::State;

use crate::calculations::{build_chart, build_stats};
use crate::error::AppResult;
use crate::models::{DashboardData, PeriodFilter};
use crate::repo::map_session;
use crate::state::AppState;

fn resolve_range(filter: &PeriodFilter) -> (Option<String>, Option<String>) {
    let today = Local::now().date_naive();
    let fmt = |d: NaiveDate| d.format("%Y-%m-%d").to_string();

    match filter {
        PeriodFilter::Today => (Some(fmt(today)), Some(fmt(today))),
        PeriodFilter::Last7Days => (Some(fmt(today - Duration::days(6))), Some(fmt(today))),
        PeriodFilter::Last30Days => (Some(fmt(today - Duration::days(29))), Some(fmt(today))),
        PeriodFilter::ThisMonth => {
            let start = NaiveDate::from_ymd_opt(today.year(), today.month(), 1).unwrap();
            (Some(fmt(start)), Some(fmt(today)))
        }
        PeriodFilter::AllTime => (None, None),
        PeriodFilter::Custom { start, end } => (Some(start.clone()), Some(end.clone())),
    }
}

#[tauri::command]
pub fn dashboard_get(state: State<AppState>, period: PeriodFilter) -> AppResult<DashboardData> {
    let conn = state.conn.lock().unwrap();
    let (from, to) = resolve_range(&period);

    let mut sql = String::from(
        "SELECT s.*,
            COALESCE(SUM(CASE WHEN sa.final_balance_cents IS NOT NULL
                THEN sa.final_balance_cents - sa.initial_balance_cents ELSE 0 END), 0) AS result_cents
         FROM sessions s
         LEFT JOIN session_accounts sa ON sa.session_id = s.id
         WHERE 1 = 1",
    );
    let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();
    if let Some(from) = &from {
        sql.push_str(" AND s.session_date >= ?");
        query_params.push(Box::new(from.clone()));
    }
    if let Some(to) = &to {
        sql.push_str(" AND s.session_date <= ?");
        query_params.push(Box::new(to.clone()));
    }
    sql.push_str(" GROUP BY s.id ORDER BY s.session_date ASC, s.session_time ASC, s.id ASC");

    let mut stmt = conn.prepare(&sql)?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();
    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        let session = map_session(row)?;
        let result_cents: i64 = row.get("result_cents")?;
        Ok((session, result_cents))
    })?;
    let sessions = rows.collect::<Result<Vec<_>, _>>()?;

    let chart = build_chart(&sessions);
    let stats = build_stats(&chart);
    let profit_cents: i64 = chart.iter().map(|p| p.result_cents).filter(|r| *r > 0).sum();
    let loss_cents: i64 = chart.iter().map(|p| p.result_cents).filter(|r| *r < 0).sum();
    let total_cents: i64 = chart.iter().map(|p| p.result_cents).sum();

    Ok(DashboardData {
        total_cents,
        profit_cents,
        loss_cents,
        session_count: chart.len() as i64,
        chart,
        stats,
    })
}
