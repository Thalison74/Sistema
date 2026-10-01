use rusqlite::Connection;
use std::path::Path;

use crate::error::AppResult;

const MIGRATIONS: &[&str] = &[
    // v1: initial schema
    r#"
    CREATE TABLE IF NOT EXISTS sessions (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        name            TEXT NOT NULL,
        session_date    TEXT NOT NULL,
        session_time    TEXT NOT NULL,
        notes           TEXT,
        created_at      TEXT NOT NULL,
        updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_accounts (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id              INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
        name                    TEXT NOT NULL,
        initial_balance_cents   INTEGER NOT NULL DEFAULT 0,
        final_balance_cents     INTEGER,
        notes                   TEXT,
        position                INTEGER NOT NULL DEFAULT 0,
        created_at              TEXT NOT NULL,
        updated_at              TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_session_accounts_session_id ON session_accounts(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(session_date);

    CREATE TABLE IF NOT EXISTS settings (
        key     TEXT PRIMARY KEY,
        value   TEXT NOT NULL
    );
    "#,
];

pub fn open(db_path: &Path) -> AppResult<Connection> {
    let conn = Connection::open(db_path)?;
    conn.pragma_update(None, "foreign_keys", "ON")?;
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;
    run_migrations(&conn)?;
    Ok(conn)
}

fn run_migrations(conn: &Connection) -> AppResult<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);",
    )?;

    let current_version: i64 = conn
        .query_row("SELECT COALESCE(MAX(version), 0) FROM schema_migrations", [], |row| row.get(0))
        .unwrap_or(0);

    for (index, migration) in MIGRATIONS.iter().enumerate() {
        let version = (index + 1) as i64;
        if version <= current_version {
            continue;
        }
        conn.execute_batch(migration)?;
        conn.execute(
            "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, datetime('now'))",
            [version],
        )?;
    }

    ensure_default_settings(conn)?;
    Ok(())
}

fn ensure_default_settings(conn: &Connection) -> AppResult<()> {
    conn.execute(
        "INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'system')",
        [],
    )?;
    Ok(())
}
