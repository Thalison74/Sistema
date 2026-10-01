//! Shared row-mapping helpers used by multiple command modules.

use rusqlite::{Connection, Row};

use crate::calculations::account_result_cents;
use crate::error::{AppError, AppResult};
use crate::models::{Account, Session};

pub fn map_session(row: &Row) -> rusqlite::Result<Session> {
    Ok(Session {
        id: row.get("id")?,
        name: row.get("name")?,
        session_date: row.get("session_date")?,
        session_time: row.get("session_time")?,
        notes: row.get("notes")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

pub fn map_account(row: &Row) -> rusqlite::Result<Account> {
    let initial_balance_cents: i64 = row.get("initial_balance_cents")?;
    let final_balance_cents: Option<i64> = row.get("final_balance_cents")?;
    Ok(Account {
        id: row.get("id")?,
        session_id: row.get("session_id")?,
        name: row.get("name")?,
        initial_balance_cents,
        final_balance_cents,
        notes: row.get("notes")?,
        position: row.get("position")?,
        result_cents: account_result_cents(initial_balance_cents, final_balance_cents),
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

pub fn get_session(conn: &Connection, session_id: i64) -> AppResult<Session> {
    conn.query_row(
        "SELECT * FROM sessions WHERE id = ?1",
        [session_id],
        map_session,
    )
    .map_err(|e| match e {
        rusqlite::Error::QueryReturnedNoRows => AppError::NotFound,
        other => AppError::Database(other),
    })
}

pub fn get_session_accounts(conn: &Connection, session_id: i64) -> AppResult<Vec<Account>> {
    let mut stmt = conn.prepare(
        "SELECT * FROM session_accounts WHERE session_id = ?1 ORDER BY position ASC, id ASC",
    )?;
    let accounts = stmt
        .query_map([session_id], map_account)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(accounts)
}

pub fn now_iso() -> String {
    chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string()
}
