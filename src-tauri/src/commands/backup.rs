use rusqlite::{Connection, OpenFlags};
use std::path::PathBuf;
use tauri::State;

use crate::db;
use crate::error::{AppError, AppResult};
use crate::state::AppState;

fn sidecar_paths(db_path: &PathBuf) -> (PathBuf, PathBuf) {
    let mut wal = db_path.clone().into_os_string();
    wal.push("-wal");
    let mut shm = db_path.clone().into_os_string();
    shm.push("-shm");
    (PathBuf::from(wal), PathBuf::from(shm))
}

fn validate_backup_file(path: &PathBuf) -> AppResult<()> {
    let conn = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)
        .map_err(|_| AppError::InvalidBackup)?;
    let table_count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name IN ('sessions', 'session_accounts')",
            [],
            |row| row.get(0),
        )
        .map_err(|_| AppError::InvalidBackup)?;
    if table_count != 2 {
        return Err(AppError::InvalidBackup);
    }
    Ok(())
}

#[tauri::command]
pub fn backup_create(state: State<AppState>, dest_path: String) -> AppResult<()> {
    let dest = PathBuf::from(&dest_path);
    if dest.exists() {
        std::fs::remove_file(&dest)?;
    }

    let conn = state.conn.lock().unwrap();
    conn.execute("VACUUM INTO ?1", [dest_path])?;
    Ok(())
}

#[tauri::command]
pub fn backup_restore(state: State<AppState>, src_path: String) -> AppResult<()> {
    let src = PathBuf::from(&src_path);
    validate_backup_file(&src)?;

    let mut guard = state.conn.lock().unwrap();

    // Force-close the current file handle before touching the file on disk.
    let temp = Connection::open_in_memory()?;
    let old = std::mem::replace(&mut *guard, temp);
    drop(old);

    let (wal, shm) = sidecar_paths(&state.db_path);
    let _ = std::fs::remove_file(wal);
    let _ = std::fs::remove_file(shm);

    std::fs::copy(&src, &state.db_path)?;

    let reopened = db::open(&state.db_path)?;
    *guard = reopened;
    Ok(())
}
