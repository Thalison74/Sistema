use tauri::State;

use crate::error::AppResult;
use crate::models::AppInfo;
use crate::state::AppState;

#[tauri::command]
pub fn app_get_info(state: State<AppState>) -> AppResult<AppInfo> {
    Ok(AppInfo {
        name: "Gerenciador de Lucros".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        data_dir: state.data_dir.to_string_lossy().to_string(),
    })
}
