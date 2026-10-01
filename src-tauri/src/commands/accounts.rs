use rusqlite::params;
use tauri::State;

use crate::error::{AppError, AppResult};
use crate::models::Account;
use crate::repo::{map_account, now_iso};
use crate::state::AppState;

#[tauri::command]
pub fn account_add(
    state: State<AppState>,
    session_id: i64,
    name: Option<String>,
) -> AppResult<Account> {
    let conn = state.conn.lock().unwrap();

    let session_exists: i64 = conn
        .query_row("SELECT COUNT(*) FROM sessions WHERE id = ?1", [session_id], |r| r.get(0))?;
    if session_exists == 0 {
        return Err(AppError::NotFound);
    }

    let position: i64 = conn.query_row(
        "SELECT COALESCE(MAX(position), -1) + 1 FROM session_accounts WHERE session_id = ?1",
        [session_id],
        |r| r.get(0),
    )?;
    let account_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM session_accounts WHERE session_id = ?1",
        [session_id],
        |r| r.get(0),
    )?;
    let name = match name {
        Some(n) if !n.trim().is_empty() => n.trim().to_string(),
        _ => format!("Conta {:02}", account_count + 1),
    };

    let now = now_iso();
    conn.execute(
        "INSERT INTO session_accounts
            (session_id, name, initial_balance_cents, final_balance_cents, notes, position, created_at, updated_at)
         VALUES (?1, ?2, 0, NULL, NULL, ?3, ?4, ?4)",
        params![session_id, name, position, now],
    )?;
    let id = conn.last_insert_rowid();

    conn.query_row("SELECT * FROM session_accounts WHERE id = ?1", [id], map_account)
        .map_err(AppError::from)
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn account_update(
    state: State<AppState>,
    id: i64,
    name: Option<String>,
    initial_balance_cents: Option<i64>,
    final_balance_cents: Option<i64>,
    final_balance_is_pending: bool,
    notes: Option<String>,
) -> AppResult<Account> {
    let conn = state.conn.lock().unwrap();

    let current = conn
        .query_row("SELECT * FROM session_accounts WHERE id = ?1", [id], map_account)
        .map_err(|e| match e {
            rusqlite::Error::QueryReturnedNoRows => AppError::NotFound,
            other => AppError::Database(other),
        })?;

    let next_name = match name {
        Some(n) if !n.trim().is_empty() => n.trim().to_string(),
        _ => current.name,
    };
    let next_initial = initial_balance_cents.unwrap_or(current.initial_balance_cents);
    let next_final = if final_balance_is_pending {
        None
    } else {
        final_balance_cents.or(current.final_balance_cents)
    };

    let now = now_iso();
    conn.execute(
        "UPDATE session_accounts
         SET name = ?1, initial_balance_cents = ?2, final_balance_cents = ?3, notes = ?4, updated_at = ?5
         WHERE id = ?6",
        params![next_name, next_initial, next_final, notes.or(current.notes), now, id],
    )?;

    conn.query_row("SELECT * FROM session_accounts WHERE id = ?1", [id], map_account)
        .map_err(AppError::from)
}

#[tauri::command]
pub fn account_delete(state: State<AppState>, id: i64) -> AppResult<()> {
    let conn = state.conn.lock().unwrap();
    let affected = conn.execute("DELETE FROM session_accounts WHERE id = ?1", [id])?;
    if affected == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}
