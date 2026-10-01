use std::collections::HashMap;
use tauri::State;

use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub fn settings_get_all(state: State<AppState>) -> AppResult<HashMap<String, String>> {
    let conn = state.conn.lock().unwrap();
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;
    let rows = stmt.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))?;
    Ok(rows.collect::<Result<HashMap<_, _>, _>>()?)
}

#[tauri::command]
pub fn settings_set(state: State<AppState>, key: String, value: String) -> AppResult<()> {
    let conn = state.conn.lock().unwrap();
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        [key, value],
    )?;
    Ok(())
}
