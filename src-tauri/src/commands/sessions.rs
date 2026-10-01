use rusqlite::{params, OptionalExtension};
use tauri::State;

use crate::calculations::{session_has_pending, session_loss_cents, session_profit_cents, session_result_cents};
use crate::error::{AppError, AppResult};
use crate::models::{Session, SessionDetail, SessionSummary, SortOption};
use crate::repo::{get_session, get_session_accounts, map_session, now_iso};
use crate::state::AppState;

fn default_session_name(conn: &rusqlite::Connection) -> AppResult<String> {
    let count: i64 = conn.query_row("SELECT COUNT(*) FROM sessions", [], |r| r.get(0))?;
    Ok(format!("Sessão {:02}", count + 1))
}

#[tauri::command]
pub fn session_create(
    state: State<AppState>,
    name: Option<String>,
    session_date: String,
    session_time: String,
    notes: Option<String>,
) -> AppResult<Session> {
    if session_date.trim().is_empty() || session_time.trim().is_empty() {
        return Err(AppError::Validation("Informe data e horário da sessão.".into()));
    }
    let conn = state.conn.lock().unwrap();
    let name = match name {
        Some(n) if !n.trim().is_empty() => n.trim().to_string(),
        _ => default_session_name(&conn)?,
    };
    let now = now_iso();
    conn.execute(
        "INSERT INTO sessions (name, session_date, session_time, notes, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?5)",
        params![name, session_date, session_time, notes, now],
    )?;
    let id = conn.last_insert_rowid();
    get_session(&conn, id)
}

#[tauri::command]
pub fn session_update(
    state: State<AppState>,
    id: i64,
    name: String,
    session_date: String,
    session_time: String,
    notes: Option<String>,
) -> AppResult<Session> {
    if name.trim().is_empty() {
        return Err(AppError::Validation("O nome da sessão não pode ficar vazio.".into()));
    }
    if session_date.trim().is_empty() || session_time.trim().is_empty() {
        return Err(AppError::Validation("Informe data e horário da sessão.".into()));
    }
    let conn = state.conn.lock().unwrap();
    let now = now_iso();
    let affected = conn.execute(
        "UPDATE sessions SET name = ?1, session_date = ?2, session_time = ?3, notes = ?4, updated_at = ?5 WHERE id = ?6",
        params![name.trim(), session_date, session_time, notes, now, id],
    )?;
    if affected == 0 {
        return Err(AppError::NotFound);
    }
    get_session(&conn, id)
}

#[tauri::command]
pub fn session_delete(state: State<AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn.lock().unwrap();
    let affected = conn.execute("DELETE FROM sessions WHERE id = ?1", [id])?;
    if affected == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

#[tauri::command]
pub fn session_get_detail(state: State<AppState>, id: i64) -> AppResult<SessionDetail> {
    let conn = state.conn.lock().unwrap();
    let session = get_session(&conn, id)?;
    let accounts = get_session_accounts(&conn, id)?;
    Ok(SessionDetail {
        profit_cents: session_profit_cents(&accounts),
        loss_cents: session_loss_cents(&accounts),
        result_cents: session_result_cents(&accounts),
        has_pending: session_has_pending(&accounts),
        session,
        accounts,
    })
}

#[tauri::command]
pub fn session_list(
    state: State<AppState>,
    sort: SortOption,
    search: Option<String>,
    date_from: Option<String>,
    date_to: Option<String>,
) -> AppResult<Vec<SessionSummary>> {
    let conn = state.conn.lock().unwrap();

    let mut sql = String::from(
        "SELECT s.*,
            COUNT(sa.id) AS account_count,
            COALESCE(SUM(CASE WHEN sa.final_balance_cents IS NOT NULL
                THEN sa.final_balance_cents - sa.initial_balance_cents ELSE 0 END), 0) AS result_cents,
            SUM(CASE WHEN sa.final_balance_cents IS NULL THEN 1 ELSE 0 END) AS pending_count
         FROM sessions s
         LEFT JOIN session_accounts sa ON sa.session_id = s.id
         WHERE 1 = 1",
    );

    let mut query_params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(search) = search.filter(|s| !s.trim().is_empty()) {
        sql.push_str(" AND s.name LIKE ?");
        query_params.push(Box::new(format!("%{}%", search.trim())));
    }
    if let Some(from) = date_from.filter(|s| !s.trim().is_empty()) {
        sql.push_str(" AND s.session_date >= ?");
        query_params.push(Box::new(from));
    }
    if let Some(to) = date_to.filter(|s| !s.trim().is_empty()) {
        sql.push_str(" AND s.session_date <= ?");
        query_params.push(Box::new(to));
    }

    sql.push_str(" GROUP BY s.id");

    sql.push_str(match sort {
        SortOption::Newest => " ORDER BY s.session_date DESC, s.session_time DESC, s.id DESC",
        SortOption::Oldest => " ORDER BY s.session_date ASC, s.session_time ASC, s.id ASC",
        SortOption::HighestProfit => " ORDER BY result_cents DESC",
        SortOption::HighestLoss => " ORDER BY result_cents ASC",
    });

    let mut stmt = conn.prepare(&sql)?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();

    let rows = stmt.query_map(param_refs.as_slice(), |row| {
        let session = map_session(row)?;
        let account_count: i64 = row.get("account_count")?;
        let result_cents: i64 = row.get("result_cents")?;
        let pending_count: i64 = row.get("pending_count")?;
        Ok(SessionSummary {
            session,
            account_count,
            result_cents,
            has_pending: pending_count > 0,
        })
    })?;

    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

#[tauri::command]
pub fn session_exists(state: State<AppState>, id: i64) -> AppResult<bool> {
    let conn = state.conn.lock().unwrap();
    let exists: Option<i64> = conn
        .query_row("SELECT 1 FROM sessions WHERE id = ?1", [id], |r| r.get(0))
        .optional()?;
    Ok(exists.is_some())
}
